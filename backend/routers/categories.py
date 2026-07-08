from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Category, User
from schemas import CategoryCreate, CategoryUpdate, CategoryOut
from routers.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Category).filter(Category.user_id == current_user.id).order_by(Category.name).all()


@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = Category(user_id=current_user.id, is_default=False, **payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(cat_id: int, payload: CategoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(cat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat = db.query(Category).filter(Category.id == cat_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default category")
    db.delete(cat)
    db.commit()
