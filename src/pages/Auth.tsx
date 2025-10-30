import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errorHandler";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

// Definir o email do admin como constante para fácil manutenção
const ADMIN_EMAIL = "admin@escola.pt";

const Auth = () => {
  const navigate = useNavigate();
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // A verificação de status ativo só ocorre no handleLogin
        // Aqui apenas redirecionamos se houver sessão
        navigate("/dashboard");
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (values: LoginFormData) => {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (loginError) {
      toast.error(getErrorMessage(loginError));
      return;
    }

    if (loginData.user) {
      // **** INÍCIO DA CORREÇÃO ****
      // Verificar se é o admin global antes de consultar a tabela staff
      if (loginData.user.email === ADMIN_EMAIL) {
        toast.success("Login de Admin bem-sucedido - A redirecionar...");
        // A navegação será tratada pelo onAuthStateChange no useEffect
        // setLoading(false); // Opcional, pois a navegação deve ocorrer
        return; // Login permitido para o admin sem verificar 'staff'
      }
      // **** FIM DA CORREÇÃO ****

      // Se não for o admin, verificar o status na tabela staff
      try {
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("status")
          .eq("user_id", loginData.user.id)
          .single();

        // Se houver erro a encontrar o staff OU se o staff não existir
        if (staffError || !staffData) {
          console.error("Erro ao buscar dados do staff ou registo não encontrado:", staffError);
          await supabase.auth.signOut();
          // Mensagem mais genérica caso o registo staff não exista
          toast.error("Não foi possível verificar o estado da sua conta. Contacte o administrador.");
          return;
        }

        // Se o staff existe mas não está ativo
        if (staffData.status !== 'active') {
          await supabase.auth.signOut();
          toast.error("A sua conta está inativa ou terminada. Contacte o administrador.");
          return;
        }

        // Se chegou aqui, é um staff ativo
        toast.success("Login bem-sucedido - A redirecionar para o dashboard...");
        // A navegação será tratada pelo onAuthStateChange no useEffect

      } catch (fetchError) {
        console.error("Erro inesperado ao verificar status:", fetchError);
        await supabase.auth.signOut();
        toast.error("Ocorreu um erro ao verificar a sua conta.");
        return;
      }
    } else {
      toast.error("Ocorreu um erro inesperado durante o login.");
    }
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palavra-passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showLoginPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pr-10"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0"
                          onClick={toggleLoginPasswordVisibility}
                          aria-label={showLoginPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                          disabled={form.formState.isSubmitting}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full gap-2" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    A entrar...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;