import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errorHandler";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"; // Adicionado Loader2
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { SortableTableHead } from "@/components/SortableTableHead";
import { TablePagination } from "@/components/TablePagination";

const studentSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome não pode ter mais de 100 caracteres")
    .trim(),
  email: z.string()
    .max(255, "Email não pode ter mais de 255 caracteres")
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, "Email inválido")
    .or(z.literal("")),
  phone: z.string()
    .max(20, "Telefone não pode ter mais de 20 caracteres")
    .optional()
    .or(z.literal("")),
  course: z.string()
    .max(100, "Curso não pode ter mais de 100 caracteres")
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive", "graduated"], {
    errorMap: () => ({ message: "Estado inválido" })
  }),
});

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  course: string | null;
  department_id: string | null;
  enrollment_date: string;
  status: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true); // Estado para carregamento inicial/total
  const [isSubmitting, setIsSubmitting] = useState(false); // Novo estado para submissão
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  const { sortedData, sortKey, sortDirection, handleSort } = useTableSort({
    data: students,
    initialSortKey: "name" as keyof Student,
  });
  const { paginatedData, currentPage, totalPages, nextPage, previousPage, goToPage, itemsPerPage, totalItems } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    status: "active",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Não definir loading aqui se já for true
    try {
      const { data, error } = await supabase.from("students").select("*").order("name");

      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(getErrorMessage(error)); // Usar getErrorMessage
    } finally {
      setLoading(false); // Define loading como false após sucesso ou erro
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Inicia submissão

    try {
      const validatedData = studentSchema.parse(formData);
      const dataToSave = {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        course: validatedData.course || null,
        status: validatedData.status,
      };

      if (editingStudent) {
        const { error } = await supabase
          .from("students")
          .update(dataToSave)
          .eq("id", editingStudent.id);
        if (error) throw error;
        toast.success("Aluno atualizado com sucesso");
      } else {
        const { error } = await supabase.from("students").insert([dataToSave]);
        if (error) throw error;
        toast.success("Aluno criado com sucesso");
      }

      setDialogOpen(false);
      resetForm();
      // Recarrega dados
      setLoading(true); // Ativa loading geral antes de recarregar
      loadData();

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(getErrorMessage(error)); // Usa getErrorMessage
      }
    } finally {
      setIsSubmitting(false); // Termina submissão
    }
  };


  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email || "",
      phone: student.phone || "",
      course: student.course || "",
      status: student.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    // Adicionar estado de loading para delete, se desejado
    try {
      const { error } = await supabase.from("students").delete().eq("id", studentToDelete);

      if (error) throw error;

      toast.success("Aluno eliminado com sucesso");
      // Recarrega dados
      setLoading(true);
      loadData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      course: "",
      status: "active",
    });
    setEditingStudent(null);
  };

  if (loading) { // Mostrar loader apenas durante o carregamento inicial/total
     return (
       <div className="flex items-center justify-center min-h-[50vh]">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
       </div>
     );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de Alunos</h1>
          <p className="text-muted-foreground">Gerir registos de alunos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Editar Aluno" : "Novo Aluno"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do aluno
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Curso</Label>
                <Input id="course" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} disabled={isSubmitting}>
                  <SelectTrigger> <SelectValue /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="graduated">Graduado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}> Cancelar </Button>
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

       {/* Tabela de Alunos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                   <SortableTableHead column="name" label="Nome" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                   <SortableTableHead column="email" label="Email" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                   <TableHead>Telefone</TableHead>
                   <SortableTableHead column="course" label="Curso" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                   <SortableTableHead column="status" label="Estado" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                   <TableHead className="text-right">Ações</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {students.length === 0 ? "Nenhum aluno registado" : "Nenhum resultado encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email || "-"}</TableCell>
                      <TableCell>{student.phone || "-"}</TableCell>
                      <TableCell>{student.course || "-"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ student.status === "active" ? "bg-success/10 text-success" : student.status === "graduated" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground" }`}>
                          {student.status === "active" ? "Ativo" : student.status === "graduated" ? "Graduado" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}> <Pencil className="h-4 w-4" /> </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(student.id)}> <Trash2 className="h-4 w-4 text-destructive" /> </Button>
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
              Tem a certeza que deseja eliminar este aluno? Esta ação não pode ser revertida.
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

export default Students;