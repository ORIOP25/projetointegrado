import mysql.connector
from mysql.connector import Error

# CONFIGURAÇÃO DA CONEXÃO
DB_HOST = "127.0.0.1"
DB_PORT = 3307
DB_USER = "root"
DB_PASSWORD = "pass"
DB_NAME = "EscolaPublica"

# ======================================================
# FUNÇÃO PARA CRIAR BASE DE DADOS
# ======================================================
def create_database():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME};")
        print(f"Base de dados '{DB_NAME}' criada ou já existente.")
        conn.close()
    except Error as e:
        print("Erro ao criar base de dados:", e)

# ======================================================
# FUNÇÃO PARA CRIAR CONEXÃO COM DB
# ======================================================
def get_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

# ======================================================
# FUNÇÃO PARA CRIAR TABELAS
# ======================================================
def create_tables():
    table_queries = [

        # Departamentos
        """
        CREATE TABLE IF NOT EXISTS Departamentos (
            Depart_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL
        );
        """,

        # Escaloes
        """
        CREATE TABLE IF NOT EXISTS Escaloes (
            Escalao_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(10) NOT NULL,
            Descricao VARCHAR(100),
            Valor_Base DECIMAL(8,2) NOT NULL,
            Bonus DECIMAL(8,2) DEFAULT 0.00
        );
        """,

        # Professores
        """
        CREATE TABLE IF NOT EXISTS Professores (
            Professor_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL,
            Data_Nasc DATE NOT NULL,
            Telefone CHAR(9),
            Morada VARCHAR(100),
            Escalao_id INT,
            Depart_id INT,
            FOREIGN KEY (Escalao_id) REFERENCES Escaloes(Escalao_id),
            FOREIGN KEY (Depart_id) REFERENCES Departamentos(Depart_id)
        );
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
        );
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
        );
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
        );
        """,

        # Disciplinas
        """
        CREATE TABLE IF NOT EXISTS Disciplinas (
            Disc_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL,
            Categoria VARCHAR(30)
        );
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
        );
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
        );
        """,

        # Staff
        """
        CREATE TABLE IF NOT EXISTS Staff (
            Staff_id INT AUTO_INCREMENT PRIMARY KEY,
            Nome VARCHAR(50) NOT NULL,
            Cargo VARCHAR(50),
            Depart_id INT,
            Telefone CHAR(9),
            Morada VARCHAR(100),
            FOREIGN KEY (Depart_id) REFERENCES Departamentos(Depart_id)
        );
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
        );

        """,

        # Financiamentos
        """
        CREATE TABLE IF NOT EXISTS Financiamentos (
            Fin_id INT AUTO_INCREMENT PRIMARY KEY,
            Tipo VARCHAR(50),
            Valor DECIMAL(10,2),
            Ano INT,
            Observacoes TEXT
        );
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
        );
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
        );
        """,

        # AI_Recommendation
        """
        CREATE TABLE IF NOT EXISTS AI_Recommendation (
            AI_id INT AUTO_INCREMENT PRIMARY KEY,
            Texto TEXT NOT NULL
        );
        """
    ]

    try:
        conn = get_connection()
        cursor = conn.cursor()
        for query in table_queries:
            cursor.execute(query)
        print("Todas as tabelas foram criadas ou já existiam.")
        conn.commit()
        conn.close()
    except Error as e:
        print("Erro ao criar tabelas:", e)

# ======================================================
# FUNÇÕES GERAIS DE CRUD
# ======================================================
def insert_data(table, columns, values):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cols = ', '.join(columns)
        placeholders = ', '.join(['%s'] * len(values))
        query = f"INSERT INTO {table} ({cols}) VALUES ({placeholders})"
        cursor.execute(query, values)
        conn.commit()
        print(f"Dado inserido na tabela {table}.")
        conn.close()
    except Error as e:
        print(f"Erro ao inserir na tabela {table}:", e)

def read_data(table, columns='*', condition=None):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = f"SELECT {columns} FROM {table}"
        if condition:
            query += f" WHERE {condition}"
        cursor.execute(query)
        results = cursor.fetchall()
        conn.close()
        return results
    except Error as e:
        print(f"Erro ao ler dados da tabela {table}:", e)
        return []

def delete_data(table, condition):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = f"DELETE FROM {table} WHERE {condition}"
        cursor.execute(query)
        conn.commit()
        print(f"Dados deletados da tabela {table} onde {condition}.")
        conn.close()
    except Error as e:
        print(f"Erro ao deletar dados da tabela {table}:", e)

# ======================================================
# FUNÇÃO PARA INICIAR DB
# ======================================================
def init_db():
    create_database()
    create_tables()
