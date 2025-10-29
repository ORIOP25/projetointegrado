import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errorHandler";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/useUserRole";
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

const staffSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome não pode ter mais de 100 caracteres")
    .trim(),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email não pode ter mais de 255 caracteres"),
  phone: z.string()
    .max(20, "Telefone não pode ter mais de 20 caracteres")
    .optional()
    .or(z.literal("")),
  position: z.string()
    .min(1, "Cargo é obrigatório")
    .max(100, "Cargo não pode ter mais de 100 caracteres")
    .trim(),
  salary: z.string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || !isNaN(parseFloat(val)), "Salário inválido")
    .refine((val) => !val || parseFloat(val) >= 0, "Salário não pode ser negativo"),
  status: z.enum(["active", "inactive", "terminated"], {
    errorMap: () => ({ message: "Estado inválido" })
  }),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .optional()
    .or(z.literal("")),
});

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string;
  department_id: string | null;
  salary: number | null;
  hire_date: string;
  status: string;
  user_id: string | null;
  role?: string | null;
}

interface Department {
  id: string;
  name: string;
}

const Staff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true); // Estado para carregamento inicial/total
  const [isSubmitting, setIsSubmitting] = useState(false); // Novo estado para submissão
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const { isGlobalAdmin } = useUserRole();

  const { sortedData, sortKey, sortDirection, handleSort } = useTableSort({
    data: staff,
    initialSortKey: "name" as keyof StaffMember,
  });
  const { paginatedData, currentPage, totalPages, nextPage, previousPage, goToPage, itemsPerPage, totalItems } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department_id: "",
    salary: "",
    status: "active",
    password: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Não definir loading aqui se já for true
    try {
      const [staffRes, departmentsRes] = await Promise.all([
        supabase.from("staff").select("*").order("name"),
        supabase.from("departments").select("*").order("name"),
      ]);

      if (staffRes.data) {
        const staffWithRoles = await Promise.all(
          staffRes.data.map(async (member) => {
            if (member.user_id) {
              const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", member.user_id)
                .maybeSingle();
              return { ...member, role: roleData?.role || null };
            }
            return { ...member, role: null };
          })
        );
        setStaff(staffWithRoles);
      }
      if (departmentsRes.data) setDepartments(departmentsRes.data);
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
      if (editingStaff) {
        const validatedData = staffSchema.omit({ password: true }).parse(formData);
        const data = {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          position: validatedData.position,
          department_id: formData.department_id || null,
          salary: validatedData.salary ? parseFloat(validatedData.salary) : null,
          status: validatedData.status,
        };

        const { error } = await supabase
          .from("staff")
          .update(data)
          .eq("id", editingStaff.id);

        if (error) throw error;
        toast.success("Funcionário atualizado com sucesso");
      } else {
        const validatedData = staffSchema.parse({
          ...formData,
          password: formData.password || "",
        });

        if (!validatedData.email) {
          throw new Error("Email é obrigatório para criar credenciais de login");
        }
        if (!validatedData.password || validatedData.password.length < 8) {
          throw new Error("A senha deve ter pelo menos 8 caracteres");
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Sessão não encontrada");
        }

        const { data, error } = await supabase.functions.invoke('create-staff-user', {
          body: {
            email: validatedData.email,
            password: validatedData.password,
            name: validatedData.name,
            phone: validatedData.phone || null,
            position: validatedData.position,
            department_id: formData.department_id || null,
            salary: validatedData.salary ? parseFloat(validatedData.salary) : null,
            status: validatedData.status,
          },
        });

        if (error) {
          throw new Error(error.message || "Falha ao criar funcionário");
        }
        if (!data.success) {
          throw new Error(data.error || "Falha ao criar funcionário");
        }
        toast.success(`Funcionário criado com sucesso. Credenciais de login criadas para ${validatedData.email}`);
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
        toast.error(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false); // Termina submissão
    }
  };


  const handleEdit = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      position: staffMember.position,
      department_id: staffMember.department_id || "",
      salary: staffMember.salary?.toString() || "",
      status: staffMember.status,
      password: "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setStaffToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    // Adicionar estado de loading para delete, se desejado
    try {
      const { error } = await supabase.from("staff").delete().eq("id", staffToDelete);

      if (error) throw error;

      toast.success("Funcionário eliminado com sucesso");
      // Recarrega dados
      setLoading(true);
      loadData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      position: "",
      department_id: "",
      salary: "",
      status: "active",
      password: "",
    });
    setEditingStaff(null);
  };

  const handleRoleChange = async (staffMember: StaffMember, newRole: string) => {
    if (!staffMember.user_id) {
      toast.error("Este funcionário não tem conta de usuário associada.");
      return;
    }
    if (staffMember.email === "admin@escola.pt" && newRole !== "global_admin") {
      toast.error("Operação não permitida - O role do super admin não pode ser alterado.");
      return;
    }
    // Adicionar estado de loading específico para esta ação, se demorar
    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", staffMember.user_id)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", staffMember.user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: staffMember.user_id, role: newRole as any }]);
        if (error) throw error;
      }
      toast.success(`Role de ${staffMember.name} alterada para ${newRole === "global_admin" ? "Global Admin" : "Staff"}`);
      // Recarrega dados
      setLoading(true);
      loadData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
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
          <h1 className="text-3xl font-bold mb-2">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">Gerir registos de funcionários</p>
        </div>
        {isGlobalAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStaff ? "Editar Funcionário" : "Novo Funcionário"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do funcionário
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email {!editingStaff && "*"}</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required={!editingStaff} disabled={editingStaff !== null || isSubmitting} />
                  {!editingStaff && ( <p className="text-xs text-muted-foreground"> Usado para criar credenciais de login </p> )}
                </div>
                {!editingStaff && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Inicial *</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} disabled={isSubmitting} />
                    <p className="text-xs text-muted-foreground"> Mínimo 8 caracteres. O funcionário poderá alterar após o primeiro login. </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo *</Label>
                  <Input id="position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} required disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })} disabled={isSubmitting}>
                    <SelectTrigger> <SelectValue placeholder="Selecionar departamento" /> </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => ( <SelectItem key={dept.id} value={dept.id}> {dept.name} </SelectItem> ))}
                    </SelectContent>
                  </Select>
                </div>
                {isGlobalAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salário (€)</Label>
                    <Input id="salary" type="number" step="0.01" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} disabled={isSubmitting} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} disabled={isSubmitting}>
                    <SelectTrigger> <SelectValue /> </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="terminated">Terminado</SelectItem>
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
        )}
      </div>

       {/* Tabela de Funcionários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                   <SortableTableHead column="name" label="Nome" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                   <SortableTableHead column="email" label="Email" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                   <SortableTableHead column="position" label="Cargo" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                   {isGlobalAdmin && ( <SortableTableHead column="salary" label="Salário" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} /> )}
                   {isGlobalAdmin && <TableHead>Permissão</TableHead>}
                   <SortableTableHead column="status" label="Estado" sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                   <TableHead className="text-right">Ações</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isGlobalAdmin ? 7 : 5} className="text-center text-muted-foreground">
                      {staff.length === 0 ? "Nenhum funcionário registado" : "Nenhum resultado encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email || "-"}</TableCell>
                      <TableCell>{member.position}</TableCell>
                      {isGlobalAdmin && ( <TableCell> {member.salary ? `€${member.salary.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}` : "-"} </TableCell> )}
                      {isGlobalAdmin && (
                        <TableCell>
                          {member.user_id ? (
                            member.email === "admin@escola.pt" ? (
                              <span className="text-sm font-medium flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                                Global Admin (Protegido)
                              </span>
                            ) : (
                              <Select value={member.role || "staff"} onValueChange={(value) => handleRoleChange(member, value)}>
                                <SelectTrigger className="w-[140px]"> <SelectValue /> </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="global_admin">Global Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )
                          ) : ( <span className="text-muted-foreground text-sm">Sem conta</span> )}
                        </TableCell>
                      )}
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ member.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground" }`}>
                          {member.status === "active" ? "Ativo" : member.status === "terminated" ? "Terminado" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isGlobalAdmin ? (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}> <Pencil className="h-4 w-4" /> </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}> <Trash2 className="h-4 w-4 text-destructive" /> </Button>
                          </div>
                        ) : ( <span className="text-muted-foreground text-sm">-</span> )}
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
              Tem a certeza que deseja eliminar este funcionário? Esta ação não pode ser revertida.
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

export default Staff;