from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from database import get_db
from models import Asset, Liability, User
from schemas import AssetCreate, AssetUpdate, AssetOut, LiabilityCreate, LiabilityOut
from routers.auth import get_current_user

router = APIRouter(prefix="/assets", tags=["assets"])


def _enrich_asset(asset: Asset) -> AssetOut:
    d = {c.name: getattr(asset, c.name) for c in asset.__table__.columns}
    if asset.buy_price and asset.quantity:
        cost = asset.buy_price * asset.quantity
        d['gain_loss'] = asset.current_value - cost
    else:
        d['gain_loss'] = None
    return AssetOut(**d)


# ── Assets ────────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[AssetOut])
def list_assets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [_enrich_asset(a) for a in db.query(Asset).filter(Asset.user_id == current_user.id, Asset.is_active == True).all()]


@router.post("/", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    asset = Asset(user_id=current_user.id, **payload.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _enrich_asset(asset)


@router.put("/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: int, payload: AssetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(asset, field, value)
    db.commit()
    db.refresh(asset)
    return _enrich_asset(asset)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset.is_active = False
    db.commit()


# ── Liabilities ───────────────────────────────────────────────────────────────
@router.get("/liabilities", response_model=List[LiabilityOut])
def list_liabilities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Liability).filter(Liability.user_id == current_user.id, Liability.is_active == True).all()


@router.post("/liabilities", response_model=LiabilityOut, status_code=status.HTTP_201_CREATED)
def create_liability(payload: LiabilityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    liability = Liability(user_id=current_user.id, **payload.model_dump())
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


@router.delete("/liabilities/{liability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_liability(liability_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    liability = db.query(Liability).filter(Liability.id == liability_id, Liability.user_id == current_user.id).first()
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")
    liability.is_active = False
    db.commit()
