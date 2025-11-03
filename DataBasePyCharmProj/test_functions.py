from DataBase import insert_data, read_data, delete_data
from balanco import balanco_mensal, balanco_anual, balanco_por_fornecedor

# ===========================
# Testar CRUD básico
# ===========================
print("=== Teste de leitura de Professores ===")
try:
    professores = read_data("Professores")
    for p in professores:
        print(p)
except Exception as e:
    print("Erro ao ler Professores:", e)

print("\n=== Inserir novo Professor ===")
try:
    insert_data("Professores",
                ["Nome","Data_Nasc","Telefone","Morada","Escalao_id","Depart_id"],
                ["Teste Professor","1990-01-01","919999999","Rua Teste, 99",1,1])
    print("Professor inserido com sucesso.")
    teste = read_data("Professores", condition="Nome='Teste Professor'")
    print("Professor inserido:", teste)
except Exception as e:
    print("Erro ao inserir Professor:", e)

print("\n=== Deletar Professor teste ===")
try:
    delete_data("Professores", "Nome='Teste Professor'")
    print("Professor deletado com sucesso.")
    teste = read_data("Professores", condition="Nome='Teste Professor'")
    print("Verificação após delete:", teste)
except Exception as e:
    print("Erro ao deletar Professor:", e)

# ===========================
# Testar balanços financeiros
# ===========================
print("\n=== Balanço Mensal Janeiro 2025 ===")
try:
    resultado = balanco_mensal(2025, 1)
    print(resultado)
except Exception as e:
    print("Erro em balanco_mensal:", e)

print("\n=== Balanço Anual 2025 ===")
try:
    resultado = balanco_anual(2025)
    print(resultado)
except Exception as e:
    print("Erro em balanco_anual:", e)

print("\n=== Balanço por Fornecedor 2025 ===")
try:
    resultados = balanco_por_fornecedor(2025)
    for f in resultados:
        print(f)
except Exception as e:
    print("Erro em balanco_por_fornecedor (anual):", e)

print("\n=== Balanço por Fornecedor Janeiro 2025 ===")
try:
    resultados = balanco_por_fornecedor(2025, 1)
    for f in resultados:
        print(f)
except Exception as e:
    print("Erro em balanco_por_fornecedor (mensal):", e)
