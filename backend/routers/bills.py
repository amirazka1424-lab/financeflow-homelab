from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
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
    out = BillOut.model_validate(bill)
    if bill.due_day:
        out.due_date = str(_compute_next_due(bill.due_day))
    return out


@router.get("/", response_model=List[BillOut])
def list_bills(
    is_paid: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Bill).filter(
        Bill.owner_id == current_user.id,
        Bill.is_active == True
    )
    if is_paid is not None:
        q = q.filter(Bill.is_paid == is_paid)
    return [_add_due(b) for b in q.order_by(Bill.due_day).all()]


@router.post("/", response_model=BillOut, status_code=status.HTTP_201_CREATED)
def create_bill(
    payload: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = Bill(owner_id=current_user.id, **payload.model_dump())
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return _add_due(bill)


@router.get("/{bill_id}", response_model=BillOut)
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.owner_id == current_user.id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return _add_due(bill)


@router.put("/{bill_id}", response_model=BillOut)
def update_bill(
    bill_id: int,
    payload: BillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.owner_id == current_user.id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(bill, k, v)
    db.commit()
    db.refresh(bill)
    return _add_due(bill)


@router.post("/{bill_id}/pay", response_model=BillOut)
def mark_bill_paid(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.owner_id == current_user.id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    bill.is_paid = True
    bill.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(bill)
    return _add_due(bill)


@router.post("/{bill_id}/unpay", response_model=BillOut)
def mark_bill_unpaid(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.owner_id == current_user.id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    bill.is_paid = False
    bill.paid_at = None
    db.commit()
    db.refresh(bill)
    return _add_due(bill)


@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.owner_id == current_user.id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    bill.is_active = False
    db.commit()
