from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ServiceTypeResponse(BaseModel):
    service_id: int
    service_name: str
    base_charge: float

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    service_id: int
    scheduled_date: datetime


class BookingResponse(BaseModel):
    booking_id: int
    service_id: int
    scheduled_date: datetime
    status: str
    service_type: Optional[ServiceTypeResponse] = None

    class Config:
        from_attributes = True


class ComplaintCreate(BaseModel):
    reference_type: str = "general"
    reference_id: Optional[int] = None
    description: str


class ComplaintResponse(BaseModel):
    complaint_id: int
    reference_type: str
    reference_id: Optional[int] = None
    description: str
    status: str

    class Config:
        from_attributes = True
