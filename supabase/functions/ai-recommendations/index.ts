import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado - Token de autenticação necessário" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Criar cliente Supabase com service role para verificar permissões
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Extrair o token JWT
    const token = authHeader.replace("Bearer ", "");
    
    // Verificar o usuário autenticado
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação inválido" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se o usuário tem role de global_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== "global_admin") {
      return new Response(
        JSON.stringify({ error: "Acesso negado - Apenas Global Admins podem gerar recomendações" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Usar o mesmo cliente admin para operações de banco de dados
    const supabase = supabaseAdmin;

    // Fetch all data from the database
    const [studentsRes, staffRes, transactionsRes] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("staff").select("*"),
      supabase.from("financial_transactions").select("*"),
    ]);

    const students = studentsRes.data || [];
    const staff = staffRes.data || [];
    const transactions = transactionsRes.data || [];

    // Calculate financial metrics
    const totalRevenue = transactions
      .filter((t: any) => t.type === "revenue")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const balance = totalRevenue - totalExpenses;

    const salaryExpenses = staff
      .filter((s: any) => s.status === "active" && s.salary)
      .reduce((sum: number, s: any) => sum + Number(s.salary), 0);

    // Prepare context for AI
    const contextData = {
      students: {
        total: students.length,
        active: students.filter((s: any) => s.status === "active").length,
        graduated: students.filter((s: any) => s.status === "graduated").length,
      },
      staff: {
        total: staff.length,
        active: staff.filter((s: any) => s.status === "active").length,
        totalSalaries: salaryExpenses,
      },
      finances: {
        totalRevenue,
        totalExpenses,
        balance,
        transactions: transactions.length,
      },
    };

    const systemPrompt = `Você é um assistente de análise financeira para instituições educacionais. Analise os dados fornecidos e forneça 3-5 recomendações práticas e acionáveis em português de Portugal.

Foque em:
- Otimização de custos
- Eficiência operacional
- Sustentabilidade financeira
- Gestão de recursos humanos
- Crescimento institucional

Seja específico, usando os números reais fornecidos. Cada recomendação deve ser concisa (1-2 frases) e prática.`;

    const userPrompt = `Dados da instituição:

ALUNOS:
- Total: ${contextData.students.total}
- Ativos: ${contextData.students.active}
- Graduados: ${contextData.students.graduated}

FUNCIONÁRIOS:
- Total: ${contextData.staff.total}
- Ativos: ${contextData.staff.active}
- Custo total de salários: €${contextData.staff.totalSalaries.toFixed(2)}

FINANÇAS:
- Receitas totais: €${contextData.finances.totalRevenue.toFixed(2)}
- Despesas totais: €${contextData.finances.totalExpenses.toFixed(2)}
- Saldo: €${contextData.finances.balance.toFixed(2)}
- Total de transações: ${contextData.finances.transactions}

Forneça recomendações práticas para melhorar a gestão desta instituição.`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const recommendations = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        recommendations,
        context: contextData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
