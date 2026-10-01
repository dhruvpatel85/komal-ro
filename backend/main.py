from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import models so tables are registered
from app.models.user import User, OtpVerification  # noqa: F401
from app.models.shop import Product, CartItem, Order, OrderItem, Address  # noqa: F401
from app.models.services import ServiceType, ServiceBooking, Complaint  # noqa: F401

from app.routers import auth, client, services, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Komal RO System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(auth.router)
app.include_router(client.router)
app.include_router(services.router)
app.include_router(admin.router)


@app.get("/")
def read_root():
    return {"message": "Komal RO Backend API is running!", "docs": "/docs"}
