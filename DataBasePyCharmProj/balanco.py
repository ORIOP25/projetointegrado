from DataBase import get_connection

# ======================================================
# BALANÇO FINANCEIRO MENSAL
# ======================================================
def balanco_mensal(ano, mes):
    """
    Retorna um balanço financeiro para um mês específico.
    Mostra total de receitas, despesas e saldo.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT 
            SUM(CASE WHEN Tipo='Receita' THEN Valor ELSE 0 END) AS Total_Receita,
            SUM(CASE WHEN Tipo='Despesa' THEN Valor ELSE 0 END) AS Total_Despesa,
            SUM(CASE WHEN Tipo='Receita' THEN Valor ELSE 0 END) - SUM(CASE WHEN Tipo='Despesa' THEN Valor ELSE 0 END) AS Saldo
        FROM Transacoes
        WHERE YEAR(Data) = %s AND MONTH(Data) = %s;
        """
        cursor.execute(query, (ano, mes))
        resultado = cursor.fetchone()
        conn.close()
        return {
            "Total_Receita": float(resultado[0] or 0),
            "Total_Despesa": float(resultado[1] or 0),
            "Saldo": float(resultado[2] or 0)
        }
    except Exception as e:
        print("Erro ao calcular balanço mensal:", e)
        return None


# ======================================================
# BALANÇO FINANCEIRO ANUAL
# ======================================================
def balanco_anual(ano):
    """
    Retorna um balanço financeiro anual.
    Mostra total de receitas, despesas e saldo.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT 
            SUM(CASE WHEN Tipo='Receita' THEN Valor ELSE 0 END) AS Total_Receita,
            SUM(CASE WHEN Tipo='Despesa' THEN Valor ELSE 0 END) AS Total_Despesa,
            SUM(CASE WHEN Tipo='Receita' THEN Valor ELSE 0 END) - SUM(CASE WHEN Tipo='Despesa' THEN Valor ELSE 0 END) AS Saldo
        FROM Transacoes
        WHERE YEAR(Data) = %s;
        """
        cursor.execute(query, (ano,))
        resultado = cursor.fetchone()
        conn.close()
        return {
            "Total_Receita": float(resultado[0] or 0),
            "Total_Despesa": float(resultado[1] or 0),
            "Saldo": float(resultado[2] or 0)
        }
    except Exception as e:
        print("Erro ao calcular balanço anual:", e)
        return None


# ======================================================
# BALANÇO DETALHADO POR FORNECEDOR
# ======================================================
def balanco_por_fornecedor(ano, mes=None):
    """
    Retorna um resumo das transações por fornecedor.
    Se 'mes' for fornecido, filtra por mês específico.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT f.Nome,
               SUM(CASE WHEN t.Tipo='Receita' THEN t.Valor ELSE 0 END) AS Total_Receita,
               SUM(CASE WHEN t.Tipo='Despesa' THEN t.Valor ELSE 0 END) AS Total_Despesa,
               SUM(CASE WHEN t.Tipo='Receita' THEN t.Valor ELSE 0 END) - SUM(CASE WHEN t.Tipo='Despesa' THEN t.Valor ELSE 0 END) AS Saldo
        FROM Transacoes t
        LEFT JOIN Fornecedores f ON t.Fornecedor_id = f.Fornecedor_id
        WHERE YEAR(t.Data) = %s
        """
        params = [ano]

        if mes:
            query += " AND MONTH(t.Data) = %s"
            params.append(mes)

        query += " GROUP BY f.Nome;"
        cursor.execute(query, params)
        resultados = cursor.fetchall()
        conn.close()

        # Transformar em lista de dicionários
        return [
            {
                "Fornecedor": r[0],
                "Total_Receita": float(r[1] or 0),
                "Total_Despesa": float(r[2] or 0),
                "Saldo": float(r[3] or 0)
            }
            for r in resultados
        ]

    except Exception as e:
        print("Erro ao calcular balanço por fornecedor:", e)
        return None
