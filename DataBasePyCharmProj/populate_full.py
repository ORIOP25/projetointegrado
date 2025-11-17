import mysql.connector
from mysql.connector import Error
from faker import Faker
import random
from datetime import datetime
import bcrypt

# Importar a função de conexão do nosso outro ficheiro
from DataBase import get_connection

fake = Faker('pt_PT')

# Senha padrão para todos os utilizadores criados
DEFAULT_PASSWORD = "pass123"

def hash_password(password):
    """Gera um hash bcrypt para a senha."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def populate_departamentos(cursor):
    print("A popular Departamentos...")
    departamentos = [
        ('Direção',),
        ('Secretaria',),
        ('Conselho Pedagógico',),
        ('Departamento de Línguas',),
        ('Departamento de Ciências Exatas',),
        ('Departamento de Ciências Sociais e Humanas',),
        ('Departamento de Artes e Desporto',)
    ]
    cursor.executemany("INSERT INTO Departamentos (Nome) VALUES (%s)", departamentos)
    print("Departamentos populados.")

def populate_escaloes(cursor):
    print("A popular Escalões...")
    # CORREÇÃO: Inserir os IDs manualmente para garantir que são 1, 2, 3
    escaloes = [
        (1, 'A', 'Escalão A', 250.00, 50.00),
        (2, 'B', 'Escalão B', 150.00, 25.00),
        (3, 'C', 'Escalão C', 50.00, 0.00)
    ]
    cursor.executemany("INSERT INTO Escaloes (Escalao_id, Nome, Descricao, Valor_Base, Bonus) VALUES (%s, %s, %s, %s, %s)", escaloes)
    print("Escalões populados.")

def populate_staff(cursor):
    print("A popular Staff...")
    hashed_pass = hash_password(DEFAULT_PASSWORD)
    
    # 1. Criar o Global Admin
    admin_data = (
        'admin@escola.pt',  # email
        hashed_pass,        # hashed_password
        'global_admin',     # role
        'Administrador Principal', # Nome
        'Direção',          # Cargo
        'Direção',          # Valor para o SELECT Depart_id (WHERE Nome = %s)
        '123456789',        # Telefone
        fake.address().replace('\n', ', ') # Morada
    )
    cursor.execute("INSERT INTO Staff (email, hashed_password, role, Nome, Cargo, Depart_id, Telefone, Morada) "
                   "VALUES (%s, %s, %s, %s, %s, (SELECT Depart_id FROM Departamentos WHERE Nome = %s), %s, %s)",
                   admin_data)

    # 2. Criar Staff normal
    staff_data = []
    for _ in range(9):
        staff_data.append((
            fake.email(),
            hashed_pass,
            'staff',
            fake.name(),
            fake.job(),
            random.randint(1, 7), # ID aleatório de Departamento
            fake.phone_number()[:9],
            fake.address().replace('\n', ', ')
        ))
    
    cursor.executemany("INSERT INTO Staff (email, hashed_password, role, Nome, Cargo, Depart_id, Telefone, Morada) "
                       "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                       staff_data)
    print("Staff populado (1 admin + 9 staff).")

def populate_professores(cursor):
    print("A popular Professores...")
    hashed_pass = hash_password(DEFAULT_PASSWORD)
    prof_data = []
    for i in range(20):
        prof_data.append((
            f'professor{i+1}@escola.pt',
            hashed_pass,
            'professor',
            fake.name(),
            fake.date_of_birth(minimum_age=25, maximum_age=65),
            fake.phone_number()[:9],
            fake.address().replace('\n', ', '),
            random.randint(1, 3), # Escalao_id (IDs 1, 2, 3) - Agora está garantido
            random.randint(4, 7)  # Depart_id (só departamentos académicos)
        ))
    
    cursor.executemany("INSERT INTO Professores (email, hashed_password, role, Nome, Data_Nasc, Telefone, Morada, Escalao_id, Depart_id) "
                       "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                       prof_data)
    print("Professores populados.")

def populate_turmas(cursor):
    print("A popular Turmas...")
    turmas_data = []
    anos_letivos = ['2023/2024', '2024/2025']
    for ano_letivo in anos_letivos:
        for ano in range(5, 13): # Do 5º ao 12º ano
            for turma_letra in ['A', 'B', 'C']:
                turmas_data.append((
                    ano,
                    turma_letra,
                    ano_letivo,
                    random.randint(1, 20) # DiretorT (ID aleatório de professor)
                ))
    
    cursor.executemany("INSERT INTO Turmas (Ano, Turma, AnoLetivo, DiretorT) VALUES (%s, %s, %s, %s)", turmas_data)
    print("Turmas populadas.")

def populate_encarregados_educacao(cursor):
    print("A popular Encarregados de Educação...")
    ee_data = []
    for _ in range(300): # Criar 300 EEs
        ee_data.append((
            fake.name(),
            fake.phone_number()[:9],
            fake.email(),
            fake.address().replace('\n', ', '),
            random.choice(['Pai', 'Mãe', 'Avô/Avó', 'Tutor Legal'])
        ))
    
    cursor.executemany("INSERT INTO EncarregadoEducacao (Nome, Telefone, Email, Morada, Relacao) VALUES (%s, %s, %s, %s, %s)", ee_data)
    print("Encarregados de Educação populados.")

def populate_alunos(cursor):
    print("A popular Alunos...")
    cursor.execute("SELECT Turma_id FROM Turmas")
    turma_ids = [item[0] for item in cursor.fetchall()]
    
    cursor.execute("SELECT EE_id FROM EncarregadoEducacao")
    ee_ids = [item[0] for item in cursor.fetchall()]
    
    if not turma_ids or not ee_ids:
        print("Erro: Não foi possível obter Turma_ids ou EE_ids para popular Alunos.")
        return

    alunos_data = []
    for _ in range(500): # Criar 500 alunos
        alunos_data.append((
            fake.name(),
            fake.date_of_birth(minimum_age=10, maximum_age=18),
            fake.phone_number()[:9],
            fake.address().replace('\n', ', '),
            random.choice(['M', 'F']),
            random.randint(5, 12), # Ano
            random.choice(turma_ids),
            random.choice(['A', 'B', 'C']), # Escalao
            random.choice(ee_ids)
        ))
    
    cursor.executemany("INSERT INTO Alunos (Nome, Data_Nasc, Telefone, Morada, Genero, Ano, Turma_id, Escalao, EE_id) "
                       "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                       alunos_data)
    print("Alunos populados.")

def populate_disciplinas(cursor):
    print("A popular Disciplinas...")
    disciplinas = [
        ('Português', 'Línguas'),
        ('Inglês', 'Línguas'),
        ('Matemática A', 'Ciências Exatas'),
        ('Física e Química A', 'Ciências Exatas'),
        ('Biologia e Geologia', 'Ciências Exatas'),
        ('História A', 'Ciências Sociais e Humanas'),
        ('Geografia A', 'Ciências Sociais e Humanas'),
        ('Filosofia', 'Ciências Sociais e Humanas'),
        ('Educação Física', 'Artes e Desporto'),
        ('Desenho A', 'Artes e Desporto')
    ]
    cursor.executemany("INSERT INTO Disciplinas (Nome, Categoria) VALUES (%s, %s)", disciplinas)
    print("Disciplinas populadas.")

# ... (outras funções de população podem ser adicionadas aqui: Notas, Transacoes, etc.) ...

def main():
    conn = get_connection()
    if conn is None:
        print("Abortando. Não foi possível ligar à BD.")
        return
    
    try:
        cursor = conn.cursor()
        
        # A ordem de população é importante devido às FOREIGN KEYs
        
        # 1. Popular tabelas "mãe" primeiro
        populate_departamentos(cursor)
        populate_escaloes(cursor)
        # --- SALVAR (COMMIT) ---
        conn.commit()
        print(">>> Departamentos e Escalões salvos.")

        # 2. Popular tabelas que dependem das anteriores
        populate_professores(cursor)
        populate_staff(cursor) 
        # --- SALVAR (COMMIT) ---
        conn.commit()
        print(">>> Professores e Staff salvos.")
        
        # 3. Popular Turmas (depende de Professores)
        populate_turmas(cursor)
        # --- SALVAR (COMMIT) ---
        conn.commit()
        print(">>> Turmas salvas.")

        # 4. Popular EEs (não depende de nada)
        populate_encarregados_educacao(cursor)
        # --- SALVAR (COMMIT) ---
        conn.commit()
        print(">>> Encarregados de Educação salvos.")
        
        # 5. Popular Alunos (depende de Turmas e EEs)
        populate_alunos(cursor)
        
        # 6. Popular o resto
        populate_disciplinas(cursor)
        
        # --- COMMIT FINAL ---
        conn.commit()
        print("\nBase de dados populada com sucesso!")

    except Error as e:
        print(f"Ocorreu um erro ao popular a base de dados: {e}")
        conn.rollback() # Desfaz quaisquer alterações pendentes se houver um erro
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
            print("Ligação MySQL fechada.")

if __name__ == '__main__':
    main()