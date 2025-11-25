from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.db.database import get_db
from app.db.models import User, Staff
from app.db.schemas import Token, UserCreate, User as UserSchema

router = APIRouter()


@router.post("/token", response_model=Token)
def login_for_access_token(
        form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
        db: Session = Depends(get_db)
):
    """
    Rota oficial de Login.
    Recebe 'username' (que será o email) e 'password'.
    Devolve um Token JWT.
    """
    # 1. Procurar utilizador pelo email
    user = db.query(User).filter(User.email == form_data.username).first()

    # 2. Verificar se user existe e password bate certo
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou password incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Utilizador inativo")

    # 3. Gerar o Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email,
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_email": user.email,
        "is_staff": user.is_staff
    }


@router.post("/register/admin", response_model=UserSchema)
def create_admin_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Rota auxiliar para criar um ADMIN inicial (para testes).
    """
    # Verifica se email já existe
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Cria o hash da password
    hashed_pw = get_password_hash(user_data.password)

    # Cria o user
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_pw,
        full_name=user_data.full_name,
        is_active=True,
        is_staff=True  # Força como Staff/Admin
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user