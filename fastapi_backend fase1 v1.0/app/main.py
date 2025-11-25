from fastapi import FastAPI
# ADICIONEI 'DatabaseError' AQUI EM BAIXO
from sqlalchemy.exc import OperationalError, ProgrammingError, DatabaseError
from app.api.endpoints import auth, finances
from app.api.endpoints import auth
from app.db.database import engine, Base
from app.db import models

# --- Configuração Inicial da Base de Dados ---
def create_tables():
    try:
        # CUIDADO: Isto apaga tudo e recria! Use apenas em desenvolvimento inicial.
        # Base.metadata.drop_all(bind=engine)
        # (Descomenta a linha acima SÓ se quiseres limpar a BD automaticamente no arranque)

        print("INFO:  A verificar/criar tabelas...")
        Base.metadata.create_all(bind=engine)
        print("INFO:  Tabelas verificadas/criadas com sucesso.")
    except Exception as e:
        print(f"AVISO: {e}")

app = FastAPI(
    title="Escola API - Migração FastAPI",
    description="API de gestão escolar (Migração de Supabase para MySQL)",
    version="1.0.0"
)

app.include_router(auth.router, tags=["Autenticação"])
app.include_router(finances.router, prefix="/financas", tags=["Relatórios Financeiros"])

@app.get("/")
def read_root():
    return {
        "message": "API FastAPI está a correr!",
        "database": "Ligado ao MySQL (Docker)",
        "docs_url": "/docs"
    }