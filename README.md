# Inventory & Order Management System

A clean, responsive, single-product inventory and order tracking system. Built with a React frontend (Vite + Vanilla CSS) and a FastAPI backend using PostgreSQL.

## Features
- **Dashboard**: Real-time KPI summaries (Total Products, Customers, Orders, active stock value) and low-stock product alerts (stock < 5).
- **KPI Navigation**: Click on dashboard cards to navigate directly to their respective detail pages.
- **Product Management**: Full catalog actions (create, read, edit, delete) with positive stock and price validation.
- **Customer Directory**: Customer profiles with formatted name/email/phone validations.
- **Single-Product Checkout**: Order creation screen with live inventory level checks and price calculations.
- **URL Routing**: Bookmarkable URLs synchronized with detail, edit, and delete actions.
- **Dockerized**: Fully orchestrated local environment using Docker Compose.

---

## Technical Stack
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Uvicorn
- **Frontend**: React 18, Vite, Vanilla CSS, Lucide icons
- **Database**: PostgreSQL 15

---

## Local Setup

### Prerequisite
Rename `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

### Running with Docker Compose
To build and start all services (database, backend, and frontend) at once:
```bash
docker-compose up --build -d
```

Once running, you can access:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **Database**: Port 5432

To stop services:
```bash
docker-compose down
```

---

## Production Deployment

### Backend (Render)
1. Set up a Web Service on Render pointing to your backend folder.
2. Select **Docker** as the runtime environment.
3. Configure the following environment variables:
   - `DATABASE_URL`: Connection string of your Render PostgreSQL instance.
   - `PORT`: `8000`

### Frontend (Vercel)
1. Import the repository into Vercel.
2. Select `frontend` as the root folder.
3. Set Vercel's framework preset to **Vite**.
4. Configure the environment variable:
   - `VITE_API_URL`: Your hosted Render backend URL (e.g., `https://inventory-backend.onrender.com`).
5. Click **Deploy**.
