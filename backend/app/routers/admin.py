from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas, dependencies
from ..database import get_db

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db), current_admin: models.User = Depends(dependencies.require_admin)):
    total_companies = db.query(models.User).filter(models.User.role == "company").count()
    total_fishermen = db.query(models.User).filter(models.User.role == "fisherman").count()
    
    total_credits = db.query(func.sum(models.Credit.weight)).scalar() or 0
    total_transaction_value = db.query(func.sum(models.Transaction.final_price)).filter(models.Transaction.status == True).scalar() or 0
    total_revenue = total_transaction_value * 0.10
    
    active_auctions = db.query(models.Listing).filter(models.Listing.status == "active").count()

    return {
        "status": "success",
        "data": {
            "total_companies": total_companies,
            "total_fishermen": total_fishermen,
            "total_credits_generated_kg": total_credits,
            "total_platform_revenue": total_revenue,
            "active_auctions": active_auctions
        }
    }

@router.get("/companies", response_model=list[schemas.UserResponse])
def get_all_companies(db: Session = Depends(get_db), current_admin: models.User = Depends(dependencies.require_admin)):
    return db.query(models.User).filter(models.User.role == "company").all()

@router.get("/fishermen", response_model=list[schemas.UserResponse])
def get_all_fishermen(db: Session = Depends(get_db), current_admin: models.User = Depends(dependencies.require_admin)):
    return db.query(models.User).filter(models.User.role == "fisherman").all()

@router.get("/credits", response_model=list[schemas.CreditResponse])
def get_all_credits(db: Session = Depends(get_db), current_admin: models.User = Depends(dependencies.require_admin)):
    return db.query(models.Credit).all()

@router.get("/transactions", response_model=list[schemas.TransactionResponse])
def get_all_transactions(db: Session = Depends(get_db), current_admin: models.User = Depends(dependencies.require_admin)):
    return db.query(models.Transaction).all()

@router.patch("/users/{user_id}/toggle-status")
def toggle_user_status(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(dependencies.require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = not user.is_active
    action = "activated" if user.is_active else "suspended"
    db.commit()
    
    return {"status": "success", "message": f"User {user.email} has been {action}.", "is_active": user.is_active}

@router.post("/simulate-auction")
def simulate_new_auction(db: Session = Depends(get_db), current_admin: models.User = Depends(dependencies.require_admin)):
    try:
        import random
        import datetime
        
        fisherman = db.query(models.User).filter(models.User.role == "fisherman").first()
        if not fisherman:
            fisherman = models.User(email=f"fisher_{random.randint(10,99)}@oceancred.com", hashed_password="pw", role="fisherman", name="Simulated Fisher")
            db.add(fisherman)
            db.commit()
            db.refresh(fisherman)

        waste_types = ["PET Bottles", "Ghost Nets", "Ocean Plastics", "Microplastics"]
        cred = models.Credit(
            fisherman_id=fisherman.id, 
            weight=round(random.uniform(10.0, 100.0), 2), 
            waste_type=random.choice(waste_types), 
            gps_location="Simulated Indian Ocean", 
            status="listed"
        )
        db.add(cred)
        db.commit()
        db.refresh(cred)

        listing = models.Listing(
            credit_id=cred.id, 
            min_price=round(random.uniform(500, 5000), 2), 
            status="active", 
            closes_at=datetime.datetime.utcnow() + datetime.timedelta(days=2)
        )
        db.add(listing)
        db.commit()
        db.refresh(listing)

        return {"status": "success", "message": f"Simulated Listing #{listing.id} generated successfully."}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Simulation crashed: {str(e)}")
