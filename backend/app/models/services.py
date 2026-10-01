from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ServiceType(Base):
    __tablename__ = "service_types"

    service_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    service_name = Column(String(100), nullable=False)
    base_charge = Column(Float, default=0.0)


class ServiceBooking(Base):
    __tablename__ = "service_bookings"

    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    service_id = Column(Integer, ForeignKey("service_types.service_id"), nullable=False)
    scheduled_date = Column(DateTime, nullable=False)
    status = Column(
        Enum("pending", "accepted", "completed", "cancelled", name="booking_status"),
        default="pending",
    )
    created_at = Column(DateTime, server_default=func.now())

    service_type = relationship("ServiceType")


class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    reference_type = Column(
        Enum("order", "booking", "general", name="ref_type"), nullable=False
    )
    reference_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    status = Column(
        Enum("open", "in_progress", "resolved", name="complaint_status"),
        default="open",
    )
    created_at = Column(DateTime, server_default=func.now())
