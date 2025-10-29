import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errorHandler";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react"; // Adicionado Loader2
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { z } from "zod";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { TablePagination } from "@/components/TablePagination";

const financeSchema = z.object({
  type: z.enum(["revenue", "expense"], {
    errorMap: () => ({ message: "Tipo inválido" })
  }),
  category: z.string()
    .min(1, "Categoria é obrigatória")
    .max(100, "Categoria não pode ter mais de 100 caracteres")
    .trim(),
  amount: z.string()
    .refine((val) => !isNaN(parseFloat(val)), "Valor inválido")
    .refine((val) => parseFloat(val) > 0, "Valor deve ser maior que zero"),
  description: z.string()
    .max(500, "Descrição não pode ter mais de 500 caracteres")
    .optional()
    .or(z.literal("")),
  transaction_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
}

const Finances = () => {
  const { isGlobalAdmin } = useUserRole();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true); // Estado para carregamento inicial/total
  const [isSubmitting, setIsSubmitting] = useState(false); // Novo estado para submissão do formulário
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "revenue",
    category: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const { sortedData, sortKey, sortDirection, handleSort } = useTableSort({
    data: transactions,
    initialSortKey: "transaction_date" as keyof Transaction,
    initialDirection: "desc",
  });
  const { paginatedData, currentPage, totalPages, nextPage, previousPage, goToPage, itemsPerPage, totalItems } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const loadTransactions = async () => {
    // Não definir loading aqui se já for true
    try {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
      setLoading(false); // Define loading como false após sucesso

    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error(getErrorMessage(error));
      setLoading(false); // Define loading como false também em caso de erro
    }
  };

  useEffect(() => {
    if (isGlobalAdmin) {
       loadTransactions(); // Carrega dados na montagem
    } else {
      setLoading(false); // Define loading como false se não for admin
    }
  }, [isGlobalAdmin]);

  // Restante do código do componente...
  if (!isGlobalAdmin && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Apenas Global Admins têm acesso à gestão financeira.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

   if (loading) { // Mostrar loader apenas durante o carregamento inicial/total
     return (
       <div className="flex items-center justify-center min-h-[50vh]">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
       </div>
     );
  }

  // Cálculos (apenas se for admin e não estiver loading)
  const totalRevenue = transactions
    .filter((t) => t.type === "revenue")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Inicia a submissão

    try {
      const validatedData = financeSchema.parse(formData);

      const dataToSave = {
        type: validatedData.type,
        category: validatedData.category,
        amount: parseFloat(validatedData.amount),
        description: validatedData.description || null,
        transaction_date: validatedData.transaction_date,
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from("financial_transactions")
          .update(dataToSave)
          .eq("id", editingTransaction.id);

        if (error) throw error;
        toast.success("Transação atualizada com sucesso");
      } else {
        const { error } = await supabase.from("financial_transactions").insert([dataToSave]);

        if (error) throw error;
        toast.success("Transação criada com sucesso");
      }

      setDialogOpen(false);
      resetForm();
      // Recarrega os dados (setLoading será gerido dentro de loadTransactions)
      setLoading(true); // Ativa o loading geral antes de recarregar
      loadTransactions();

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(getErrorMessage(error)); // Usa getErrorMessage aqui também
      }
    } finally {
      setIsSubmitting(false); // Termina a submissão
    }
  };


  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description || "",
      transaction_date: transaction.transaction_date,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    // Adicionar estado de loading para a ação de apagar, se desejado
    try {
      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", transactionToDelete);

      if (error) throw error;

      toast.success("Transação eliminada com sucesso");
      // Recarrega os dados
      setLoading(true);
      loadTransactions();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "revenue",
      category: "",
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
    setEditingTransaction(null);
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão Financeira</h1>
          <p className="text-muted-foreground">Gerir receitas e despesas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? "Editar Transação" : "Nova Transação"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da transação
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos do formulário */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={isSubmitting} // Desabilitar campos durante submissão
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Propinas, Salários, Manutenção..."
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (€) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Data *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) =>
                    setFormData({ ...formData, transaction_date: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Informações adicionais..."
                  disabled={isSubmitting}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting} // Desabilitar Cancelar também
                >
                  Cancelar
                </Button>
                {/* Botão de submissão com estado de loading */}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

       {/* Cards de Resumo Financeiro */}
       <div className="grid gap-4 md:grid-cols-3 mb-6">
         {/* Card Receitas */}
         <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Total Receitas</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                €{totalRevenue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          {/* Card Despesas */}
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Total Despesas</span>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                €{totalExpenses.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          {/* Card Saldo */}
         <Card
            className={`bg-gradient-to-br ${
              totalRevenue - totalExpenses >= 0
                ? "from-primary/10 to-primary/5 border-primary/20"
                : "from-warning/10 to-warning/5 border-warning/20"
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totalRevenue - totalExpenses >= 0 ? "text-success" : "text-warning"
                }`}
              >
                €
                {(totalRevenue - totalExpenses).toLocaleString("pt-PT", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    column="transaction_date" label="Data" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}
                  />
                  <SortableTableHead
                    column="type" label="Tipo" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}
                  />
                  <SortableTableHead
                    column="category" label="Categoria" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}
                  />
                  <TableHead>Descrição</TableHead>
                  <SortableTableHead
                    column="amount" label="Valor" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} className="text-right"
                  />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {transactions.length === 0 ? "Nenhuma transação registada" : "Nenhum resultado encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            transaction.type === "revenue"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {transaction.type === "revenue" ? ( <TrendingUp className="h-3 w-3" /> ) : ( <TrendingDown className="h-3 w-3" /> )}
                          {transaction.type === "revenue" ? "Receita" : "Despesa"}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.category}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.description || "-"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          transaction.type === "revenue" ? "text-success" : "text-destructive"
                        }`}
                      >
                        {transaction.type === "revenue" ? "+" : "-"}€
                        {(Number(transaction.amount) || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(transaction.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage}
            onPreviousPage={previousPage} onNextPage={nextPage} onGoToPage={goToPage}
          />
        </CardContent>
      </Card>

      {/* AlertDialog para Confirmação de Eliminação */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar esta transação? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Finances;