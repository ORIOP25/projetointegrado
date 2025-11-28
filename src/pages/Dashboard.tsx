import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  useEffect(() => {
    console.log("Carregar estatísticas quando a API existir");
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {/* Placeholder para cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 bg-muted/50">
          <CardHeader>
            <CardTitle>Alunos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>A aguardar conexão à API...</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 bg-muted/50">
          <CardHeader>
            <CardTitle>Staff</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>A aguardar conexão à API...</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 bg-muted/50">
          <CardHeader>
            <CardTitle>Turmas Ativas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>A aguardar conexão à API...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;