from DataBase import init_db, insert_data, read_data, delete_data, get_connection
from populate_full import popular_dados
from balanco import balanco_mensal, balanco_anual, balanco_por_fornecedor


# ======================================================
# LIMPAR BASE DE DADOS COMPLETA
# ======================================================
def limpar_base():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    tabelas = [
        "Transacoes", "Fornecedores", "Financiamentos", "Ordenados", "Staff",
        "Notas", "TurmasDisciplinas", "Disciplinas", "Alunos", "Turmas",
        "Professores", "Departamentos", "Escaloes", "EncarregadoEducacao", "AI_Recommendation"
    ]
    for tabela in tabelas:
        cursor.execute(f"DROP TABLE IF EXISTS {tabela};")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()
    conn.close()
    print("🧹 Todas as tabelas foram removidas (reset total concluído).")


# ======================================================
# TESTES CRUD SIMPLES
# ======================================================
def testar_crud():
    print("\n🧱 TESTES CRUD:")

    # Inserção
    insert_data("Fornecedores",
                ["Nome", "NIF", "Tipo", "Telefone", "Email", "Morada", "IBAN", "Observacoes"],
                ("Papelaria Central", "123456789", "Material Escolar", "912345678",
                 "papelaria@mail.com", "Rua A, nº10", "PT500123456789000", "Fornecedor local"))

    # Leitura
    fornecedores = read_data("Fornecedores")
    print("📦 Fornecedores na BD:", fornecedores)

    # Deleção
    delete_data("Fornecedores", "Nome='Papelaria Central'")
    fornecedores = read_data("Fornecedores")
    print("📭 Fornecedores após DELETE:", fornecedores)


# ======================================================
# TESTES DE BALANÇOS
# ======================================================
def testar_balancos():
    print("\n📊 TESTES DE BALANÇOS:")

    resultado_mensal = balanco_mensal(2025, 3)
    print(f"📅 Balanço Março 2025: {resultado_mensal}")

    resultado_anual = balanco_anual(2025)
    print(f"📆 Balanço Anual 2025: {resultado_anual}")

    resultado_fornecedores = balanco_por_fornecedor(2025)
    print("🏢 Balanço por Fornecedor:")
    for linha in resultado_fornecedores:
        print("   ", linha)


# ======================================================
# MOSTRAR TODAS AS TABELAS EXISTENTES
# ======================================================
def listar_tabelas():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES;")
    tabelas = cursor.fetchall()
    conn.close()

    print("\n📚 TABELAS EXISTENTES NA BASE DE DADOS:")
    for i, (tabela,) in enumerate(tabelas, start=1):
        print(f"   {i}. {tabela}")


# ======================================================
# MAIN TEST FUNCTION
# ======================================================
if __name__ == "__main__":
    print("\n🚀 INÍCIO DOS TESTES COMPLETOS DA BASE DE DADOS ESCOLA PUBLICA")

    # Reset total
    limpar_base()

    # Recriar DB e tabelas
    init_db()

    # Popular BD
    popular_dados()

    # Testes CRUD
    testar_crud()

    # Testes de balanço
    testar_balancos()

    # Mostrar tabelas
    listar_tabelas()

    print("\n✅ TODOS OS TESTES EXECUTADOS COM SUCESSO!")