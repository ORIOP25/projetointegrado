from DataBase import get_connection

def popular_dados():
    conn = get_connection()
    cursor = conn.cursor()

    # =======================
    # ESCALÕES
    # =======================
    cursor.execute("""
        INSERT INTO Escaloes (Nome, Descricao, Valor_Base, Bonus) VALUES
        ('Escalão A', 'Base', 1200.00, 200.00),
        ('Escalão B', 'Intermédio', 1500.00, 250.00),
        ('Escalão C', 'Avançado', 1800.00, 300.00),
        ('Escalão D', 'Sénior', 2000.00, 400.00),
        ('Escalão E', 'Mestre', 2500.00, 500.00)
    """)

    # =======================
    # DEPARTAMENTOS
    # =======================
    cursor.execute("""
        INSERT INTO Departamentos (Nome) VALUES
        ('Matemática'),
        ('Português'),
        ('História'),
        ('Ciências'),
        ('Educação Física')
    """)

    # =======================
    # PROFESSORES
    # =======================
    cursor.execute("""
        INSERT INTO Professores (Nome, Data_Nasc, Telefone, Morada, Escalao_id, Depart_id) VALUES
        ('João Pinto', '1980-03-12', '919999001', 'Lisboa', 1, 1),
        ('Ana Costa', '1985-05-20', '919999002', 'Porto', 2, 2),
        ('Rui Alves', '1978-11-10', '919999003', 'Coimbra', 3, 3),
        ('Marta Gomes', '1990-09-15', '919999004', 'Faro', 4, 4),
        ('Pedro Lopes', '1982-01-05', '919999005', 'Setúbal', 5, 5)
    """)

    # =======================
    # TURMAS
    # =======================
    cursor.execute("""
        INSERT INTO Turmas (Ano, Turma, AnoLetivo, DiretorT) VALUES
        (7, 'A', '2024/2025', 1),
        (8, 'A', '2024/2025', 2),
        (9, 'A', '2024/2025', 3)
    """)

    # =======================
    # ENCARREGADOS DE EDUCAÇÃO
    # =======================
    cursor.execute("""
        INSERT INTO EncarregadoEducacao (Nome, Telefone, Email, Morada, Relacao) VALUES
        ('Carlos Sousa', '912345678', 'carlos.sousa@gmail.com', 'Rua das Flores, Lisboa', 'Pai'),
        ('Paula Nunes', '913876234', 'paula.nunes@hotmail.com', 'Av. do Sol, Porto', 'Mãe'),
        ('Ricardo Melo', '911223344', 'ricardo.melo@outlook.com', 'Rua das Oliveiras, Braga', 'Tio')
    """)

    # =======================
    # ALUNOS
    # =======================
    cursor.execute("""
        INSERT INTO Alunos (Nome, Data_Nasc, Genero, Ano, Turma_id, Escalao, EE_id) VALUES
        ('Diogo Lopes', '2012-03-14', 'M', 7, 1, 1, 1),
        ('Beatriz Nunes', '2011-09-21', 'F', 7, 1, 2, 2),
        ('André Silva', '2010-12-10', 'M', 8, 2, 3, 3)
    """)

    # =======================
    # DISCIPLINAS
    # =======================
    cursor.execute("""
        INSERT INTO Disciplinas (Nome, Categoria) VALUES
        ('Matemática', 'Ciências Exatas'),
        ('Português', 'Línguas'),
        ('História', 'Ciências Humanas'),
        ('Ciências Naturais', 'Ciências Exatas'),
        ('Educação Física', 'Desporto')
    """)

    # =======================
    # TURMAS-DISCIPLINAS
    # =======================
    cursor.execute("""
        INSERT INTO TurmasDisciplinas (Turma_id, Disc_id, Professor_id) VALUES
        (1, 1, 1),
        (1, 2, 2),
        (2, 3, 3),
        (3, 4, 4),
        (3, 5, 5)
    """)

    # =======================
    # NOTAS
    # =======================
    cursor.execute("""
        INSERT INTO Notas (Aluno_id, Disc_id, Nota_1P, Nota_2P, Nota_3P, Nota_Ex, Nota_Final, Ano_letivo) VALUES
        (1, 1, 16, NULL, NULL, NULL, 16, '2024/2025'),
        (1, 2, 15, NULL, NULL, NULL, 15, '2024/2025'),
        (2, 3, 17, NULL, NULL, NULL, 17, '2024/2025'),
        (3, 4, 14, NULL, NULL, NULL, 14, '2024/2025'),
        (3, 5, 18, NULL, NULL, NULL, 18, '2024/2025')
    """)

    # =======================
    # STAFF
    # =======================
    cursor.execute("""
        INSERT INTO Staff (Nome, Cargo, Depart_id, Telefone, Morada) VALUES
        ('Maria Fernandes', 'Secretária', 1, '912345678', 'Rua Principal, 10'),
        ('José Pereira', 'Porteiro', 2, '913456789', 'Av. da Escola, 25'),
        ('Luísa Gomes', 'Limpeza', 3, '914567890', 'Rua das Flores, 33')
    """)

    # =======================
    # ORDENADOS
    # =======================
    cursor.execute("""
        INSERT INTO Ordenados (Funcionario_id, Mes, Ano, Valor) VALUES
        (1, 1, 2025, 1200.00),
        (2, 1, 2025, 1000.00),
        (3, 1, 2025, 950.00)
    """)

    # =======================
    # FORNECEDORES
    # =======================
    cursor.execute("""
        INSERT INTO Fornecedores (Nome, NIF, Tipo, Telefone, Email, Morada, IBAN, Observacoes) VALUES
        ('Papelaria Central', '123456789', 'Material Escolar', '912345678', 'papelaria@mail.com', 'Rua A, nº10', 'PT500123456789000', 'Fornecedor local'),
        ('TechStore', '987654321', 'Informática', '934567890', 'techstore@gmail.com', 'Av. Principal, 45', 'PT500987654321000', 'Equipamentos escolares'),
        ('LimpServ', '112233445', 'Serviços de Limpeza', '922334455', 'limpserv@mail.com', 'Rua Industrial, 5', 'PT501122334455000', 'Contratado anual')
    """)

    # =======================
    # FINANCIAMENTOS
    # =======================
    cursor.execute("""
        INSERT INTO Financiamentos (Tipo, Valor, Ano, Observacoes) VALUES
        ('Câmara Municipal', 10000.00, 2025, 'Apoio anual às escolas'),
        ('Ministério da Educação', 25000.00, 2025, 'Verba para material escolar')
    """)
    # =======================
    # TRANSACOES
    # =======================
    cursor.execute("""
        INSERT INTO Transacoes (Tipo, Valor, Data, Descricao, Fin_id, Fornecedor_id) VALUES
        ('Receita', 5000.00, '2025-01-15', 'Propinas Janeiro', 1, NULL),
        ('Despesa', 2000.00, '2025-01-20', 'Compra material escolar', NULL, 1),
        ('Despesa', 1800.00, '2025-02-10', 'Compra computadores', NULL, 2),
        ('Despesa', 950.00, '2025-02-28', 'Serviços de limpeza', NULL, 3)
    """)

    # =======================
    # AI RECOMMENDATION
    # =======================
    cursor.execute("""
        INSERT INTO AI_Recommendation (Texto) VALUES
        ('[Financeira] Sugerido reduzir despesas administrativas em 10% (Confiança: 0.85)'),
        ('[Académica] Aumentar reforço em Matemática para o 8º ano (Confiança: 0.92)')
    """)

    conn.commit()
    conn.close()
    print("Base de dados populada com dados de exemplo em todas as tabelas.")