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
    print("Todas as tabelas foram removidas (reset total concluído).")


# ======================================================
# TESTES CRUD SIMPLES
# ======================================================
def testar_crud():
    print("\nTESTES CRUD:")

    conn = get_connection()
    cursor = conn.cursor()

    # Dados do fornecedor a testar
    nome = "Papelaria Central"
    nif = "123456789"

    # Verificar se já existe um fornecedor com o mesmo NIF
    cursor.execute("SELECT COUNT(*) FROM Fornecedores WHERE NIF = %s", (nif,))
    if cursor.fetchone()[0] == 0:
        try:
            insert_data(
                "Fornecedores",
                ["Nome", "NIF", "Tipo", "Telefone", "Email", "Morada", "IBAN", "Observacoes"],
                (nome, nif, "Material Escolar", "912345678", "papelaria@mail.com",
                 "Rua A, nº10", "PT500123456789000", "Fornecedor local")
            )
            print("Fornecedor inserido com sucesso.")
        except Exception as e:
            print(f"Erro ao inserir fornecedor: {e}")
    else:
        print("Fornecedor já existente, a inserção foi ignorada.")

    # Leitura dos fornecedores
    fornecedores = read_data("Fornecedores")
    print("Fornecedores na BD:", fornecedores)

    # Tentar eliminar o fornecedor
    try:
        # Primeiro apaga transações associadas, se existirem
        cursor.execute("""
            DELETE FROM Transacoes
            WHERE Fornecedor_id IN (
                SELECT Fornecedor_id FROM Fornecedores WHERE Nome = %s
            )
        """, (nome,))
        conn.commit()

        # Agora apaga o fornecedor
        delete_data("Fornecedores", f"Nome='{nome}'")
        print("Fornecedor eliminado com sucesso.")
    except Exception as e:
        print(f"Erro ao deletar fornecedor: {e}")

    # Mostrar fornecedores após tentativa de eliminação
    fornecedores = read_data("Fornecedores")
    print("Fornecedores após DELETE:", fornecedores)

    # Fechar conexão
    cursor.close()
    conn.close()

# ======================================================
# TESTES DE BALANÇOS
# ======================================================
def testar_balancos():
    print("\nTESTES DE BALANÇOS:")

    resultado_mensal = balanco_mensal(2025, 3)
    print(f"Balanço Março 2025: {resultado_mensal}")

    resultado_anual = balanco_anual(2025)
    print(f"Balanço Anual 2025: {resultado_anual}")

    resultado_fornecedores = balanco_por_fornecedor(2025)
    print("Balanço por Fornecedor:")
    for linha in resultado_fornecedores:
        print("   ", linha)


# ======================================================
# MOSTRAR TODAS AS TABELAS E DADOS
# ======================================================
def mostrar_tabelas_e_dados():
    print("\nLISTAGEM COMPLETA DAS TABELAS E DADOS:")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tabelas = [t[0] for t in cursor.fetchall()]

    if not tabelas:
        print("Nenhuma tabela encontrada.")
    else:
        for tabela in tabelas:
            print(f"\n=== {tabela} ===")
            cursor.execute(f"SELECT * FROM {tabela}")
            linhas = cursor.fetchall()
            colunas = [desc[0] for desc in cursor.description]
            if linhas:
                print(" | ".join(colunas))
                for linha in linhas:
                    print(" | ".join(str(x) if x is not None else "" for x in linha))
            else:
                print("(sem dados)")
    conn.close()


# ======================================================
# MAIN TEST FUNCTION
# ======================================================
if __name__ == "__main__":
    print("\nINÍCIO DOS TESTES COMPLETOS DA BASE DE DADOS ESCOLA PUBLICA")

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

    # Mostrar todas as tabelas e respetivos dados
    mostrar_tabelas_e_dados()

    print("\nTODOS OS TESTES EXECUTADOS COM SUCESSO!")