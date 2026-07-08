from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from decimal import Decimal

from database import get_db
from models import Transaction, Account, Category, User
from schemas import TransactionCreate, TransactionUpdate, TransactionOut
from routers.auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _apply_balance(trx: Transaction, account: Account, to_account: Optional[Account], reverse: bool = False):
    """Apply or reverse a transaction's effect on account balances."""
    multiplier = Decimal('-1') if reverse else Decimal('1')
    if trx.type == 'income':
        account.balance += multiplier * trx.amount
    elif trx.type == 'expense':
        account.balance -= multiplier * trx.amount
    elif trx.type == 'transfer' and to_account:
        account.balance -= multiplier * trx.amount
        to_account.balance += multiplier * trx.amount


@router.get("/", response_model=List[TransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    type: Optional[str] = Query(None),
    account_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if type:
        q = q.filter(Transaction.type == type)
    if account_id:
        q = q.filter(Transaction.account_id == account_id)
    if category_id:
        q = q.filter(Transaction.category_id == category_id)
    if date_from:
        q = q.filter(Transaction.date >= date_from)
    if date_to:
        q = q.filter(Transaction.date <= date_to)
    transactions = q.order_by(Transaction.date.desc(), Transaction.created_at.desc()).offset(offset).limit(limit).all()
    result = []
    for t in transactions:
        t_dict = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        acc = db.query(Account).filter(Account.id == t.account_id).first()
        cat = db.query(Category).filter(Category.id == t.category_id).first() if t.category_id else None
        t_dict['account_name'] = acc.name if acc else None
        t_dict['category_name'] = cat.name if cat else None
        result.append(TransactionOut(**t_dict))
    return result


@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(Account).filter(Account.id == payload.account_id, Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    to_account = None
    if payload.to_account_id:
        to_account = db.query(Account).filter(Account.id == payload.to_account_id, Account.user_id == current_user.id).first()
        if not to_account:
            raise HTTPException(status_code=404, detail="Destination account not found")
    trx = Transaction(user_id=current_user.id, **payload.model_dump())
    db.add(trx)
    _apply_balance(trx, account, to_account)
    db.commit()
    db.refresh(trx)
    acc = db.query(Account).filter(Account.id == trx.account_id).first()
    cat = db.query(Category).filter(Category.id == trx.category_id).first() if trx.category_id else None
    t_dict = {c.name: getattr(trx, c.name) for c in trx.__table__.columns}
    t_dict['account_name'] = acc.name if acc else None
    t_dict['category_name'] = cat.name if cat else None
    return TransactionOut(**t_dict)


@router.get("/{trx_id}", response_model=TransactionOut)
def get_transaction(trx_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trx = db.query(Transaction).filter(Transaction.id == trx_id, Transaction.user_id == current_user.id).first()
    if not trx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    acc = db.query(Account).filter(Account.id == trx.account_id).first()
    cat = db.query(Category).filter(Category.id == trx.category_id).first() if trx.category_id else None
    t_dict = {c.name: getattr(trx, c.name) for c in trx.__table__.columns}
    t_dict['account_name'] = acc.name if acc else None
    t_dict['category_name'] = cat.name if cat else None
    return TransactionOut(**t_dict)


@router.put("/{trx_id}", response_model=TransactionOut)
def update_transaction(trx_id: int, payload: TransactionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trx = db.query(Transaction).filter(Transaction.id == trx_id, Transaction.user_id == current_user.id).first()
    if not trx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    old_account = db.query(Account).filter(Account.id == trx.account_id).first()
    old_to_account = db.query(Account).filter(Account.id == trx.to_account_id).first() if trx.to_account_id else None
    _apply_balance(trx, old_account, old_to_account, reverse=True)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(trx, field, value)
    new_account = db.query(Account).filter(Account.id == trx.account_id).first()
    new_to_account = db.query(Account).filter(Account.id == trx.to_account_id).first() if trx.to_account_id else None
    _apply_balance(trx, new_account, new_to_account)
    db.commit()
    db.refresh(trx)
    acc = db.query(Account).filter(Account.id == trx.account_id).first()
    cat = db.query(Category).filter(Category.id == trx.category_id).first() if trx.category_id else None
    t_dict = {c.name: getattr(trx, c.name) for c in trx.__table__.columns}
    t_dict['account_name'] = acc.name if acc else None
    t_dict['category_name'] = cat.name if cat else None
    return TransactionOut(**t_dict)


@router.delete("/{trx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(trx_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trx = db.query(Transaction).filter(Transaction.id == trx_id, Transaction.user_id == current_user.id).first()
    if not trx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    account = db.query(Account).filter(Account.id == trx.account_id).first()
    to_account = db.query(Account).filter(Account.id == trx.to_account_id).first() if trx.to_account_id else None
    _apply_balance(trx, account, to_account, reverse=True)
    db.delete(trx)
    db.commit()
