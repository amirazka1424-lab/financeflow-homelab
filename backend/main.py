from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from database import engine, Base
from routers import auth, users, accounts, transactions, categories, goals, bills, assets, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="FinanceFlow Homelab API",
    description="Self-hosted Personal Finance API",
    version="1.0.0",
    lifespan=lifespan
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(goals.router, prefix="/api/goals", tags=["Goals"])
app.include_router(bills.router, prefix="/api/bills", tags=["Bills"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "financeflow-homelab"}
