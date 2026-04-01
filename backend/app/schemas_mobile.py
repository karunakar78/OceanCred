from pydantic import BaseModel
from typing import Optional, List, Dict

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class MobileUser(BaseModel):
    id: str
    name: Optional[str] = None
    phone: str
    location: Optional[str] = None
    verified: bool

class OTPVerifyResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: MobileUser

class UserStats(BaseModel):
    total_credits: int
    available_credits: int
    total_waste_kg: float
    lifetime_earnings_inr: float

class ProfileResponse(MobileUser):
    stats: UserStats

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None

class WasteItem(BaseModel):
    type: str
    weight_kg: float
    credits: int

class AIResult(BaseModel):
    is_real_waste: bool
    confidence: float
    location_valid: bool
    water_body: str
    date_valid: bool
    waste_items: List[WasteItem]
    total_weight_kg: float
    total_credits: int

class UploadResponse(BaseModel):
    upload_id: str
    status: str
    ai_result: AIResult

class UploadSummary(BaseModel):
    upload_id: str
    date: str
    waste_summary: str
    weight_kg: float
    credits: int
    status: str

class UploadsListResponse(BaseModel):
    uploads: List[UploadSummary]

class WalletBreakdown(BaseModel):
    plastic: int
    net_gear: int
    mixed: int

class WalletResponse(BaseModel):
    available_credits: int
    lifetime_earned: int
    lifetime_sold: int
    breakdown: WalletBreakdown

class TransactionItem(BaseModel):
    id: str
    type: str # 'credit' | 'debit'
    description: str
    credits: int
    amount_inr: Optional[float] = None
    date: str
    upload_id: Optional[str] = None
    listing_id: Optional[str] = None

class TransactionListResponse(BaseModel):
    transactions: List[TransactionItem]

class ListingCreateMobile(BaseModel):
    credits: int
    floor_price_inr: float
    duration_hours: int

class BidItem(BaseModel):
    bid_id: str
    company: str
    price_per_credit: float
    total_inr: float
    placed_at: str

class ListingDetails(BaseModel):
    listing_id: str
    credits: int
    floor_price_inr: float
    expires_at: str
    status: str
    bids: Optional[List[BidItem]] = None
    top_bid: Optional[BidItem] = None

class AcceptBidRequest(BaseModel):
    bid_id: str
