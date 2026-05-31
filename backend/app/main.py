from fastapi import FastAPI, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.database import Base, engine, get_db
from app import schemas, crud
from app.config import settings

# Initialize database tables on startup (try-except protects unit tests from DB failures)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database table initialization deferred: {e}")

app = FastAPI(
    title="Ethara.AI API",
    description="Backend API for managing products, customers, orders, and inventory tracking.",
    version="2.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global custom exception handler to format all HTTP exceptions
# into the exact payload requested: {"message": "..."} at the root level.
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc: HTTPException):
    # Extract the detail message (either string or dict)
    message = exc.detail
    if isinstance(exc.detail, dict) and "message" in exc.detail:
        message = exc.detail["message"]
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": message}
    )


@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "Welcome to Ethara.AI Enterprise API",
        "docs_url": "/docs",
        "status": "healthy"
    }


# --- PRODUCTS ENDPOINTS ---

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, product)


@app.get("/products", response_model=List[schemas.ProductResponse], tags=["Products"])
def read_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


@app.get("/products/{id}", response_model=schemas.ProductResponse, tags=["Products"])
def read_product(id: int, db: Session = Depends(get_db)):
    return crud.get_product(db, id)


@app.put("/products/{id}", response_model=schemas.ProductResponse, tags=["Products"])
def update_product(id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db, id, product)


@app.delete("/products/{id}", response_model=schemas.ProductResponse, tags=["Products"])
def delete_product(id: int, db: Session = Depends(get_db)):
    return crud.delete_product(db, id)


# --- CUSTOMERS ENDPOINTS ---

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED, tags=["Customers"])
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, customer)


@app.get("/customers", response_model=List[schemas.CustomerResponse], tags=["Customers"])
def read_customers(db: Session = Depends(get_db)):
    return crud.get_customers(db)


@app.get("/customers/{id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def read_customer(id: int, db: Session = Depends(get_db)):
    return crud.get_customer(db, id)


@app.put("/customers/{id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def update_customer(id: int, customer: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    return crud.update_customer(db, id, customer)


@app.delete("/customers/{id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def delete_customer(id: int, db: Session = Depends(get_db)):
    return crud.delete_customer(db, id)


# --- ORDERS ENDPOINTS ---

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db, order)


@app.get("/orders", response_model=List[schemas.OrderResponse], tags=["Orders"])
def read_orders(db: Session = Depends(get_db)):
    return crud.get_orders(db)


@app.get("/orders/{id}", response_model=schemas.OrderResponse, tags=["Orders"])
def read_order(id: int, db: Session = Depends(get_db)):
    return crud.get_order(db, id)


@app.delete("/orders/{id}", response_model=schemas.OrderResponse, tags=["Orders"])
def delete_order(id: int, db: Session = Depends(get_db)):
    return crud.delete_order(db, id)


# --- DASHBOARD ENDPOINTS ---

@app.get("/dashboard/summary", response_model=schemas.DashboardSummary, tags=["Dashboard"])
def read_dashboard_summary(db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db)
