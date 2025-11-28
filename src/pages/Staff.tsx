import { useState, useEffect } from "react";
import { Staff } from "@/types/staff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const StaffPage = () => {
  const [formData, setFormData] = useState<Staff>({
    email: "",
    hashed_password: "",
    role: "",
    Nome: "",
    Cargo: "",
    Depart_id: undefined,
    Telefone: "",
    Morada: "",
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  // Vai carregar staff quando a API existir
  useEffect(() => {
    console.log("Aqui iria carregar staff da API.");
  }, []);

  const handleSubmit = () => {
    console.log("Dados do staff enviados (quando a API existir):", formData);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Staff</h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <Plus size={18} />
              Adicionar Staff
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Adicionar / Editar Staff</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mt-4">

              <div>
                <Label>Nome</Label>
                <Input
                  type="text"
                  value={formData.Nome}
                  onChange={(e) => setFormData({ ...formData, Nome: e.target.value })}
                />
              </div>

              <div>
                <Label>Telefone</Label>
                <Input
                    type="text"
                      value={formData.Telefone}
                      onChange={(e) => setFormData({ ...formData, Telefone: e.target.value })}
                />
              </div>

              <div>
                <Label>Morada</Label>
                <Input
                    type="text"
                    value={formData.Morada}
                    onChange={(e) => setFormData({ ...formData, Morada: e.target.value })}
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label>Password (hash futura)</Label>
                <Input
                  type="password"
                  value={formData.hashed_password}
                  onChange={(e) => setFormData({ ...formData, hashed_password: e.target.value })}
                />
              </div>

              <div>
                <Label>Role</Label>
                <Input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>

              <div>
                <Label>Cargo</Label>
                <Input
                  type="text"
                  value={formData.Cargo}
                  onChange={(e) => setFormData({ ...formData, Cargo: e.target.value })}
                />
              </div>

              <div>
                <Label>Departamento ID</Label>
                <Input
                  type="number"
                  value={formData.Depart_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Depart_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Placeholder enquanto a API não existe */}
      <Card className="border-dashed border-2 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            Módulo em Migração
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">A aguardar conexão à API</h3>
          <p className="max-w-sm mt-2 text-sm">
            A lista de staff será carregada automaticamente assim que o backend estiver disponível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffPage;