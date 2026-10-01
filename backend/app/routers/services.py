from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from app.models.services import ServiceType, ServiceBooking, Complaint
from app.schemas.service_schema import (
    ServiceTypeResponse,
    BookingCreate,
    BookingResponse,
    ComplaintCreate,
    ComplaintResponse,
)
from app.middleware.auth_guard import require_client
from app.models.user import User

router = APIRouter(prefix="/api/client", tags=["Client Services"])


@router.get("/service-types", response_model=List[ServiceTypeResponse])
def get_service_types(db: Session = Depends(get_db)):
    return db.query(ServiceType).all()


@router.post("/book-service", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_service(
    booking: BookingCreate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    service = db.query(ServiceType).filter(ServiceType.service_id == booking.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service type not found")

    new_booking = ServiceBooking(
        user_id=current_user.user_id,
        service_id=booking.service_id,
        scheduled_date=booking.scheduled_date,
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@router.get("/my-bookings", response_model=List[BookingResponse])
def get_my_bookings(
    current_user: User = Depends(require_client), db: Session = Depends(get_db)
):
    return (
        db.query(ServiceBooking)
        .filter(ServiceBooking.user_id == current_user.user_id)
        .all()
    )


@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def file_complaint(
    complaint: ComplaintCreate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    new_complaint = Complaint(
        user_id=current_user.user_id,
        reference_type=complaint.reference_type,
        reference_id=complaint.reference_id,
        description=complaint.description,
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint
