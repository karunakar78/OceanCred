from app.database import SessionLocal, engine
from app import models
from datetime import datetime, timedelta

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Check if filled
if not db.query(models.User).filter(models.User.role == "fisherman").first():
    print("Seeding Fisherman & Listing...")
    fish = models.User(
        email="fisherman@seacred.com",
        hashed_password="pw",
        role="fisherman",
        name="Rajesh Kumar",
    )
    db.add(fish)
    db.commit()
    db.refresh(fish)

    cred = models.Credit(
        fisherman_id=fish.id,
        weight=45.5,
        waste_type="PET Bottles + Nets",
        gps_location="Arabian Sea (12.4°N 74.2°E)",
        status="listed",
    )
    db.add(cred)
    db.commit()
    db.refresh(cred)

    listing = models.Listing(
        credit_id=cred.id,
        min_price=1500,
        status="active",
        closes_at=datetime.utcnow() + timedelta(days=2),
    )
    db.add(listing)
    db.commit()

    print("Marketplace seeded!")
else:
    print("Already seeded.")
db.close()
