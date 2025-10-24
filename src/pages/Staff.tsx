import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const { toast } = useToast();
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
        // Update existing staff
        const data = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          department_id: formData.department_id || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          status: formData.status,
        };

        const { error } = await supabase
          .from("staff")
          .update(data)
          .eq("id", editingStaff.id);

        if (error) throw error;

        toast({
          title: "Funcionário atualizado",
          description: "O funcionário foi atualizado com sucesso.",
        });
      } else {
        // Create new staff member with user account
        if (!formData.email) {
          throw new Error("Email é obrigatório para criar credenciais de login");
        }

        if (!formData.password || formData.password.length < 6) {
          throw new Error("A senha deve ter pelo menos 6 caracteres");
        }

        // 1. Create user in auth.users
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.name,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário");

        // 2. Create staff record linked to user
        const staffData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          department_id: formData.department_id || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          status: formData.status,
          user_id: authData.user.id,
        };

        const { error: staffError } = await supabase.from("staff").insert([staffData]);

        if (staffError) {
          // If staff creation fails, we should clean up the auth user
          console.error("Failed to create staff record:", staffError);
          throw new Error("Falha ao criar registro de funcionário");
        }

        // 3. Assign 'staff' role to the new user
        const { error: roleError } = await supabase.from("user_roles").insert([
          {
            user_id: authData.user.id,
            role: "staff",
          },
        ]);

        if (roleError) {
          console.error("Failed to assign role:", roleError);
          // Continue anyway - admin can assign role later
        }

        toast({
          title: "Funcionário criado",
          description: `O funcionário foi criado com sucesso. Credenciais de login criadas para ${formData.email}`,
        });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
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

      toast({
        title: "Funcionário eliminado",
        description: "O funcionário foi eliminado com sucesso.",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Erro",
        description: "Este funcionário não tem conta de usuário associada.",
        variant: "destructive",
      });
      return;
    }

    // Protect the super admin account
    if (staffMember.email === "admin@escola.pt" && newRole !== "global_admin") {
      toast({
        title: "Operação não permitida",
        description: "O role do super admin não pode ser alterado.",
        variant: "destructive",
      });
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

      toast({
        title: "Role atualizada",
        description: `Role de ${staffMember.name} alterada para ${newRole === "global_admin" ? "Global Admin" : "Staff"}.`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">Gerir registos de funcionários</p>
        </div>
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
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres. O funcionário poderá alterar após o primeiro login.
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
