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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";

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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { isGlobalAdmin } = useUserRole();

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
    try {
      const [staffRes, departmentsRes] = await Promise.all([
        supabase.from("staff").select("*").order("name"),
        supabase.from("departments").select("*").order("name"),
      ]);

      if (staffRes.data) {
        // Load roles for each staff member
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingStaff) {
        // Validar dados (sem senha para edição)
        const validatedData = staffSchema.omit({ password: true }).parse(formData);

        // Update existing staff
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
        // Validar dados completos (incluindo senha)
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

        // Get current session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Sessão não encontrada");
        }

        // Call edge function to create staff user (does not affect current session)
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
      loadData();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        // Mostrar erro de validação
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
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
      password: "", // Not used when editing
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este funcionário?")) return;

    try {
      const { error } = await supabase.from("staff").delete().eq("id", id);

      if (error) throw error;

      toast.success("Funcionário eliminado com sucesso");

      loadData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
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

    // Protect the super admin account
    if (staffMember.email === "admin@escola.pt" && newRole !== "global_admin") {
      toast.error("Operação não permitida - O role do super admin não pode ser alterado.");
      return;
    }

    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", staffMember.user_id)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", staffMember.user_id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: staffMember.user_id, role: newRole as any }]);

        if (error) throw error;
      }

      toast.success(`Role de ${staffMember.name} alterada para ${newRole === "global_admin" ? "Global Admin" : "Staff"}`);

      loadData();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

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
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email {!editingStaff && "*"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={!editingStaff}
                  disabled={editingStaff !== null}
                />
                {!editingStaff && (
                  <p className="text-xs text-muted-foreground">
                    Usado para criar credenciais de login
                  </p>
                )}
              </div>
              {!editingStaff && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha Inicial *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres. O funcionário poderá alterar após o primeiro login.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, department_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isGlobalAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="salary">Salário (€)</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="terminated">Terminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "A guardar..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  {isGlobalAdmin && <TableHead>Salário</TableHead>}
                  {isGlobalAdmin && <TableHead>Permissão</TableHead>}
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isGlobalAdmin ? 7 : 5} className="text-center text-muted-foreground">
                      Nenhum funcionário registado
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email || "-"}</TableCell>
                      <TableCell>{member.position}</TableCell>
                      {isGlobalAdmin && (
                        <TableCell>
                          {member.salary
                            ? `€${member.salary.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </TableCell>
                      )}
                      {isGlobalAdmin && (
                        <TableCell>
                          {member.user_id ? (
                            member.email === "admin@escola.pt" ? (
                              <span className="text-sm font-medium flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                                Global Admin (Protegido)
                              </span>
                            ) : (
                              <Select
                                value={member.role || "staff"}
                                onValueChange={(value) => handleRoleChange(member, value)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="global_admin">Global Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )
                          ) : (
                            <span className="text-muted-foreground text-sm">Sem conta</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            member.status === "active"
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {member.status === "active" ? "Ativo" : member.status === "terminated" ? "Terminado" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isGlobalAdmin ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(member)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(member.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Staff;
