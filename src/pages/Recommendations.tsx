import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errorHandler";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useUserRole } from "@/hooks/useUserRole";

const Recommendations = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string>("");
  const [context, setContext] = useState<any>(null);
  const { isGlobalAdmin } = useUserRole();

  // Redirect if not global admin
  if (!isGlobalAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Apenas Global Admins têm acesso às recomendações de IA.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations");

      if (error) throw error;

      setRecommendations(data.recommendations);
      setContext(data.context);

      toast.success("Recomendações geradas com sucesso");
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recomendações IA</h1>
        <p className="text-muted-foreground">
          Análise inteligente e sugestões para otimização da gestão
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Motor de Recomendações IA</CardTitle>
                <CardDescription>
                  Análise automática baseada nos dados da instituição
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={generateRecommendations}
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  A analisar dados...
                </>
              ) : (
                <>
                  <Lightbulb className="h-5 w-5" />
                  Gerar Recomendações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {context && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contexto da Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Alunos
                  </div>
                  <div className="text-2xl font-bold">{context.students.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {context.students.active} ativos
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Funcionários
                  </div>
                  <div className="text-2xl font-bold">{context.staff.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    €{context.staff.totalSalaries.toFixed(2)} em salários
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Saldo Financeiro
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      context.finances.balance >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    €{context.finances.balance.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {context.finances.transactions} transações
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {recommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Recomendações Personalizadas
              </CardTitle>
              <CardDescription>
                Sugestões baseadas na análise dos seus dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription className="whitespace-pre-wrap text-sm leading-relaxed">
                  {recommendations}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {!recommendations && !loading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Lightbulb className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma recomendação gerada ainda
              </h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Clique no botão acima para gerar recomendações personalizadas baseadas nos
                dados da sua instituição
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
