import pandas as pd
from DataBase import get_connection  # importa apenas a função

def export_to_excel(output_file="EscolaPublica_Export.xlsx"):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES;")
        tabelas = [t[0] for t in cursor.fetchall()]

        if not tabelas:
            print("Nenhuma tabela encontrada na base de dados.")
            return

        with pd.ExcelWriter(output_file, engine="openpyxl", date_format="YYYY-MM-DD") as writer:
            for tabela in tabelas:
                # Lê os dados da tabela
                cursor.execute(f"SELECT * FROM {tabela}")
                colunas = [desc[0] for desc in cursor.description]
                dados = cursor.fetchall()
                df = pd.DataFrame(dados, columns=colunas)

                # Converte automaticamente colunas com nomes de datas
                for col in df.columns:
                    if "data" in col.lower() or "nasc" in col.lower():
                        df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime("%Y-%m-%d")

                df.to_excel(writer, sheet_name=tabela[:31], index=False)
                print(f"Tabela '{tabela}' exportada com sucesso.")

        print(f"\nExportação concluída: {output_file}")

    except Error as e:
        print("Erro ao exportar dados:", e)
    except Exception as ex:
        print("Erro inesperado:", ex)
    finally:
        if conn.is_connected():
            conn.close()

# ======================================================
# EXECUÇÃO DIRETA
# ======================================================
if __name__ == "__main__":
    export_to_excel()