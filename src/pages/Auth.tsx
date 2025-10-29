import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errorHandler";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react"; // Adicionado Loader2

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Nota: Não verificamos o status do staff aqui, apenas se há uma sessão.
      // A verificação do status é feita *durante* a tentativa de login.
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (loginError) {
      toast.error(getErrorMessage(loginError));
      setLoading(false);
      return; // Interrompe a função se o login falhar
    }

    // Se o login foi bem-sucedido (sem erro), verificar o status do staff
    if (loginData.user) {
      try {
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("status")
          .eq("user_id", loginData.user.id)
          .single(); // Usar single() pois deve haver apenas um registo staff por user_id

        if (staffError) {
           // Se não encontrar o staff ou houver outro erro, faz logout e informa
          console.error("Erro ao buscar dados do staff:", staffError);
          await supabase.auth.signOut(); // Faz logout da sessão criada
          toast.error("Erro ao verificar o estado da sua conta. Contacte o administrador.");
          setLoading(false);
          return;
        }

        if (staffData && staffData.status !== 'active') {
          // Se o staff for encontrado mas não estiver ativo, faz logout e informa
          await supabase.auth.signOut(); // Faz logout da sessão criada
          toast.error("A sua conta está inativa ou terminada. Contacte o administrador.");
          setLoading(false);
          return;
        }

        // Se o staff está ativo, o login é permitido
        toast.success("Login bem-sucedido - A redirecionar para o dashboard...");
        // A navegação será tratada pelo onAuthStateChange no useEffect

      } catch (fetchError) {
         // Erro genérico na busca do staff
        console.error("Erro inesperado ao verificar status:", fetchError);
        await supabase.auth.signOut(); // Garante logout em caso de erro inesperado
        toast.error("Ocorreu um erro ao verificar a sua conta.");
        setLoading(false);
        return;
      }
    } else {
      // Caso improvável onde não há erro mas não há user (melhor tratar)
      toast.error("Ocorreu um erro inesperado durante o login.");
    }


    // setLoading(false) é definido dentro dos blocos de erro ou após a verificação bem-sucedida (implicitamente, pois a navegação ocorre)
     // No caso de sucesso, a navegação tira o utilizador desta página,
     // então definir setLoading(false) explicitamente aqui pode não ser necessário,
     // mas adicionamos nos caminhos de erro para garantir que o botão é reativado.
     // Se a navegação não ocorrer imediatamente, pode ser útil descomentar a linha abaixo.
     // setLoading(false);
  };


  const toggleLoginPasswordVisibility = () => {
    setShowLoginPassword(!showLoginPassword);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Gestão Escolar</CardTitle>
          <CardDescription>Insira as suas credenciais para aceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading} // Desativar campos durante o loading
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Palavra-passe</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                  disabled={loading} // Desativar campos durante o loading
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0"
                  onClick={toggleLoginPasswordVisibility}
                  aria-label={showLoginPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                  disabled={loading} // Desativar botão durante o loading
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                   A entrar...
                </>
               ) : (
                 "Entrar"
               )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;