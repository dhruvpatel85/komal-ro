from pydantic import BaseModel, Field
from typing import Optional, List


class ProductResponse(BaseModel):
    product_id: int
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True


class AddressCreate(BaseModel):
    full_name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10)
    address_line1: str = Field(..., min_length=3)
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str = Field(..., min_length=4)
    is_default: bool = False


class AddressResponse(BaseModel):
    address_id: int
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    is_default: bool

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    address_id: Optional[int] = None
    # Or pass a new address inline
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    payment_method: str = "cod"  # cod | upi | card


class OrderResponse(BaseModel):
    order_id: int
    total_amount: float
    status: str
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    shipping_name: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_address: Optional[str] = None

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)