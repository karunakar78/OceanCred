from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from .. import models, schemas, dependencies
from ..database import get_db

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("", response_model=list[schemas.ListingResponse])
def get_all_listings(db: Session = Depends(get_db)):
    return db.query(models.Listing).filter(models.Listing.status == "active").all()


@router.get("/{listing_id}", response_model=schemas.ListingResponse)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.post("/{listing_id}/bid", response_model=schemas.BidResponse)
def place_bid(
    listing_id: int,
    bid: schemas.BidCreate,
    db: Session = Depends(get_db),
    current_company: models.User = Depends(dependencies.require_company),
):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing or listing.status != "active":
        raise HTTPException(
            status_code=400, detail="Listing is not active or doesn't exist."
        )

    if datetime.utcnow() > listing.closes_at:
        raise HTTPException(status_code=400, detail="Auction has already closed.")

    highest_bid = (
        db.query(models.Bid)
        .filter(models.Bid.listing_id == listing_id)
        .order_by(models.Bid.amount.desc())
        .first()
    )
    scaled_min_price = listing.min_price * 1.10
    current_highest = highest_bid.amount if highest_bid else scaled_min_price

    if bid.amount <= current_highest:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be higher than current highest bid or min price: {current_highest:.2f}",
        )

    if current_company.wallet_balance < bid.amount:
        raise HTTPException(
            status_code=400, detail="Insufficient wallet balance to place this bid."
        )

    new_bid = models.Bid(
        listing_id=listing_id, company_id=current_company.id, amount=bid.amount
    )
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)

    # Fisherman gets a push when the app is backgrounded (Expo Push; token from mobile PATCH /profile)
    try:
        fisherman = (
            db.query(models.User)
            .filter(models.User.id == listing.credit.fisherman_id)
            .first()
        )
        token = getattr(fisherman, "expo_push_token", None) if fisherman else None
        if token:
            from ..expo_push import send_expo_push_notification

            send_expo_push_notification(
                token,
                title="New bid on your auction",
                body=f"₹{bid.amount:,.0f} on listing #{listing_id}. Open SeaCred to review.",
                data={
                    "type": "bid_received",
                    "listing_id": listing_id,
                },
            )
    except Exception as e:
        print(f"[place_bid] expo push skipped: {e}")

    return new_bid


@router.post("/{listing_id}/close", tags=["System Task"])
def close_auction(listing_id: int, db: Session = Depends(get_db)):
    """
    In a real app, this would be triggered by a background job (Celery).
    For now, an admin or testing script can call this to finalize.
    """
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status != "active":
        raise HTTPException(
            status_code=400, detail="Listing is already closed or cancelled"
        )

    # Get highest bid
    highest_bid = (
        db.query(models.Bid)
        .filter(models.Bid.listing_id == listing_id)
        .order_by(models.Bid.amount.desc())
        .first()
    )

    if not highest_bid:
        # Close without winner
        listing.status = "closed"
        db.commit()
        return {"status": "success", "message": "Auction closed with no bids."}

    winner = (
        db.query(models.User).filter(models.User.id == highest_bid.company_id).first()
    )
    fisherman = listing.credit.fisherman

    # Wallet Transactions (Simulated Payment)
    if winner.wallet_balance < highest_bid.amount:
        # Default behavior: Winner fails to pay. Can put listing back online.
        listing.status = "failed_payment"
        db.commit()
        return {
            "status": "failed",
            "message": "Company doesn't have sufficient balance to pay.",
        }

    # Deduct from company
    winner.wallet_balance -= highest_bid.amount

    # Calculate 10% Admin Cut
    admin_cut = highest_bid.amount * 0.10
    fisherman_cut = highest_bid.amount - admin_cut

    # Give it to fisherman
    fisherman.wallet_balance += fisherman_cut

    # Give it to admin
    admin_user = db.query(models.User).filter(models.User.role == "admin").first()
    if admin_user:
        admin_user.wallet_balance += admin_cut

    listing.status = "closed"
    listing.credit.status = "sold"

    # Create Transaction record
    transaction = models.Transaction(
        listing_id=listing.id,
        winner_id=winner.id,
        final_price=highest_bid.amount,
        status=True,  # Boolean representing payment success
    )
    db.add(transaction)

    # Create Notification record
    notification = models.Notification(
        user_id=winner.id,
        message=f"You won the auction for Listing #{listing.id}! {highest_bid.amount} deducted from your wallet.",
    )
    db.add(notification)
    db.commit()  # commit initially to get transaction ID

    # Generate Authentication Certificate
    import uuid

    credit_key = str(uuid.uuid4()).upper()[
        :12
    ]  # e.g. "9F4E-2B1A-..." but without dashes
    listing.credit.unique_key = credit_key

    cert = models.Certificate(
        transaction_id=transaction.id, credit_key=credit_key, company_id=winner.id
    )
    db.add(cert)
    db.commit()

    from ..email_utils import generate_invoice_pdf, send_email

    # Email the winner (uses preferred notification_email when set; real SMTP if .env configured)
    if winner.email_notifications_enabled:
        email_to = winner.notification_email or winner.email
        pdf_path = generate_invoice_pdf(
            transaction_id=transaction.id,
            winner_name=winner.name or "Company",
            final_price=highest_bid.amount,
            credit_key=credit_key,
            date_str=datetime.utcnow().strftime("%Y-%m-%d"),
        )
        body = f"Congratulations {winner.name}!\n\nYou have won the auction for Listing #{listing.id}. Please find your ESG certificate invoice attached.\n\nThank you for trusting SeaCred."
        send_email(email_to, f"You Won Listing #{listing.id}!", body, pdf_path)

    # Notify losers
    all_bids = db.query(models.Bid).filter(models.Bid.listing_id == listing_id).all()
    loser_ids = set([b.company_id for b in all_bids if b.company_id != winner.id])
    for l_id in loser_ids:
        loser = db.query(models.User).filter(models.User.id == l_id).first()
        if loser and loser.email_notifications_enabled:
            email_to = loser.notification_email or loser.email
            body = f"Hello {loser.name},\n\nUnfortunately, you were outbid on Listing #{listing.id} and the auction has closed.\n\nCheck out the live marketplace for more opportunities!"
            send_email(
                email_to, f"Auction Closed: Outbid on Listing #{listing.id}", body
            )

    return {
        "status": "success",
        "message": f"Auction closed. Credit Key {credit_key} awarded to {winner.name}.",
    }


@router.get("/verify/{credit_key}")
def verify_credit(credit_key: str, db: Session = Depends(get_db)):
    cert = (
        db.query(models.Certificate)
        .filter(models.Certificate.credit_key == credit_key)
        .first()
    )
    if not cert:
        raise HTTPException(
            status_code=404, detail="Invalid Credit Key. No certificate found."
        )

    credit = (
        db.query(models.Credit).filter(models.Credit.unique_key == credit_key).first()
    )
    if not credit:
        raise HTTPException(status_code=404, detail="Credit data missing for this key.")

    company = db.query(models.User).filter(models.User.id == cert.company_id).first()
    fisherman = (
        db.query(models.User).filter(models.User.id == credit.fisherman_id).first()
    )

    return {
        "status": "success",
        "data": {
            "credit_key": credit_key,
            "weight_kg": credit.weight,
            "waste_type": credit.waste_type,
            "gps_location": credit.gps_location,
            "collection_date": credit.collection_date,
            "allotted_to_company": company.name if company else "Unknown",
            "collected_by": fisherman.name if fisherman else "Verified Fisherman",
            "issue_date": cert.issue_date,
        },
    }
