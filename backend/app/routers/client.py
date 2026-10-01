from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid
from database import get_db
from app.models.shop import Product, CartItem, Order, OrderItem, Address
from app.schemas.shop_schema import (
    ProductResponse,
    CartItemCreate,
    CartItemResponse,
    AddressCreate,
    AddressResponse,
)
from app.middleware.auth_guard import require_client
from app.models.user import User

router = APIRouter(prefix="/api/client", tags=["Client Shop"])


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0)


class CheckoutBody(BaseModel):
    payment_method: str = "cod"
    address_id: Optional[int] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class RazorpayVerifyBody(BaseModel):
    order_id: int
    razorpay_payment_id: Optional[str] = "pay_demo_ok"


@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.stock_quantity > 0).all()


@router.get("/cart", response_model=List[CartItemResponse])
def get_cart(current_user: User = Depends(require_client), db: Session = Depends(get_db)):
    return db.query(CartItem).filter(CartItem.user_id == current_user.user_id).all()


@router.post("/cart", status_code=status.HTTP_201_CREATED)
def add_to_cart(
    item: CartItemCreate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.product_id == item.product_id).first()
    if not product or product.stock_quantity < item.quantity:
        raise HTTPException(status_code=400, detail="Product not available")

    existing = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.user_id, CartItem.product_id == item.product_id)
        .first()
    )
    if existing:
        new_qty = existing.quantity + item.quantity
        if new_qty > product.stock_quantity:
            raise HTTPException(status_code=400, detail="Not enough stock")
        existing.quantity = new_qty
    else:
        db.add(
            CartItem(
                user_id=current_user.user_id,
                product_id=item.product_id,
                quantity=item.quantity,
            )
        )
    db.commit()
    return {"message": "Item added to cart"}


@router.put("/cart/{cart_item_id}")
def update_cart_item(
    cart_item_id: int,
    payload: CartItemUpdate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    item = (
        db.query(CartItem)
        .filter(CartItem.id == cart_item_id, CartItem.user_id == current_user.user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity <= 0:
        db.delete(item)
        db.commit()
        return {"message": "removed"}
    product = db.query(Product).filter(Product.product_id == item.product_id).first()
    if product and payload.quantity > product.stock_quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    item.quantity = payload.quantity
    db.commit()
    return {"message": "updated", "quantity": item.quantity}


@router.delete("/cart/{cart_item_id}")
def remove_cart_item(
    cart_item_id: int,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    item = (
        db.query(CartItem)
        .filter(CartItem.id == cart_item_id, CartItem.user_id == current_user.user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return {"message": "removed"}


@router.get("/addresses", response_model=List[AddressResponse])
def list_addresses(current_user: User = Depends(require_client), db: Session = Depends(get_db)):
    return (
        db.query(Address)
        .filter(Address.user_id == current_user.user_id)
        .order_by(Address.is_default.desc(), Address.address_id.desc())
        .all()
    )


@router.post("/addresses", response_model=AddressResponse, status_code=201)
def create_address(
    payload: AddressCreate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.user_id).update(
            {"is_default": False}
        )
    addr = Address(
        user_id=current_user.user_id,
        full_name=payload.full_name,
        phone=payload.phone,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        is_default=payload.is_default or True,
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr


@router.post("/checkout")
def checkout(
    body: CheckoutBody,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.user_id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    method = (body.payment_method or "cod").lower().strip()
    if method not in ("cod", "upi", "card", "razorpay"):
        method = "cod"

    address_id = None
    shipping_name = ""
    shipping_phone = ""
    shipping_address = ""

    if body.address_id:
        addr = (
            db.query(Address)
            .filter(
                Address.address_id == body.address_id,
                Address.user_id == current_user.user_id,
            )
            .first()
        )
        if not addr:
            raise HTTPException(status_code=400, detail="Address not found")
        address_id = addr.address_id
        shipping_name = addr.full_name
        shipping_phone = addr.phone
        shipping_address = f"{addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode}"
    else:
        if not all(
            [
                body.full_name,
                body.phone,
                body.address_line1,
                body.city,
                body.state,
                body.pincode,
            ]
        ):
            raise HTTPException(status_code=400, detail="Please fill complete address")
        addr = Address(
            user_id=current_user.user_id,
            full_name=body.full_name,
            phone=body.phone,
            address_line1=body.address_line1,
            address_line2=body.address_line2,
            city=body.city,
            state=body.state,
            pincode=body.pincode,
            is_default=True,
        )
        db.add(addr)
        db.flush()
        address_id = addr.address_id
        shipping_name = body.full_name
        shipping_phone = body.phone
        shipping_address = (
            f"{body.address_line1}, {body.city}, {body.state} - {body.pincode}"
        )

    total = 0.0
    for item in cart_items:
        product = db.query(Product).filter(Product.product_id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail="Product missing from cart")
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400, detail=f"Not enough stock for {product.name}"
            )
        total += product.price * item.quantity

    # Demo: COD = pending, everything else (incl. razorpay) = paid
    if method == "cod":
        pay_status = "pending"
        pay_ref = None
    else:
        pay_status = "paid"
        pay_ref = f"{method}_{uuid.uuid4().hex[:12]}"

    order = Order(
        user_id=current_user.user_id,
        address_id=address_id,
        shipping_name=shipping_name,
        shipping_phone=shipping_phone,
        shipping_address=shipping_address,
        total_amount=total,
        payment_method=method,
        payment_status=pay_status,
        payment_ref=pay_ref,
        status="pending",
    )
    db.add(order)
    db.flush()

    for item in cart_items:
        product = db.query(Product).filter(Product.product_id == item.product_id).first()
        db.add(
            OrderItem(
                order_id=order.order_id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_time=product.price,
            )
        )
        product.stock_quantity -= item.quantity
        db.delete(item)

    db.commit()
    db.refresh(order)

    return {
        "order_id": order.order_id,
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_method": method,
        "payment_status": pay_status,
        "shipping_name": shipping_name,
        "shipping_phone": shipping_phone,
        "shipping_address": shipping_address,
        "message": "Order placed successfully",
    }


@router.post("/payment/razorpay/verify")
def verify_razorpay(
    body: RazorpayVerifyBody,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.order_id == body.order_id, Order.user_id == current_user.user_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.payment_status = "paid"
    order.payment_ref = body.razorpay_payment_id or f"pay_{uuid.uuid4().hex[:10]}"
    db.commit()
    return {
        "message": "Payment successful",
        "order_id": order.order_id,
        "payment_status": "paid",
    }


@router.get("/orders")
def my_orders(current_user: User = Depends(require_client), db: Session = Depends(get_db)):
    rows = (
        db.query(Order)
        .filter(Order.user_id == current_user.user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [
        {
            "order_id": o.order_id,
            "total_amount": o.total_amount,
            "status": o.status,
            "payment_method": getattr(o, "payment_method", None),
            "payment_status": getattr(o, "payment_status", None),
            "shipping_address": getattr(o, "shipping_address", None),
        }
        for o in rows
    ]