from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas, dependencies
from ..database import get_db

router = APIRouter(prefix="/company", tags=["Company Profile"])

@router.get("/dashboard")
def get_company_dashboard(db: Session = Depends(get_db), current_company: models.User = Depends(dependencies.require_company)):
    # Total credits purchased
    transactions = db.query(models.Transaction).filter(
        models.Transaction.winner_id == current_company.id, 
        models.Transaction.status == True
    ).all()
    
    total_spent = sum([t.final_price for t in transactions])
    total_transactions = len(transactions)
    
    return {
        "status": "success",
        "data": {
            "wallet_balance": current_company.wallet_balance,
            "total_credits_purchased_count": total_transactions,
            "total_amount_spent": total_spent
        }
    }

@router.get("/wallet")
def get_wallet_balance(db: Session = Depends(get_db), current_company: models.User = Depends(dependencies.require_company)):
    return {"wallet_balance": current_company.wallet_balance}

@router.post("/wallet/topup")
def topup_wallet(topup: schemas.WalletTopup, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.require_company)):
    if topup.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    current_user.wallet_balance += topup.amount
    db.commit()
    db.refresh(current_user)
    
    return {"status": "success", "message": f"Added {topup.amount} to wallet. New balance: {current_user.wallet_balance}", "wallet_balance": current_user.wallet_balance}

@router.get("/transactions", response_model=list[schemas.TransactionResponse])
def get_company_transactions(db: Session = Depends(get_db), current_company: models.User = Depends(dependencies.require_company)):
    return db.query(models.Transaction).filter(models.Transaction.winner_id == current_company.id).all()

@router.get("/notifications", response_model=list[schemas.NotificationResponse])
def get_company_notifications(db: Session = Depends(get_db), current_company: models.User = Depends(dependencies.require_company)):
    return db.query(models.Notification).filter(models.Notification.user_id == current_company.id).order_by(models.Notification.created_at.desc()).all()

@router.get("/preferences")
def get_company_preferences(current_company: models.User = Depends(dependencies.require_company)):
    return {
        "status": "success",
        "data": {
            "email_notifications_enabled": current_company.email_notifications_enabled,
            "notification_email": current_company.notification_email or current_company.email
        }
    }

@router.post("/preferences")
def update_company_preferences(prefs: schemas.CompanyPreferencesUpdate, db: Session = Depends(get_db), current_company: models.User = Depends(dependencies.require_company)):
    current_company.email_notifications_enabled = prefs.email_notifications_enabled
    current_company.notification_email = prefs.notification_email
    db.commit()
    db.refresh(current_company)
    return {"status": "success", "message": "Preferences updated successfully."}
