from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
import calendar

from database import get_db
from models import Bill, User
from schemas import BillCreate, BillUpdate, BillOut
from routers.auth import get_current_user

router = APIRouter(prefix="/bills", tags=["bills"])


def _compute_next_due(due_day: int) -> date:
    today = date.today()
    year, month = today.year, today.month
    last_day = calendar.monthrange(year, month)[1]
    day = min(due_day, last_day)
    candidate = date(year, month, day)
    if candidate < today:
        if month == 12:
            year += 1
            month = 1
        else:
            month += 1
        last_day = calendar.monthrange(year, month)[1]
        day = min(due_day, last_day)
        candidate = date(year, month, day)
    return candidate


def _add_due(bill: Bill) -> BillOut:
    d = {c.name: getattr(bill, c.name) for c in bill.__table__.columns}
    d['next_due_date'] = _compute_next_due(bill.due_day) if bill.is_active else None
    return BillOut(**d)


@router.get("/", response_model=List[BillOut])
def list_bills(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bills = db.query(Bill).filter(Bill.user_id == current_user.id).order_by(Bill.due_day).all()
    return [_add_due(b) for b in bills]


@router.post("/", response_model=BillOut, status_code=status.HTTP_201_CREATED)
def create_bill(payload: BillCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = Bill(user_id=current_user.id, **payload.model_dump())
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return _add_due(bill)


@router.put("/{bill_id}", response_model=BillOut)
def update_bill(bill_id: int, payload: BillUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(bill, field, value)
    db.commit()
    db.refresh(bill)
    return _add_due(bill)


@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bill(bill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    db.delete(bill)
    db.commit()
