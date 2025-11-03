from DataBase import insert_data, init_db

# Inicializa a base de dados e tabelas
init_db()

# ===========================
# Departamentos
# ===========================
departamentos = ["Matemática", "Física", "Química", "Informática"]
for dep in departamentos:
    insert_data("Departamentos", ["Nome"], [dep])

# ===========================
# Escalões
# ===========================
escaloes = [
    ("A1", "Escalão inicial", 1200.00, 0.00),
    ("B1", "Escalão intermédio", 1500.00, 100.00),
    ("C1", "Escalão avançado", 1800.00, 200.00)
]
for e in escaloes:
    insert_data("Escaloes", ["Nome", "Descricao", "Valor_Base", "Bonus"], e)

# ===========================
# Professores
# ===========================
professores = [
    ("João Silva","1980-05-12","912345678","Rua A, 10",1,1),
    ("Ana Pereira","1975-07-20","913334455","Rua B, 15",2,2),
    ("Carlos Lima","1982-11-05","914556677","Rua C, 20",3,3)
]
for p in professores:
    insert_data("Professores", ["Nome","Data_Nasc","Telefone","Morada","Escalao_id","Depart_id"], p)

# ===========================
# Staff
# ===========================
staffs = [
    ("Maria Costa","Secretária",1,"913445566","Rua D, 5"),
    ("Pedro Gomes","Tesoureiro",2,"912334455","Rua E, 12")
]
for s in staffs:
    insert_data("Staff", ["Nome","Cargo","Depart_id","Telefone","Morada"], s)

# ===========================
# Turmas
# ===========================
turmas = [
    (2025,"A","2025/2026",1),
    (2025,"B","2025/2026",2)
]
for t in turmas:
    insert_data("Turmas", ["Ano","Turma","AnoLetivo","DiretorT"], t)

# ===========================
# Encarregados de Educação
# ===========================
encarregados = [
    ("Carlos Mendes","914445566","carlos@email.com","Rua F, 30","Pai"),
    ("Sofia Martins","915556677","sofia@email.com","Rua G, 40","Mãe")
]
for ee in encarregados:
    insert_data("EncarregadoEducacao", ["Nome","Telefone","Email","Morada","Relacao"], ee)

# ===========================
# Alunos
# ===========================
alunos = [
    ("Ana Santos","2010-03-15","915556677","Rua H, 10","F",5,1,1),
    ("Bruno Almeida","2011-06-22","916667788","Rua I, 20","M",5,1,2),
    ("Clara Sousa","2010-09-30","917778899","Rua J, 30","F",5,2,2)
]
for a in alunos:
    insert_data("Alunos", ["Nome","Data_Nasc","Telefone","Morada","Genero","Ano","Turma_id","EE_id"], a)

# ===========================
# Disciplinas
# ===========================
disciplinas = [
    ("Matemática","Científica"),
    ("Física","Científica"),
    ("Química","Científica"),
    ("Informática","Tecnológica")
]
for d in disciplinas:
    insert_data("Disciplinas", ["Nome","Categoria"], d)

# ===========================
# TurmasDisciplinas
# ===========================
turmas_disciplinas = [
    (1,1,1),
    (1,2,2),
    (2,1,1),
    (2,4,3)
]
for td in turmas_disciplinas:
    insert_data("TurmasDisciplinas", ["Turma_id","Disc_id","Professor_id"], td)

# ===========================
# Notas
# ===========================
notas = [
    (1,1,15,16,14,18,16,"2025/2026"),
    (2,1,13,14,15,17,15,"2025/2026"),
    (3,4,18,19,17,20,18,"2025/2026")
]
for n in notas:
    insert_data("Notas", ["Aluno_id","Disc_id","Nota_1P","Nota_2P","Nota_3P","Nota_Ex","Nota_Final","Ano_letivo"], n)

# ===========================
# Ordenados
# ===========================
ordenados = [
    (1,None,"Janeiro",2025,1500.00,"2025-01-31","Pagamento regular"),
    (None,1,"Janeiro",2025,1200.00,"2025-01-31","Pagamento staff")
]
for o in ordenados:
    insert_data("Ordenados", ["Professor_id","Staff_id","Mes","Ano","Valor","Data_Pagamento","Observacoes"], o)

# ===========================
# Financiamentos
# ===========================
financiamentos = [
    ("Estado",50000.00,2025,"Financiamento anual"),
    ("Paróquia",5000.00,2025,"Doação para material")
]
for f in financiamentos:
    insert_data("Financiamentos", ["Tipo","Valor","Ano","Observacoes"], f)

# ===========================
# Fornecedores
# ===========================
fornecedores = [
    ("Papelaria ABC","123456789","Material Escolar","912233445","abc@email.com","Rua K, 10","PT500012345678901234567","Fornecedor de papelaria"),
    ("Cantina XYZ","987654321","Alimentação","913344556","xyz@email.com","Rua L, 20","PT600098765432109876543","Fornecedor de cantina")
]
for f in fornecedores:
    insert_data("Fornecedores", ["Nome","NIF","Tipo","Telefone","Email","Morada","IBAN","Observacoes"], f)

# ===========================
# Transações
# ===========================
transacoes = [
    ("Receita",50000.00,"2025-01-10","Financiamento Estado",1,None),
    ("Receita",5000.00,"2025-01-15","Doação Paróquia",2,None),
    ("Despesa",2000.00,"2025-01-20","Compra material escolar",None,1),
    ("Despesa",1500.00,"2025-01-25","Alimentação alunos",None,2)
]
for t in transacoes:
    insert_data("Transacoes", ["Tipo","Valor","Data","Descricao","Fin_id","Fornecedor_id"], t)

# ===========================
# AI_Recommendation
# ===========================
ai_textos = [
    "Rever horários das turmas",
    "Adicionar novas disciplinas",
    "Aumentar o financiamento para informática"
]
for ai in ai_textos:
    insert_data("AI_Recommendation", ["Texto"], [ai])

print("População completa das tabelas concluída!")
