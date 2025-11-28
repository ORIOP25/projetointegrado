import { useState, useEffect } from "react";
import { Aluno } from "@/types/aluno";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Students = () => {
  const [formData, setFormData] = useState<Aluno>({
    Nome: "",
    Data_Nasc: "",
    Telefone: "",
    Morada: "",
    Genero: "M",
    Ano: new Date().getFullYear(),
    Turma_id: undefined,
    Escalao: "",
    EE_id: undefined,
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  // useEffect para carregar dados
  useEffect(() => {
    console.log("Aqui vai carregar alunos quando a API existir.");
  }, []);

  // Função de guardar (por agora só mostra dados)
  const handleSubmit = () => {
    console.log("Dados do aluno que seriam enviados para a API:", formData);
    setDialogOpen(false); // fecha o diálogo
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Alunos</h1>

        {/* Botão Adicionar Aluno */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <Plus size={18} />
              Adicionar Aluno
            </Button>
          </DialogTrigger>

          {/* Formulário */}
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Adicionar / Editar Aluno</DialogTitle>
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
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={formData.Data_Nasc}
                  onChange={(e) => setFormData({ ...formData, Data_Nasc: e.target.value })}
                />
              </div>

              <div>
                <Label>Género</Label>
                <select
                  className="input"
                  value={formData.Genero}
                  onChange={(e) => setFormData({ ...formData, Genero: e.target.value as "M" | "F" })}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
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
                <Label>Escalão</Label>
                <Input
                  type="text"
                  value={formData.Escalao}
                  onChange={(e) => setFormData({ ...formData, Escalao: e.target.value })}
                />
              </div>

              <div>
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={formData.Ano}
                  onChange={(e) => setFormData({ ...formData, Ano: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>

              <div>
                <Label>Turma ID</Label>
                <Input
                  type="number"
                  value={formData.Turma_id}
                  onChange={(e) => setFormData({ ...formData, Turma_id: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>

              <div>
                <Label>ID do Encarregado</Label>
                <Input
                  type="number"
                  value={formData.EE_id}
                  onChange={(e) => setFormData({ ...formData, EE_id: e.target.value ? Number(e.target.value) : undefined })}
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

      {/* Placeholder para mostrar que ainda não há conexão com API */}
      <Card className="border-dashed border-2 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-5 w-5" />
            Módulo em Migração
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">A aguardar conexão à API</h3>
          <p className="max-w-sm mt-2 text-sm">
            A lista de alunos e os formulários estão a ser reconstruídos para comunicação futura com o backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;
