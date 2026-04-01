from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    gst_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str # 'admin', 'company', 'fisherman'

class UserResponse(UserBase):
    id: int
    role: str
    wallet_balance: float
    is_active: bool
    email_notifications_enabled: bool
    notification_email: Optional[str] = None

class CompanyPreferencesUpdate(BaseModel):
    email_notifications_enabled: bool
    notification_email: Optional[str] = None

    class Config:
        from_attributes = True

class WalletTopup(BaseModel):
    amount: float

class CreditBase(BaseModel):
    weight: float
    waste_type: str
    gps_location: str

class CreditCreate(CreditBase):
    pass

class CreditResponse(CreditBase):
    id: int
    fisherman_id: int
    collection_date: datetime
    status: str
    unique_key: Optional[str] = None

    class Config:
        from_attributes = True

class ListingCreate(BaseModel):
    credit_id: int
    min_price: float
    closes_at: datetime

class ListingResponse(BaseModel):
    id: int
    credit_id: int
    min_price: float
    status: str
    closes_at: datetime
    credit: CreditResponse

    class Config:
        from_attributes = True

class BidCreate(BaseModel):
    amount: float

class BidResponse(BaseModel):
    id: int
    listing_id: int
    company_id: int
    amount: float
    timestamp: datetime

    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: int
    listing_id: int
    winner_id: int
    final_price: float
    status: bool

    listing: ListingResponse

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    read_status: bool
    created_at: datetime

    class Config:
        from_attributes = True
