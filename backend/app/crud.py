from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from decimal import Decimal
from typing import List

from app import models, schemas
from app.exceptions import (
    EntityNotFoundException,
    DuplicateSKUException,
    DuplicateEmailException,
    InsufficientStockException,
    InvalidQuantityException
)

# --- PRODUCT CRUD ---

def get_product(db: Session, product_id: int) -> models.Product:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise EntityNotFoundException("Product")
    return product

def get_products(db: Session) -> List[models.Product]:
    return db.query(models.Product).order_by(models.Product.id.desc()).all()

def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    # Check unique SKU
    existing_sku = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if existing_sku:
        raise DuplicateSKUException()
    
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        stock_quantity=product.stock_quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate) -> models.Product:
    db_product = get_product(db, product_id)
    
    # If SKU is updating, check uniqueness
    if product_update.sku is not None and product_update.sku != db_product.sku:
        existing_sku = db.query(models.Product).filter(models.Product.sku == product_update.sku).first()
        if existing_sku:
            raise DuplicateSKUException()
            
    # Update fields
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int) -> models.Product:
    db_product = get_product(db, product_id)
    db.delete(db_product)
    db.commit()
    return db_product


# --- CUSTOMER CRUD ---

def get_customer(db: Session, customer_id: int) -> models.Customer:
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise EntityNotFoundException("Customer")
    return customer

def get_customers(db: Session) -> List[models.Customer]:
    return db.query(models.Customer).order_by(models.Customer.id.desc()).all()

def create_customer(db: Session, customer: schemas.CustomerCreate) -> models.Customer:
    # Check unique Email
    existing_email = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if existing_email:
        raise DuplicateEmailException()
        
    db_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def update_customer(db: Session, customer_id: int, customer_update: schemas.CustomerUpdate) -> models.Customer:
    db_customer = get_customer(db, customer_id)
    
    # If email is being updated, verify uniqueness
    if customer_update.email is not None and customer_update.email != db_customer.email:
        existing_email = db.query(models.Customer).filter(models.Customer.email == customer_update.email).first()
        if existing_email:
            raise DuplicateEmailException()
            
    # Update fields
    update_data = customer_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int) -> models.Customer:
    db_customer = get_customer(db, customer_id)
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- ORDER CRUD (MULTI-PRODUCT ATOMIC TRANSACTIONS) ---

def get_order(db: Session, order_id: int) -> models.Order:
    order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product)
        )
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise EntityNotFoundException("Order")
    return order

def get_orders(db: Session) -> List[models.Order]:
    return (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product)
        )
        .order_by(models.Order.id.desc())
        .all()
    )

def create_order(db: Session, order: schemas.OrderCreate) -> models.Order:
    # 1. Validate customer exists
    get_customer(db, order.customer_id)
    
    # 2. Use a strict database transaction context
    total_amount = Decimal("0.00")
    order_items_to_create = []
    
    try:
        # Loop through each item in the order request
        for item in order.items:
            if item.quantity <= 0:
                raise InvalidQuantityException("Quantity must be greater than zero")
                
            # Lock the product row to ensure transactional integrity (SELECT FOR UPDATE)
            product = (
                db.query(models.Product)
                .filter(models.Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if not product:
                raise EntityNotFoundException("Product")
                
            # Check stock availability
            if product.stock_quantity < item.quantity:
                raise InsufficientStockException()
                
            # Deduct stock
            product.stock_quantity -= item.quantity
            
            # Calculate item cost using locked database product price (Never trust frontend)
            item_total = product.price * Decimal(item.quantity)
            total_amount += item_total
            
            # Prepare OrderItem
            db_item = models.OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price
            )
            order_items_to_create.append(db_item)
            
        # Create Order record
        db_order = models.Order(
            customer_id=order.customer_id,
            total_amount=total_amount
        )
        db.add(db_order)
        
        # Flush to generate db_order.id
        db.flush()
        
        # Attach and save OrderItems
        for db_item in order_items_to_create:
            db_item.order_id = db_order.id
            db.add(db_item)
            
        # Commit the transaction atomically
        db.commit()
        db.refresh(db_order)
        return get_order(db, db_order.id)
        
    except Exception as e:
        # Rollback the transaction on any validation or DB failure
        db.rollback()
        raise e

def delete_order(db: Session, order_id: int) -> models.Order:
    # 1. Retrieve the order with its order items
    db_order = get_order(db, order_id)
    
    try:
        # 2. Lock and restore stock for all products in the order
        for item in db_order.items:
            product = (
                db.query(models.Product)
                .filter(models.Product.id == item.product_id)
                .with_for_update()
                .first()
            )
            if product:
                product.stock_quantity += item.quantity
                
        # 3. Delete order (cascade deletes order_items)
        db.delete(db_order)
        db.commit()
        return db_order
        
    except Exception as e:
        db.rollback()
        raise e


# --- DASHBOARD SERVICES ---

def get_dashboard_summary(db: Session) -> schemas.DashboardSummary:
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    total_customers = db.query(func.count(models.Customer.id)).scalar() or 0
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    
    # Compute active stock value (price * stock_quantity)
    active_stock_value = db.query(func.sum(models.Product.price * models.Product.stock_quantity)).scalar()
    if active_stock_value is None:
        active_stock_value = Decimal("0.00")
        
    # Retrieve low stock alerts (stock_quantity < 5)
    low_stock_products = (
        db.query(models.Product)
        .filter(models.Product.stock_quantity < 5)
        .order_by(models.Product.stock_quantity.asc())
        .all()
    )
    
    low_stock_alerts = [
        schemas.LowStockAlert(
            id=prod.id,
            name=prod.name,
            sku=prod.sku,
            stock_quantity=prod.stock_quantity
        ) for prod in low_stock_products
    ]
    
    return schemas.DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        active_stock_value=active_stock_value,
        low_stock_alerts=low_stock_alerts
    )
