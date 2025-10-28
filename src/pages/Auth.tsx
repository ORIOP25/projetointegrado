import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removidos imports de Tabs
import { toast } from "sonner";
// Importar apenas os ícones necessários
import { GraduationCap, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // Estado para visibilidade da palavra-passe (login)
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  // Estados de signup removidos

  useEffect(() => {
    // Verifica se já existe uma sessão ativa ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Se houver sessão, redireciona para o dashboard
        navigate("/dashboard");
      }
    });
    // Adiciona listener para mudanças no estado de autenticação (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Limpa o listener quando o componente é desmontado
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast.error(`Erro ao entrar - ${error.message || "Verifique as suas credenciais."}`);
    } else {
      toast.success("Login bem-sucedido - A redirecionar para o dashboard...");
    }

    setLoading(false);
  };

  // Função handleSignup removida

  // Função para alternar visibilidade da palavra-passe (login)
  const toggleLoginPasswordVisibility = () => {
    setShowLoginPassword(!showLoginPassword);
  };

  // Função toggleSignupPasswordVisibility removida

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Card principal */}
      <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
        {/* Cabeçalho do Card */}
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Gestão Escolar</CardTitle>
          <CardDescription>Insira as suas credenciais para aceder</CardDescription>
        </CardHeader>
        {/* Conteúdo do Card - Apenas o formulário de Login */}
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email" // Ajuda o browser a preencher
              />
            </div>
            {/* Campo Palavra-passe */}
            <div className="space-y-2">
              <Label htmlFor="login-password">Palavra-passe</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  // Tipo dinâmico para mostrar/esconder
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password" // Ajuda o browser a preencher
                  className="pr-10" // Padding para o ícone
                />
                {/* Botão para alternar visibilidade */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0"
                  onClick={toggleLoginPasswordVisibility}
                  aria-label={showLoginPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {/* Botão de Submissão */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A entrar..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;