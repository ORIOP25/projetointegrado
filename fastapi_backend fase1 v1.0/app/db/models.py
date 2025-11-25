from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Float, Text, DECIMAL, Enum, UniqueConstraint, \
    DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


# --- Enums para escolhas fixas ---
class GeneroEnum(str, enum.Enum):
    M = "M"
    F = "F"


class TipoFuncionarioEnum(str, enum.Enum):
    Professor = "Professor"
    Staff = "Staff"


class TipoTransacaoEnum(str, enum.Enum):
    Receita = "Receita"
    Despesa = "Despesa"


# --- Tabela de Autenticação (NOVA - Para o Login funcionar) ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_staff = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# --- Tabelas do Teu Esquema Original ---

class Departamento(Base):
    __tablename__ = "Departamentos"
    Depart_id = Column(Integer, primary_key=True, index=True)
    Nome = Column(String(50), nullable=False)

    professores = relationship("Professor", back_populates="departamento")
    staff = relationship("Staff", back_populates="departamento")


class Escalao(Base):
    __tablename__ = "Escaloes"
    Escalao_id = Column(Integer, primary_key=True, index=True)
    Nome = Column(String(10), nullable=False)
    Descricao = Column(String(100))
    Valor_Base = Column(DECIMAL(8, 2), nullable=False)
    Bonus = Column(DECIMAL(8, 2), default=0.00)

    professores = relationship("Professor", back_populates="escalao")


class Professor(Base):
    __tablename__ = "Professores"
    Professor_id = Column(Integer, primary_key=True, index=True)
    Nome = Column(String(50), nullable=False)
    Data_Nasc = Column(Date, nullable=False)
    Telefone = Column(String(9))
    Morada = Column(String(100))

    Escalao_id = Column(Integer, ForeignKey("Escaloes.Escalao_id", ondelete="SET NULL", onupdate="CASCADE"))
    Depart_id = Column(Integer, ForeignKey("Departamentos.Depart_id", ondelete="SET NULL", onupdate="CASCADE"))

    escalao = relationship("Escalao", back_populates="professores")
    departamento = relationship("Departamento", back_populates="professores")
    turmas_dirigidas = relationship("Turma", back_populates="diretor_turma")


class Turma(Base):
    __tablename__ = "Turmas"
    Turma_id = Column(Integer, primary_key=True, index=True)
    Ano = Column(Integer, nullable=False)
    Turma = Column(String(1), nullable=False)  # Char(1)
    AnoLetivo = Column(String(9), nullable=False)
    DiretorT = Column(Integer, ForeignKey("Professores.Professor_id", ondelete="SET NULL", onupdate="CASCADE"))

    diretor_turma = relationship("Professor", back_populates="turmas_dirigidas")
    alunos = relationship("Aluno", back_populates="turma_obj")

    # Constraint Unica (Ano, Turma, AnoLetivo)
    __table_args__ = (UniqueConstraint('Ano', 'Turma', 'AnoLetivo', name='_ano_turma_anoletivo_uc'),)


class EncarregadoEducacao(Base):
    __tablename__ = "EncarregadoEducacao"
    EE_id = Column(Integer, primary_key=True, index=True)
    Nome = Column(String(50), nullable=False)
    Telefone = Column(String(9))
    Email = Column(String(50))
    Morada = Column(String(100))
    Relacao = Column(String(20))

    educandos = relationship("Aluno", back_populates="encarregado_educacao")


class Aluno(Base):
    __tablename__ = "Alunos"
    Aluno_id = Column(Integer, primary_key=True, index=True)
    Nome = Column(String(50), nullable=False)
    Data_Nasc = Column(Date, nullable=False)
    Telefone = Column(String(9))
    Morada = Column(String(100))
    Genero = Column(Enum(GeneroEnum), nullable=False)
    Ano = Column(Integer, nullable=False)
    Turma_id = Column(Integer, ForeignKey("Turmas.Turma_id", ondelete="CASCADE", onupdate="CASCADE"))
    Escalao = Column(String(1))  # Apenas Char(1), não é FK para a tabela Escaloes no esquema original
    EE_id = Column(Integer, ForeignKey("EncarregadoEducacao.EE_id", ondelete="SET NULL", onupdate="CASCADE"))

    turma_obj = relationship("Turma", back_populates="alunos")
    encarregado_educacao = relationship("EncarregadoEducacao", back_populates="educandos")
    notas = relationship("Nota", back_populates="aluno")


class Disciplina(Base):
    __tablename__ = "Disciplinas"
    Disc_id = Column(Integer, primary_key=True, index=True)
    Nome = Column(String(50), nullable=False)
    Categoria = Column(String(30))


class TurmaDisciplina(Base):
    __tablename__ = "TurmasDisciplinas"
    Turma_id = Column(Integer, ForeignKey("Turmas.Turma_id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    Disc_id = Column(Integer, ForeignKey("Disciplinas.Disc_id", ondelete="CASCADE", onupdate="CASCADE"),
                     primary_key=True)
    Professor_id = Column(Integer, ForeignKey("Professores.Professor_id", ondelete="CASCADE", onupdate="CASCADE"),
                          primary_key=True)


class Nota(Base):
    __tablename__ = "Notas"
    Nota_id = Column(Integer, primary_key=True, index=True)
    Aluno_id = Column(Integer, ForeignKey("Alunos.Aluno_id", ondelete="CASCADE", onupdate="CASCADE"))
    Disc_id = Column(Integer, ForeignKey("Disciplinas.Disc_id", ondelete="CASCADE", onupdate="CASCADE"))
    Nota_1P = Column(Integer)
    Nota_2P = Column(Integer)
    Nota_3P = Column(Integer)
    Nota_Ex = Column(Integer)
    Nota_Final = Column(Integer)
    Ano_letivo = Column(String(9))

    aluno = relationship("Aluno", back_populates="notas")
    disciplina = relationship("Disciplina")


class Staff(Base):
    __tablename__ = "Staff"
    Staff_id = Column(Integer, primary_key=True, index=True)
    Nome = Column(String(50), nullable=False)
    Cargo = Column(String(50))
    Depart_id = Column(Integer, ForeignKey("Departamentos.Depart_id", ondelete="SET NULL", onupdate="CASCADE"))
    Telefone = Column(String(9))
    Morada = Column(String(100))

    departamento = relationship("Departamento", back_populates="staff")


class Ordenado(Base):
    __tablename__ = "Ordenados"
    Ordenado_id = Column(Integer, primary_key=True, index=True)
    Funcionario_id = Column(Integer, nullable=False)
    Tipo_Funcionario = Column(Enum(TipoFuncionarioEnum), nullable=False)
    Mes = Column(String(15))
    Ano = Column(Integer)
    Valor = Column(DECIMAL(8, 2))
    Data_Pagamento = Column(Date)
    Observacoes = Column(Text)


class Financiamento(Base):
    __tablename__ = "Financiamentos"
    Fin_id = Column(Integer, primary_key=True, index=True)
    Tipo = Column(String(50))
    Valor = Column(DECIMAL(10, 2))
    Ano = Column(Integer)
    Observacoes = Column(Text)


class Fornecedor(Base):
    __tablename__ = "Fornecedores"
    Fornecedor_id = Column(Integer, primary_key=True, index=True)
    Nome = Column(String(50), nullable=False)
    NIF = Column(String(9), unique=True)
    Tipo = Column(String(30))
    Telefone = Column(String(9))
    Email = Column(String(50))
    Morada = Column(String(100))
    IBAN = Column(String(25))
    Observacoes = Column(Text)


class Transacao(Base):
    __tablename__ = "Transacoes"
    Transacao_id = Column(Integer, primary_key=True, index=True)
    Tipo = Column(Enum(TipoTransacaoEnum), nullable=False)
    Valor = Column(DECIMAL(10, 2))
    Data = Column(Date)
    Descricao = Column(Text)
    Fin_id = Column(Integer, ForeignKey("Financiamentos.Fin_id", ondelete="SET NULL", onupdate="CASCADE"))
    Fornecedor_id = Column(Integer, ForeignKey("Fornecedores.Fornecedor_id", ondelete="SET NULL", onupdate="CASCADE"))

    financiamento = relationship("Financiamento")
    fornecedor = relationship("Fornecedor")


class InventarioLab(Base):
    __tablename__ = "InventarioLab"
    Item_id = Column(Integer, primary_key=True, index=True)
    Lab_id = Column(Integer, nullable=False)
    Nome_Lab = Column(String(50), nullable=False)
    Armario = Column(String(50), nullable=False)
    Prateleira_Ref = Column(String(10))
    Nome_Item = Column(String(100), nullable=False)
    Estado = Column(String(30))
    Quantidade = Column(Integer, nullable=False)


class AIRecommendation(Base):
    __tablename__ = "AI_Recommendation"
    AI_id = Column(Integer, primary_key=True, index=True)
    Texto = Column(Text, nullable=False)