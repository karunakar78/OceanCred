from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from . import models, database, dependencies
from .routers import auth, admin, company, marketplace, live_bidding, mobile_api

models.Base.metadata.create_all(bind=database.engine)


def create_admin_seed(db: Session):
    admin_user = (
        db.query(models.User).filter(models.User.email == "admin@seacred.com").first()
    )
    if not admin_user:
        hashed_pw = dependencies.get_password_hash("admin123")
        admin = models.User(
            email="admin@seacred.com",
            hashed_password=hashed_pw,
            role="admin",
            name="Platform Admin",
        )
        db.add(admin)
        db.commit()
        print("Seed data: Admin user created - admin@seacred.com / admin123")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup - runs on startup
    db = database.SessionLocal()
    try:
        create_admin_seed(db)
    finally:
        db.close()
    yield
    # Cleanup - runs on shutdown


app = FastAPI(title="SeaCred API", lifespan=lifespan)

# Allow CORS for frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(company.router)
app.include_router(marketplace.router)
app.include_router(live_bidding.router)
app.include_router(mobile_api.router, prefix="/v1")


@app.get("/")
def root():
    return {
        "message": "Welcome to SeaCred API. Check out /docs for interactive documentation."
    }
