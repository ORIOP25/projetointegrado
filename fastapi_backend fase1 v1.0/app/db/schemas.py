from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date


# --- Schemas de Autenticação (Token) ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user_email: str
    is_staff: bool


class TokenData(BaseModel):
    email: Optional[str] = None


# --- Schemas de User (Utilizador) ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_staff: bool = False


class UserCreate(UserBase):
    password: str  # Password é obrigatória na criação


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Permite ler dados do SQLAlchemy


# --- Schemas de Aluno (Exemplo para a fase 3) ---
class AlunoBase(BaseModel):
    nome: str
    data_nascimento: Optional[date] = None
    email: Optional[EmailStr] = None
    numero_processo: str


class AlunoCreate(AlunoBase):
    turma_id: Optional[int] = None


class Aluno(AlunoBase):
    id: int
    turma_id: Optional[int] = None

    class Config:
        from_attributes = True


# --- Schemas de Finanças e Investimentos ---

class BalancoInvestimento(BaseModel):
    id: int
    tipo_investimento: str  # Ex: "Laboratório de Química"
    ano_financiamento: int
    valor_aprovado: float

    # Dados do Período Solicitado (Mês ou Ano)
    total_receita_periodo: float
    total_despesa_periodo: float

    # Dados Acumulados (O "Cofre" total deste investimento)
    total_gasto_acumulado: float
    saldo_restante: float

    class Config:
        from_attributes = True


class BalancoGeral(BaseModel):
    periodo: str  # Ex: "2024-10" ou "2024"
    total_receita: float
    total_despesa: float
    saldo: float
    detalhe_investimentos: List[BalancoInvestimento]