from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
import datetime

from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'admin', 'company', 'fisherman'
    
    # Specific fields
    name = Column(String, nullable=True) # Full Name or Company Name
    gst_number = Column(String, nullable=True)
    wallet_balance = Column(Float, default=0.0)
    email_notifications_enabled = Column(Boolean, default=True)
    notification_email = Column(String, nullable=True)
    
    # V1 Mobile App Fields
    phone = Column(String, unique=True, index=True, nullable=True)
    location = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    otp_secret = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)

    # Relationships
    credits = relationship("Credit", back_populates="fisherman", foreign_keys='Credit.fisherman_id')
    bids = relationship("Bid", back_populates="company")
    transactions = relationship("Transaction", back_populates="winner")
    notifications = relationship("Notification", back_populates="user")


class Credit(Base):
    __tablename__ = "credits"

    id = Column(Integer, primary_key=True, index=True)
    fisherman_id = Column(Integer, ForeignKey("users.id"))
    weight = Column(Float) # in kg
    waste_type = Column(String) # e.g., 'PET Plastic', 'Fishing Net'
    gps_location = Column(String)
    collection_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="pending") # pending, verified, listed, sold
    unique_key = Column(String, unique=True, index=True, nullable=True)

    # V1 Mobile App Fields
    device_hash = Column(String, nullable=True)
    photo_path = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    credit_amount = Column(Integer, default=0)

    fisherman = relationship("User", back_populates="credits", foreign_keys=[fisherman_id])
    listing = relationship("Listing", back_populates="credit", uselist=False)


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    credit_id = Column(Integer, ForeignKey("credits.id"), unique=True)
    min_price = Column(Float)
    status = Column(String, default="active") # active, closed, cancelled
    closes_at = Column(DateTime)
    
    credit = relationship("Credit", back_populates="listing")
    bids = relationship("Bid", back_populates="listing")
    transaction = relationship("Transaction", back_populates="listing", uselist=False)


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"))
    company_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    listing = relationship("Listing", back_populates="bids")
    company = relationship("User", back_populates="bids")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), unique=True)
    winner_id = Column(Integer, ForeignKey("users.id"))
    final_price = Column(Float)
    status = Column(Boolean, default=False) # False = pending payment, True = completed
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    listing = relationship("Listing", back_populates="transaction")
    winner = relationship("User", back_populates="transactions")
    certificate = relationship("Certificate", back_populates="transaction", uselist=False)


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True)
    credit_key = Column(String, unique=True, index=True)
    company_id = Column(Integer, ForeignKey("users.id"))
    issue_date = Column(DateTime, default=datetime.datetime.utcnow)

    transaction = relationship("Transaction", back_populates="certificate")
    company = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
