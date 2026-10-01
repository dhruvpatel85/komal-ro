from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from app.models.shop import Order
from app.models.services import ServiceBooking, Complaint
from app.models.user import User
from app.middleware.auth_guard import require_admin
from app.ml_engine.sales_predictor import predict_next_month_sales

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


class StatusUpdate(BaseModel):
    status: str


@router.get("/sales-analytics")
def get_sales_analytics(
    current_admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    return predict_next_month_sales(db)


@router.get("/dashboard-summary")
def get_admin_dashboard(current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    orders_count = db.query(Order).count()
    bookings_count = db.query(ServiceBooking).count()
    open_complaints = db.query(Complaint).filter(Complaint.status == "open").count()
    return {
        "message": f"Welcome Admin {current_admin.full_name}",
        "orders_count": orders_count,
        "bookings_count": bookings_count,
        "open_complaints": open_complaints,
    }


@router.get("/orders")
def get_all_orders(current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()


@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    payload: StatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    valid = ["pending", "accepted", "shipped", "delivered", "cancelled"]
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    order.status = payload.status
    db.commit()
    return {"message": f"Order {order_id} updated to {payload.status}"}


@router.get("/bookings")
def get_all_bookings(current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(ServiceBooking).order_by(ServiceBooking.scheduled_date.asc()).all()


@router.put("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    payload: StatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = payload.status
    db.commit()
    return {"message": f"Booking {booking_id} updated to {payload.status}"}


@router.get("/complaints")
def get_all_complaints(current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Complaint).order_by(Complaint.created_at.desc()).all()
