import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { role, loading: roleLoading, isGlobalAdmin } = useUserRole();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (!session) {
        toast({
          title: "Acesso negado",
          description: "Você precisa fazer login para acessar esta página.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };

    checkAuth();
  }, [navigate, toast]);

  useEffect(() => {
    if (isAuthenticated && !roleLoading && requireAdmin && !isGlobalAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, roleLoading, requireAdmin, isGlobalAdmin, navigate, toast]);

  if (isAuthenticated === null || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && !isGlobalAdmin)) {
    return null;
  }

  return <>{children}</>;
};
