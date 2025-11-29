import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/services/api"; // instância axios configurada
import { Transacao } from "@/types/transacao"; // tipo

const Finances = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [saldo, setSaldo] = useState<number>(0);

  useEffect(() => {
    const loadTransacoes = async () => {
      try {
        const response = await api.get("/transacoes"); // endpoint da API
        setTransacoes(response.data);

        // calcular saldo
        const total = response.data.reduce((acc: number, t: Transacao) => {
          if (t.Tipo === "Receita") return acc + (t.Valor || 0);
          if (t.Tipo === "Despesa") return acc - (t.Valor || 0);
          return acc;
        }, 0);
        setSaldo(total);
      } catch (error) {
        console.error("Erro ao carregar transações:", error);
      }
    };

    loadTransacoes();
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-3xl font-bold">Finanças</h1>

      {/* Saldo */}
      <Card>
        <CardHeader>
          <CardTitle>Saldo Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-2xl font-semibold">
            {saldo.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </h2>
        </CardContent>
      </Card>

      {/* Lista de transações */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacoes.map((t) => (
                <TableRow key={t.Transacao_id}>
                  <TableCell>{t.Data}</TableCell>
                  <TableCell>{t.Tipo}</TableCell>
                  <TableCell>{t.Descricao}</TableCell>
                  <TableCell>
                    {t.Valor?.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Finances;
