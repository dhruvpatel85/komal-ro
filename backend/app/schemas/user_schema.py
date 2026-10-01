from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OtpVerify(BaseModel):
    email: EmailStr
    otp_code: str


class TokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
