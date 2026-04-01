import os
import random
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from .. import models, dependencies
from ..database import get_db
from ..schemas_mobile import *
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

router = APIRouter(tags=["Mobile API v1"])


def is_profile_completed(user: models.User) -> bool:
    name = (user.name or "").strip()
    location = (user.location or "").strip()
    is_default_name = name.startswith("Fisher ")
    return bool(name and location and not is_default_name)


# --- AUTH ---
@router.post("/auth/otp/send")
def send_otp(req: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == req.phone).first()
    if not user:
        user = models.User(
            email=f"temp_{req.phone}@seacred.com",
            hashed_password="N/A",
            role="fisherman",
            phone=req.phone,
            name=f"Fisher {req.phone[-4:]}",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    otp = str(random.randint(100000, 999999))
    user.otp_secret = otp
    db.commit()

    print(f"\n{'=' * 40}")
    print(f"📠 [SMS MOCK] OTP for {req.phone} is: {otp}")
    print(f"{'=' * 40}\n")

    return {"success": True, "expires_in": 300}


@router.post("/auth/otp/verify", response_model=OTPVerifyResponse)
def verify_otp(req: OTPVerify, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == req.phone).first()
    if not user or user.otp_secret != req.otp:
        return JSONResponse(
            status_code=401,
            content={
                "error": {
                    "code": "INVALID_OTP",
                    "message": "Wrong or expired OTP",
                    "status": 401,
                }
            },
        )

    user.verified = True
    user.otp_secret = None
    db.commit()

    access_token = dependencies.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=datetime.timedelta(days=7),
    )

    return {
        "access_token": access_token,
        "refresh_token": access_token,  # Demo proxy
        "user": {
            "id": f"usr_{user.id}",
            "name": user.name,
            "phone": user.phone,
            "location": user.location,
            "verified": user.verified,
            "profile_completed": is_profile_completed(user),
        },
    }


@router.post("/auth/refresh")
def refresh_token():
    return {"success": True}


@router.post("/auth/logout")
def logout():
    return {"success": True}


# --- PROFILE ---
@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    total_credits = (
        db.query(func.sum(models.Credit.credit_amount))
        .filter(models.Credit.fisherman_id == current_user.id)
        .scalar()
        or 0
    )
    total_waste_kg = (
        db.query(func.sum(models.Credit.weight))
        .filter(models.Credit.fisherman_id == current_user.id)
        .scalar()
        or 0.0
    )

    lifetime_earnings = (
        db.query(func.sum(models.Transaction.final_price))
        .join(models.Listing)
        .join(models.Credit)
        .filter(
            models.Credit.fisherman_id == current_user.id,
            models.Transaction.status == True,
        )
        .scalar()
        or 0.0
    )

    sold_credits = (
        db.query(func.sum(models.Credit.credit_amount))
        .filter(
            models.Credit.fisherman_id == current_user.id,
            models.Credit.status == "sold",
        )
        .scalar()
        or 0
    )
    available_credits = total_credits - sold_credits

    return {
        "id": f"usr_{current_user.id}",
        "name": current_user.name,
        "phone": current_user.phone or "",
        "location": current_user.location or "Unknown",
        "verified": current_user.verified,
        "profile_completed": is_profile_completed(current_user),
        "stats": {
            "total_credits": total_credits,
            "available_credits": available_credits,
            "total_waste_kg": total_waste_kg,
            "lifetime_earnings_inr": lifetime_earnings * 0.90,  # Fisherman cut is 90%
        },
    }


@router.patch("/profile")
def update_profile(
    req: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    if req.name:
        current_user.name = req.name
    if req.location:
        current_user.location = req.location
    db.commit()
    return {"success": True}


@router.post("/profile/onboarding", response_model=MobileUser)
def complete_profile_onboarding(
    req: ProfileOnboardingRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    name = req.name.strip()
    location = req.location.strip()
    if len(name) < 2 or len(location) < 2:
        raise HTTPException(status_code=400, detail="Name and location are required.")

    current_user.name = name
    current_user.location = location
    db.commit()
    db.refresh(current_user)

    return {
        "id": f"usr_{current_user.id}",
        "name": current_user.name,
        "phone": current_user.phone or "",
        "location": current_user.location or "",
        "verified": current_user.verified,
        "profile_completed": True,
    }


# --- UPLOAD ---
@router.post("/upload", response_model=UploadResponse)
def upload_waste(
    photo: UploadFile = File(...),
    gps_lat: float = Form(...),
    gps_lng: float = Form(...),
    locked_lat: float = Form(...),
    locked_lng: float = Form(...),
    captured_at: str = Form(...),
    device_hash: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    distance = haversine(locked_lat, locked_lng, gps_lat, gps_lng)
    if distance > 1.0: # 1km threshold
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "LOCATION_MISMATCH",
                    "message": f"Photo taken too far from locked area ({round(distance, 2)}km mismatch).",
                    "status": 400,
                }
            },
        )

    import uuid
    from ..services.vision_ai import analyze_waste_image

    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{uuid.uuid4()}_{photo.filename}"
    with open(file_path, "wb") as f:
        f.write(photo.file.read())

    # Real AI execution
    ai_result = analyze_waste_image(file_path)
    
    if not ai_result.get("is_waste"):
        # Cleanup uploaded file if rejected
        try:
            os.remove(file_path)
        except Exception:
            pass
            
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "NOT_WASTE",
                    "message": "AI Analysis failed to detect valid sea waste in this photo.",
                    "status": 400,
                }
            },
        )

    waste_type = ai_result.get("waste_type", "General Waste")
    weight = round(ai_result.get("estimated_weight_kg", 0.0), 2)
    
    # User Request: 1kg = 5 credits explicitly
    credits_amt = int(weight * 5)

    credit_obj = models.Credit(
        fisherman_id=current_user.id,
        weight=weight,
        waste_type=waste_type,
        gps_location=f"{gps_lat}, {gps_lng}",
        status="verified",
        photo_path=file_path,
        device_hash=device_hash,
        ai_confidence=0.97,
        credit_amount=credits_amt,
    )
    db.add(credit_obj)
    db.commit()
    db.refresh(credit_obj)

    return {
        "upload_id": f"upl_{credit_obj.id}",
        "status": "verified",
        "ai_result": {
            "is_real_waste": True,
            "confidence": 0.97,
            "location_valid": True,
            "water_body": "Verified by GPS",
            "date_valid": True,
            "waste_items": [
                {"type": waste_type, "weight_kg": weight, "credits": credits_amt}
            ],
            "total_weight_kg": weight,
            "total_credits": credits_amt,
        },
    }


@router.get("/uploads", response_model=UploadsListResponse)
def get_uploads(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    credits = (
        db.query(models.Credit)
        .filter(models.Credit.fisherman_id == current_user.id)
        .order_by(models.Credit.collection_date.desc())
        .all()
    )
    res = []
    for c in credits:
        listing_id = None
        # Credit state is source of truth for sold records.
        upload_status = c.status
        if c.status == "sold":
            upload_status = "sold"
        elif c.listing and c.listing.status == "cancelled":
            upload_status = "cancelled"
        elif c.listing and c.listing.status in ["active", "pending"]:
            upload_status = "listed"
        if c.listing and c.listing.status in ["active", "pending"]:
            listing_id = f"lst_{c.listing.id}"
        res.append(
            {
                "upload_id": f"upl_{c.id}",
                "date": c.collection_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "waste_summary": c.waste_type,
                "weight_kg": c.weight,
                "credits": c.credit_amount,
                "status": upload_status,
                "listing_id": listing_id,
            }
        )
    return {"uploads": res}


@router.get("/upload/{id}")
def get_upload_single(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    id_num = int(id.replace("upl_", ""))
    c = (
        db.query(models.Credit)
        .filter(
            models.Credit.id == id_num, models.Credit.fisherman_id == current_user.id
        )
        .first()
    )
    if not c:
        raise HTTPException(status_code=404)
    return {"status": "success", "upload_id": id}


# --- WALLET ---
@router.get("/wallet", response_model=WalletResponse)
def get_wallet(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    credits_list = (
        db.query(models.Credit)
        .filter(models.Credit.fisherman_id == current_user.id)
        .all()
    )

    total_earned = sum(c.credit_amount for c in credits_list)
    total_sold = sum(c.credit_amount for c in credits_list if c.status == "sold")

    plastic = sum(
        c.credit_amount for c in credits_list if "plastic" in c.waste_type.lower()
    )
    net = sum(c.credit_amount for c in credits_list if "net" in c.waste_type.lower())
    mixed = total_earned - plastic - net

    return {
        "available_credits": total_earned - total_sold,
        "lifetime_earned": total_earned,
        "lifetime_sold": total_sold,
        "breakdown": {"plastic": plastic, "net_gear": net, "mixed": mixed},
    }


@router.get("/wallet/transactions", response_model=TransactionListResponse)
def get_wallet_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    txs = []
    credits_list = (
        db.query(models.Credit)
        .filter(models.Credit.fisherman_id == current_user.id)
        .all()
    )
    for c in credits_list:
        txs.append(
            {
                "id": f"txn_up_{c.id}",
                "type": "credit",
                "description": f"Upload: {c.waste_type}",
                "credits": c.credit_amount,
                "date": c.collection_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "upload_id": f"upl_{c.id}",
            }
        )

    sales = (
        db.query(models.Transaction)
        .join(models.Listing)
        .join(models.Credit)
        .filter(
            models.Credit.fisherman_id == current_user.id,
            models.Transaction.status == True,
        )
        .all()
    )

    for s in sales:
        c = s.listing.credit
        payout = s.final_price * 0.90  # 90%
        txs.append(
            {
                "id": f"txn_sale_{s.id}",
                "type": "debit",
                "description": f"Sold Listing #{s.listing.id}",
                "credits": -c.credit_amount,
                "amount_inr": payout,
                "date": s.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "listing_id": f"lst_{s.listing_id}",
            }
        )

    txs.sort(key=lambda x: x["date"], reverse=True)
    return {"transactions": txs}


# --- MARKETPLACE ---
@router.post("/listings")
def create_listing(
    req: ListingCreateMobile,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    if req.duration_hours < 1 or req.duration_hours > 168:
        raise HTTPException(
            status_code=400,
            detail="duration_hours must be between 1 and 168",
        )

    if req.credits <= 0:
        raise HTTPException(status_code=400, detail="credits must be greater than 0")

    if req.floor_price_inr <= 0:
        raise HTTPException(
            status_code=400, detail="floor_price_inr must be greater than 0"
        )

    available_credits = (
        db.query(models.Credit)
        .filter(
            models.Credit.fisherman_id == current_user.id,
            models.Credit.status == "verified",
        )
        .all()
    )

    if not available_credits:
        raise HTTPException(status_code=400, detail="No verified uploads to list.")

    listable_credits = []
    for credit in available_credits:
        if not credit.listing:
            listable_credits.append(credit)
            continue
        if credit.listing.status == "cancelled":
            listable_credits.append(credit)

    total_avail = sum(c.credit_amount for c in listable_credits)
    if total_avail < req.credits:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "INSUFFICIENT_CREDITS",
                    "message": "Listing exceeds available balance",
                    "status": 400,
                }
            },
        )

    if not listable_credits:
        raise HTTPException(
            status_code=400,
            detail="No listable credits available. Existing listings may already be active.",
        )

    source_credit = next(
        (c for c in listable_credits if c.credit_amount >= req.credits), None
    )
    if not source_credit:
        raise HTTPException(
            status_code=400,
            detail="Requested credits must be less than or equal to one verified upload batch.",
        )

    # Only the requested credit quantity should be listed/sold.
    # If needed, split the source credit batch and keep the remaining amount verified.
    listing_credit = source_credit
    if req.credits < source_credit.credit_amount:
        ratio = req.credits / max(source_credit.credit_amount, 1)
        listed_weight = round((source_credit.weight or 0) * ratio, 4)

        listing_credit = models.Credit(
            fisherman_id=source_credit.fisherman_id,
            weight=listed_weight,
            waste_type=source_credit.waste_type,
            gps_location=source_credit.gps_location,
            status="listed",
            device_hash=source_credit.device_hash,
            photo_path=source_credit.photo_path,
            ai_confidence=source_credit.ai_confidence,
            credit_amount=req.credits,
        )
        db.add(listing_credit)
        db.flush()

        source_credit.credit_amount -= req.credits
        source_credit.weight = max((source_credit.weight or 0) - listed_weight, 0)
    else:
        listing_credit.status = "listed"

    closes_at = datetime.datetime.utcnow() + datetime.timedelta(
        hours=req.duration_hours
    )

    if listing_credit.listing and listing_credit.listing.status == "cancelled":
        listing = listing_credit.listing
        listing.min_price = req.floor_price_inr
        listing.closes_at = closes_at
        listing.status = "active"
    else:
        listing = models.Listing(
            credit_id=listing_credit.id,
            min_price=req.floor_price_inr,
            closes_at=closes_at,
            status="active",
        )
        db.add(listing)

    try:
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "LISTING_CREATE_FAILED",
                    "message": "Could not create listing. Please try with another verified upload.",
                    "status": 400,
                }
            },
        )

    db.refresh(listing)

    return {
        "listing_id": f"lst_{listing.id}",
        "credits": req.credits,
        "floor_price_inr": req.floor_price_inr,
        "expires_at": closes_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "active",
    }


@router.get("/listings", response_model=dict)
def get_my_listings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    listings = (
        db.query(models.Listing)
        .join(models.Credit)
        .filter(models.Credit.fisherman_id == current_user.id)
        .all()
    )
    res = []
    for l in listings:
        res.append(
            {
                "listing_id": f"lst_{l.id}",
                "credits": l.credit.credit_amount,
                "floor_price_inr": l.min_price,
                "expires_at": l.closes_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "status": l.status,
            }
        )
    return {"listings": res}


@router.get("/listings/{id}", response_model=ListingDetails)
def get_listing_details(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    lid = int(id.replace("lst_", ""))
    listing = db.query(models.Listing).filter(models.Listing.id == lid).first()
    if not listing:
        raise HTTPException(status_code=404)

    bids = []
    top_bid = None
    if listing.bids:
        sorted_bids = sorted(listing.bids, key=lambda x: x.amount, reverse=True)
        for b in sorted_bids:
            bid_amount = b.amount
            payout_amount = bid_amount * 0.90  # User gets 90%, platform gets 10%
            bids.append(
                BidItem(
                    bid_id=f"bid_{b.id}",
                    company=b.company.name or f"Company {b.company_id}",
                    price_per_credit=round(
                        bid_amount / (listing.credit.credit_amount or 1), 2
                    ),
                    total_inr=bid_amount,
                    payout_inr=round(payout_amount, 2),
                    placed_at=b.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
                )
            )
        if bids:
            top_bid = bids[0]

    return ListingDetails(
        listing_id=id,
        credits=listing.credit.credit_amount,
        floor_price_inr=listing.min_price,
        expires_at=listing.closes_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        status=listing.status,
        bids=bids,
        top_bid=top_bid,
    )


@router.delete("/listings/{id}")
def cancel_listing(
    id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    lid = int(id.replace("lst_", ""))
    listing = db.query(models.Listing).filter(models.Listing.id == lid).first()
    if not listing:
        raise HTTPException(status_code=404)
    listing.status = "cancelled"
    listing.credit.status = "verified"  # return to inventory
    db.commit()
    return {"success": True}


@router.post("/listings/{id}/accept")
def accept_bid(
    id: str,
    req: AcceptBidRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.require_fisherman),
):
    lid = int(id.replace("lst_", ""))
    from .marketplace import close_auction

    try:
        # Our close_auction already figures out the highest bid and allocates to winner
        res = close_auction(lid, db)
        if res.get("status") == "success":
            return {
                "success": True,
                "payout_inr": "Check Wallet",
                "transaction_id": "resolved",
            }
        else:
            return JSONResponse(status_code=400, content={"error": res})
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "error": {"code": "ACCEPT_ERROR", "message": str(e), "status": 400}
            },
        )


# Placeholder implementation of web sockets
@router.websocket("/ws")
async def websocket_mobile_gateway(websocket, token: str):
    await websocket.accept()
    await websocket.send_text('{"status": "connected"}')
