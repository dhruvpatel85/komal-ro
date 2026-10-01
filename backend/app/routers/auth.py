from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.models.user import User, OtpVerification
from app.schemas.user_schema import UserCreate, UserLogin, OtpVerify, TokenData
from app.utils.security import get_password_hash, verify_password, create_access_token, generate_otp
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(User)
        .filter((User.email == user.email) | (User.phone_number == user.phone_number))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email or Phone Number already registered")

    hashed = get_password_hash(user.password)
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        password_hash=hashed,
        role="client",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    otp = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db_otp = OtpVerification(email=user.email, otp_code=otp, expires_at=expires)
    db.add(db_otp)
    db.commit()

    # DEV: print OTP to console (no paid email service required)
    print("\n" + "=" * 50)
    print(f"  OTP for {user.email}: {otp}")
    print("=" * 50 + "\n")

    return {
        "message": "User registered successfully. Please verify your email with OTP.",
        "email": user.email,
    }


@router.post("/verify-otp")
def verify_otp(otp_data: OtpVerify, db: Session = Depends(get_db)):
    verification = (
        db.query(OtpVerification)
        .filter(
            OtpVerification.email == otp_data.email,
            OtpVerification.otp_code == otp_data.otp_code,
            OtpVerification.is_used == False,
        )
        .order_by(OtpVerification.id.desc())
        .first()
    )
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Handle both timezone-aware and naive datetimes from MySQL
    expires = verification.expires_at
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires is not None and expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")

    verification.is_used = True
    user = db.query(User).filter(User.email == otp_data.email).first()
    if user:
        user.is_email_verified = True
    db.commit()
    return {"message": "Email verified successfully. You can now login."}


@router.post("/login", response_model=TokenData)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email via OTP first")

    access_token = create_access_token(data={"user_id": user.user_id, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "role": user.role,
    }
