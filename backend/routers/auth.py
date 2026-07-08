from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

from database import get_db
from models import User
from schemas import Token, TokenData, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Seed default categories for new user
    _seed_default_categories(user.id, db)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username, User.is_active == True).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/logout")
def logout():
    # JWT is stateless; client just discards the token
    return {"message": "Logged out successfully"}


def _seed_default_categories(user_id: int, db: Session):
    from models import Category
    defaults = [
        {"name": "Gaji", "type": "income", "color": "#10b981", "icon": "💼"},
        {"name": "Bisnis", "type": "income", "color": "#3b82f6", "icon": "🏢"},
        {"name": "Investasi", "type": "income", "color": "#6366f1", "icon": "📈"},
        {"name": "Lainnya", "type": "income", "color": "#8b5cf6", "icon": "➕"},
        {"name": "Makanan & Minuman", "type": "expense", "color": "#f59e0b", "icon": "🍔"},
        {"name": "Transportasi", "type": "expense", "color": "#ef4444", "icon": "🚗"},
        {"name": "Belanja", "type": "expense", "color": "#ec4899", "icon": "🛍️"},
        {"name": "Tagihan & Utilitas", "type": "expense", "color": "#14b8a6", "icon": "💡"},
        {"name": "Kesehatan", "type": "expense", "color": "#22c55e", "icon": "🏥"},
        {"name": "Hiburan", "type": "expense", "color": "#a855f7", "icon": "🎮"},
        {"name": "Pendidikan", "type": "expense", "color": "#0ea5e9", "icon": "📚"},
        {"name": "Lainnya", "type": "expense", "color": "#6b7280", "icon": "📦"},
    ]
    for d in defaults:
        cat = Category(user_id=user_id, is_default=True, **d)
        db.add(cat)
    db.commit()
