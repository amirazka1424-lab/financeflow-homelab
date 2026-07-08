from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

# ── Enums ──────────────────────────────────────────────────────────────────────
class TransactionType(str, Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

class AccountType(str, Enum):
    bank = "bank"
    ewallet = "ewallet"
    cash = "cash"
    investment = "investment"
    credit = "credit"

class AssetType(str, Enum):
    stock = "stock"
    mutual_fund = "mutual_fund"
    crypto = "crypto"
    deposit = "deposit"
    property = "property"
    other = "other"

class LiabilityType(str, Enum):
    loan = "loan"
    mortgage = "mortgage"
    credit_card = "credit_card"
    other = "other"

# ── User ───────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    currency: str
    timezone: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ── Auth ───────────────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[int] = None

# ── Account ────────────────────────────────────────────────────────────────────
class AccountCreate(BaseModel):
    name: str
    type: AccountType
    balance: Decimal = Decimal('0')
    currency: str = 'IDR'
    color: str = '#6366f1'
    icon: Optional[str] = None
    note: Optional[str] = None

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AccountType] = None
    balance: Optional[Decimal] = None
    currency: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    note: Optional[str] = None
    is_active: Optional[bool] = None

class AccountOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: AccountType
    balance: Decimal
    currency: str
    color: str
    icon: Optional[str] = None
    note: Optional[str] = None
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ── Category ───────────────────────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    type: TransactionType
    color: str = '#6366f1'
    icon: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class CategoryOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: TransactionType
    color: str
    icon: Optional[str] = None
    is_default: bool
    class Config:
        from_attributes = True

# ── Transaction ────────────────────────────────────────────────────────────────
class TransactionCreate(BaseModel):
    account_id: int
    to_account_id: Optional[int] = None
    category_id: Optional[int] = None
    type: TransactionType
    amount: Decimal
    date: date
    note: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None

class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    category_id: Optional[int] = None
    type: Optional[TransactionType] = None
    amount: Optional[Decimal] = None
    date: Optional[date] = None
    note: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None

class TransactionOut(BaseModel):
    id: int
    user_id: int
    account_id: int
    to_account_id: Optional[int] = None
    category_id: Optional[int] = None
    type: TransactionType
    amount: Decimal
    date: date
    note: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    account_name: Optional[str] = None
    category_name: Optional[str] = None
    class Config:
        from_attributes = True

# ── Goal ───────────────────────────────────────────────────────────────────────
class GoalCreate(BaseModel):
    name: str
    target_amount: Decimal
    current_amount: Decimal = Decimal('0')
    deadline: Optional[date] = None
    account_id: Optional[int] = None
    color: str = '#10b981'
    icon: Optional[str] = None
    note: Optional[str] = None

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    current_amount: Optional[Decimal] = None
    deadline: Optional[date] = None
    account_id: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    note: Optional[str] = None
    is_completed: Optional[bool] = None

class GoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: Optional[date] = None
    account_id: Optional[int] = None
    color: str
    icon: Optional[str] = None
    note: Optional[str] = None
    is_completed: bool
    progress_pct: float
    created_at: datetime
    class Config:
        from_attributes = True

# ── Bill ───────────────────────────────────────────────────────────────────────
class BillCreate(BaseModel):
    name: str
    amount: Decimal
    due_day: int  # 1-31
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    color: str = '#f59e0b'
    icon: Optional[str] = None
    is_auto_debit: bool = False
    note: Optional[str] = None

class BillUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    due_day: Optional[int] = None
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_auto_debit: Optional[bool] = None
    note: Optional[str] = None
    is_active: Optional[bool] = None

class BillOut(BaseModel):
    id: int
    user_id: int
    name: str
    amount: Decimal
    due_day: int
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    color: str
    icon: Optional[str] = None
    is_auto_debit: bool
    note: Optional[str] = None
    is_active: bool
    next_due_date: Optional[date] = None
    created_at: datetime
    class Config:
        from_attributes = True

# ── Asset / Liability ──────────────────────────────────────────────────────────
class AssetCreate(BaseModel):
    name: str
    type: AssetType
    current_value: Decimal
    buy_price: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    ticker: Optional[str] = None
    note: Optional[str] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AssetType] = None
    current_value: Optional[Decimal] = None
    buy_price: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    ticker: Optional[str] = None
    note: Optional[str] = None
    is_active: Optional[bool] = None

class AssetOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: AssetType
    current_value: Decimal
    buy_price: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    ticker: Optional[str] = None
    note: Optional[str] = None
    is_active: bool
    gain_loss: Optional[Decimal] = None
    created_at: datetime
    class Config:
        from_attributes = True

class LiabilityCreate(BaseModel):
    name: str
    type: LiabilityType
    amount: Decimal
    interest_rate: Optional[Decimal] = None
    due_date: Optional[date] = None
    note: Optional[str] = None

class LiabilityOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: LiabilityType
    amount: Decimal
    interest_rate: Optional[Decimal] = None
    due_date: Optional[date] = None
    note: Optional[str] = None
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ── Dashboard / Report ─────────────────────────────────────────────────────────
class DashboardSummary(BaseModel):
    total_balance: Decimal
    total_income: Decimal
    total_expense: Decimal
    net_worth: Decimal
    saving_ratio: float
    total_assets: Decimal
    total_liabilities: Decimal
    accounts: List[AccountOut]

class MonthlyCashflow(BaseModel):
    month: str
    income: Decimal
    expense: Decimal
    net: Decimal

class CategoryExpense(BaseModel):
    category_id: Optional[int]
    category_name: str
    color: str
    total: Decimal
    pct: float
