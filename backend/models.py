from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

class AccountType(str, enum.Enum):
    cash = "cash"
    bank = "bank"
    ewallet = "ewallet"
    investment = "investment"
    credit = "credit"

class AssetType(str, enum.Enum):
    stock = "stock"
    mutual_fund = "mutual_fund"
    crypto = "crypto"
    property = "property"
    deposit = "deposit"
    other = "other"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accounts = relationship("Account", back_populates="owner")
    categories = relationship("Category", back_populates="owner")
    goals = relationship("Goal", back_populates="owner")
    bills = relationship("Bill", back_populates="owner")
    assets = relationship("Asset", back_populates="owner")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(AccountType), default=AccountType.bank)
    balance = Column(Float, default=0.0)
    currency = Column(String, default="IDR")
    color = Column(String, default="#3B82F6")
    icon = Column(String, default="bank")
    is_active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(TransactionType))
    icon = Column(String, default="tag")
    color = Column(String, default="#6B7280")
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    description = Column(String)
    notes = Column(Text)
    date = Column(DateTime(timezone=True), server_default=func.now())
    account_id = Column(Integer, ForeignKey("accounts.id"))
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    transfer_to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    account = relationship("Account", foreign_keys=[account_id], back_populates="transactions")
    category = relationship("Category", back_populates="transactions")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime(timezone=True), nullable=True)
    icon = Column(String, default="target")
    color = Column(String, default="#10B981")
    is_completed = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="goals")

class Bill(Base):
    __tablename__ = "bills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    due_day = Column(Integer)  # day of month 1-31
    category = Column(String)
    is_paid = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="bills")

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(AssetType), default=AssetType.other)
    quantity = Column(Float, default=1.0)
    buy_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    is_liability = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    owner = relationship("User", back_populates="assets")
