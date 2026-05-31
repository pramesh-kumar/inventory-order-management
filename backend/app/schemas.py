from pydantic import BaseModel, Field, EmailStr, field_validator
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
import re

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the product")
    sku: str = Field(..., min_length=1, description="Unique stock keeping unit code")
    price: Decimal = Field(..., gt=0, description="Price of the product")
    stock_quantity: int = Field(..., ge=0, description="Quantity in stock")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    sku: Optional[str] = Field(None, min_length=1)
    price: Optional[Decimal] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    full_name: str = Field(..., description="Full name of the customer")
    email: EmailStr = Field(..., description="Unique email address of the customer")
    phone_number: str = Field(..., description="Contact phone number")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if not v:
            raise ValueError("Name is required")
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("full_name must be at least 2 characters long")
        return trimmed

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: EmailStr) -> str:
        # Standardize email to lowercase and stripped
        return v.strip().lower()

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        if not v:
            raise ValueError("phone_number is required")
        # Normalize: Remove all non-digit characters (spaces, hyphens, plus signs, parentheses, etc.)
        normalized = re.sub(r"\D", "", v)
        # Check length
        if not (10 <= len(normalized) <= 15):
            raise ValueError("Phone number must be between 10 and 15 digits")
        return normalized

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None)
    email: Optional[EmailStr] = Field(None)
    phone_number: Optional[str] = Field(None)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("full_name must be at least 2 characters long")
        return trimmed

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[EmailStr]) -> Optional[EmailStr]:
        if v is None:
            return v
        return v.strip().lower()

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        normalized = re.sub(r"\D", "", v)
        if not (10 <= len(normalized) <= 15):
            raise ValueError("Phone number must be between 10 and 15 digits")
        return normalized

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True


# --- ORDER SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="Reference to the product")
    quantity: int = Field(..., gt=0, description="Quantity of product ordered")

class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="Reference to the customer")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items ordered")

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    customer: CustomerResponse
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


# --- DASHBOARD SCHEMAS ---
class LowStockAlert(BaseModel):
    id: int
    name: str
    sku: str
    stock_quantity: int

class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    active_stock_value: Decimal
    low_stock_alerts: List[LowStockAlert]
