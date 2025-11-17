import mysql.connector
from mysql.connector import Error

# CONFIGURAÇÃO DA CONEXÃO
DB_HOST = "127.0.0.1"
DB_PORT = 3307
DB_USER = "root"
DB_PASSWORD = "pass"
DB_NAME = "sige_db"

# ======================================================
# FUNÇÃO PARA CRIAR CONEXÃO COM DB
# ======================================================
def get_connection():
    connection = None
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        print("Ligação à Base de Dados MySQL bem-sucedida")
    except Error as e:
        print(f"Ocorreu o erro '{e}'")
    return connection

# ======================================================
# FUNÇÃO PARA CRIAR TABELAS (AGORA COM RESET)
# ======================================================
def create_tables():
    
    # Lista de DROP (apagar) na ordem inversa das dependências
    drop_queries = [
        "DROP TABLE IF EXISTS Notas;",
        "DROP TABLE IF EXISTS TurmasDisciplinas;",
        "DROP TABLE IF EXISTS Alunos;",
        "DROP TABLE IF EXISTS Turmas;",
        "DROP TABLE IF EXISTS Professores;",
        "DROP TABLE IF EXISTS Staff;",
        "DROP TABLE IF EXISTS Ordenados;",
        "DROP TABLE IF EXISTS Transacoes;",
        "DROP TABLE IF EXISTS EncarregadoEducacao;",
        "DROP TABLE IF EXISTS Disciplinas;",
        "DROP TABLE IF EXISTS Fornecedores;",
        "DROP TABLE IF EXISTS Financiamentos;",
        "DROP TABLE IF EXISTS Escaloes;",
        "DROP TABLE IF EXISTS Departamentos;",
        "DROP TABLE IF EXISTS AI_Recommendation;"
    ]

    # Lista de CREATE (criar) na ordem correta
    create_queries = [

        # Departamentos
        """
        CREATE TABLE IF NOT EXISTS Departamentos (
            Depart_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL
        ) ENGINE = InnoDB;
        """,

        # Escaloes
        """
        CREATE TABLE IF NOT EXISTS Escaloes (
            Escalao_id INT PRIMARY KEY,
            Nome VARCHAR(10) NOT NULL,
            Descricao VARCHAR(100),
            Valor_Base DECIMAL(8,2) NOT NULL,
            Bonus DECIMAL(8,2) DEFAULT 0.00
        ) ENGINE = InnoDB;
        """,

        # Professores
        """
        CREATE TABLE IF NOT EXISTS Professores (
            Professor_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'professor',
            Nome VARCHAR(50) NOT NULL,
            Data_Nasc DATE NOT NULL,
            Telefone CHAR(9),
            Morada VARCHAR(100),
            Escalao_id INT,
            Depart_id INT,
            FOREIGN KEY (Escalao_id) REFERENCES Escaloes(Escalao_id),
            FOREIGN KEY (Depart_id) REFERENCES Departamentos(Depart_id)
        ) ENGINE = InnoDB;
        """,

        # Turmas
        """
        CREATE TABLE IF NOT EXISTS Turmas (
            Turma_id INT AUTO_INCREMENT PRIMARY KEY,
            Ano INT NOT NULL,
            Turma CHAR(1) NOT NULL,
            AnoLetivo VARCHAR(9) NOT NULL,
            DiretorT INT,
            FOREIGN KEY (DiretorT) REFERENCES Professores(Professor_id),
            UNIQUE(Ano, Turma, AnoLetivo)
        ) ENGINE = InnoDB;
        """,

        # EncarregadoEducacao
        """
        CREATE TABLE IF NOT EXISTS EncarregadoEducacao (
            EE_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL,
            Telefone CHAR(9),
            Email VARCHAR(50),
            Morada VARCHAR(100),
            Relacao VARCHAR(20)
        ) ENGINE = InnoDB;
        """,

        # Alunos
        """
        CREATE TABLE IF NOT EXISTS Alunos (
            Aluno_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL,
            Data_Nasc DATE NOT NULL,
            Telefone CHAR(9),
            Morada VARCHAR(100),
            Genero ENUM('M','F') NOT NULL,
            Ano INT NOT NULL,
            Turma_id INT,
            Escalao CHAR(1),
            EE_id INT,
            FOREIGN KEY (EE_id) REFERENCES EncarregadoEducacao(EE_id),
            FOREIGN KEY (Turma_id) REFERENCES Turmas(Turma_id)
        ) ENGINE = InnoDB;
        """,

        # Disciplinas
        """
        CREATE TABLE IF NOT EXISTS Disciplinas (
            Disc_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL,
            Categoria VARCHAR(30)
        ) ENGINE = InnoDB;
        """,

        # TurmasDisciplinas
        """
        CREATE TABLE IF NOT EXISTS TurmasDisciplinas (
            Turma_id INT,
            Disc_id INT,
            Professor_id INT,
            PRIMARY KEY (Turma_id, Disc_id, Professor_id),
            FOREIGN KEY (Turma_id) REFERENCES Turmas(Turma_id),
            FOREIGN KEY (Disc_id) REFERENCES Disciplinas(Disc_id),
            FOREIGN KEY (Professor_id) REFERENCES Professores(Professor_id)
        ) ENGINE = InnoDB;
        """,

        # Notas
        """
        CREATE TABLE IF NOT EXISTS Notas (
            Nota_id INT AUTO_INCREMENT PRIMARY KEY,
            Aluno_id INT,
            Disc_id INT,
            Nota_1P INT,
            Nota_2P INT,
            Nota_3P INT,
            Nota_Ex INT,
            Nota_Final INT,
            Ano_letivo VARCHAR(9),
            FOREIGN KEY (Aluno_id) REFERENCES Alunos(Aluno_id),
            FOREIGN KEY (Disc_id) REFERENCES Disciplinas(Disc_id)
        ) ENGINE = InnoDB;
        """,

        # Staff
        """
        CREATE TABLE IF NOT EXISTS Staff (
            Staff_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            Nome VARCHAR(50) NOT NULL,
            Cargo VARCHAR(100),
            Depart_id INT,
            Telefone CHAR(9),
            Morada VARCHAR(100),
            FOREIGN KEY (Depart_id) REFERENCES Departamentos(Depart_id)
        ) ENGINE = InnoDB;
        """,

        # Ordenados
        """
        CREATE TABLE IF NOT EXISTS Ordenados (
            Ordenado_id INT AUTO_INCREMENT PRIMARY KEY,
            Funcionario_id INT NOT NULL,
            Tipo_Funcionario ENUM('Professor','Staff') NOT NULL,
            Mes VARCHAR(15),
            Ano INT,
            Valor DECIMAL(8,2),
            Data_Pagamento DATE,
            Observacoes TEXT
        ) ENGINE = InnoDB;

        """,

        # Financiamentos
        """
        CREATE TABLE IF NOT EXISTS Financiamentos (
            Fin_id INT AUTO_INCREMENT PRIMARY KEY,
            Tipo VARCHAR(50),
            Valor DECIMAL(10,2),
            Ano INT,
            Observacoes TEXT
        ) ENGINE = InnoDB;
        """,

        # Fornecedores
        """
        CREATE TABLE IF NOT EXISTS Fornecedores (
            Fornecedor_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL,
            NIF VARCHAR(9) UNIQUE,
            Tipo VARCHAR(30),
            Telefone CHAR(9),
            Email VARCHAR(50),
            Morada VARCHAR(100),
            IBAN VARCHAR(25),
            Observacoes TEXT
        ) ENGINE = InnoDB;
        """,

        # Transacoes
        """
        CREATE TABLE IF NOT EXISTS Transacoes (
            Transacao_id INT AUTO_INCREMENT PRIMARY KEY,
            Tipo ENUM('Receita','Despesa') NOT NULL,
            Valor DECIMAL(10,2),
            Data DATE,
            Descricao TEXT,
            Fin_id INT,
            Fornecedor_id INT,
            FOREIGN KEY (Fin_id) REFERENCES Financiamentos(Fin_id),
            FOREIGN KEY (Fornecedor_id) REFERENCES Fornecedores(Fornecedor_id)
        ) ENGINE = InnoDB;
        """,

        # AI_Recommendation
        """
        CREATE TABLE IF NOT EXISTS AI_Recommendation (
            AI_id INT AUTO_INCREMENT PRIMARY KEY,
            Texto TEXT NOT NULL
        ) ENGINE = InnoDB;
        """
    ]

    try:
        conn = get_connection()
        if conn is None:
            print("Não foi possível ligar à BD. Tabelas não criadas.")
            return

        cursor = conn.cursor()
        
        # 1. APAGAR tabelas antigas (para limpar)
        print("A limpar tabelas antigas (reset)...")
        for query in drop_queries:
            cursor.execute(query)
        print("Tabelas limpas.")

        # 2. CRIAR tabelas novas
        print("A criar novas tabelas...")
        for query in create_queries:
            cursor.execute(query)
        print("Todas as tabelas foram criadas.")
        
        conn.commit()
        conn.close()
    except Error as e:
        print(f"Erro ao criar tabelas: {e}")

# ======================================================
# FUNÇÃO PARA INICIAR DB
# ======================================================
def init_db():
    create_tables()

# ======================================================
# EXECUTAR O SCRIPT
# ======================================================
if __name__ == '__main__':
    init_db()