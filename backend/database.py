from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Carregar as variáveis do ficheiro .env
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("A variável DATABASE_URL não está definida no ficheiro .env")

# Criar o motor de ligação
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Criar a fábrica de sessões (cada pedido terá a sua sessão)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# A classe base para os nossos modelos (tabelas)
Base = declarative_base()

# Função utilitária para obter a base de dados (Dependency)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()