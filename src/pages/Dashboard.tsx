import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isGlobalAdmin } = useUserRole();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, staffRes, transactionsRes] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("staff").select("*", { count: "exact", head: true }),
        supabase.from("financial_transactions").select("type, amount"),
      ]);

      const transactions = transactionsRes.data || [];
      const totalRevenue = transactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalStaff: staffRes.count || 0,
        totalRevenue,
        totalExpenses,
        balance: totalRevenue - totalExpenses,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const baseStatCards = [
    {
      title: "Total de Alunos",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total de Funcionários",
      value: stats?.totalStaff || 0,
      icon: Briefcase,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const financialStatCards = [
    {
      title: "Receitas",
      value: `€${stats?.totalRevenue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Despesas",
      value: `€${stats?.totalExpenses.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Saldo",
      value: `€${stats?.balance.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: (stats?.balance || 0) >= 0 ? "text-success" : "text-destructive",
      bgColor: (stats?.balance || 0) >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
  ];

  const statCards = isGlobalAdmin ? [...baseStatCards, ...financialStatCards] : baseStatCards;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de gestão escolar</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-[var(--shadow-card)] transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
