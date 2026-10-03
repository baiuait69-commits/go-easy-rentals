import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ResultadoDiagnostico {
  causa: string;
  passos: string[];
  accoes: ("atribuir_admin" | "atribuir_suporte" | "atribuir_empresa" | "confirmar_email")[];
  contexto: Record<string, unknown>;
}

async function exigirAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Sem permissão de gestor");
}

export const diagnosticarAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().trim().email().max(255), descricao: z.string().trim().min(5).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<ResultadoDiagnostico & { id?: string }> => {
    await exigirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: lista } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const u = lista?.users.find((x) => x.email?.toLowerCase() === email);

    const [funcoes, auditoria, tentativas] = await Promise.all([
      u ? supabaseAdmin.from("user_roles").select("role, created_at").eq("user_id", u.id) : Promise.resolve({ data: [] }),
      u
        ? supabaseAdmin.from("role_audit_log").select("role, action, actor_email, created_at").eq("target_user_id", u.id).order("created_at", { ascending: false }).limit(20)
        : Promise.resolve({ data: [] }),
      supabaseAdmin.from("auth_tentativas").select("origem, sucesso, erro, created_at").eq("email", email).order("created_at", { ascending: false }).limit(30),
    ]);

    const contexto = {
      conta: u
        ? {
            existe: true,
            criada: u.created_at,
            email_confirmado: Boolean(u.email_confirmed_at),
            ultima_entrada: u.last_sign_in_at ?? null,
            bloqueada_ate: (u as { banned_until?: string }).banned_until ?? null,
          }
        : { existe: false },
      funcoes: funcoes.data ?? [],
      historico_funcoes: auditoria.data ?? [],
      tentativas_login: tentativas.data ?? [],
    };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Serviço de IA não configurado");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "És um especialista de suporte de uma app de aluguer de viaturas (Angola). Analisa os dados de autenticação e o problema descrito. O painel de gestão exige a função 'admin' (ou 'empresa'/'suporte' para áreas limitadas). Responde em português de Portugal/Angola, de forma clara para pessoas não técnicas.",
          },
          { role: "user", content: `Problema: ${data.descricao}\n\nDados:\n${JSON.stringify(contexto, null, 2)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "diagnostico",
              parameters: {
                type: "object",
                properties: {
                  causa: { type: "string" },
                  passos: { type: "array", items: { type: "string" } },
                  accoes: {
                    type: "array",
                    items: { type: "string", enum: ["atribuir_admin", "atribuir_suporte", "atribuir_empresa", "confirmar_email"] },
                  },
                },
                required: ["causa", "passos", "accoes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "diagnostico" } },
      }),
    });

    if (resp.status === 429) throw new Error("Demasiados pedidos à IA. Tente daqui a pouco.");
    if (resp.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos ao espaço de trabalho.");
    if (!resp.ok) throw new Error(`Erro do serviço de IA (${resp.status})`);
    const json = await resp.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { causa: "Sem resposta da IA", passos: [], accoes: [] };
    if (!u) parsed.accoes = [];

    const resultado: ResultadoDiagnostico = { ...parsed, contexto };
    const { data: guardado } = await context.supabase
      .from("diagnosticos_acesso")
      .insert({ autor_id: context.userId, email_alvo: email, descricao: data.descricao, resultado: resultado as never })
      .select("id")
      .single();
    return { ...resultado, id: guardado?.id };
  });

export const accaoRapida = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email(), accao: z.enum(["atribuir_admin", "atribuir_suporte", "atribuir_empresa", "confirmar_email"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await exigirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lista } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const u = lista?.users.find((x) => x.email?.toLowerCase() === data.email.toLowerCase());
    if (!u) throw new Error("Conta não encontrada");
    if (data.accao === "confirmar_email") {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(u.id, { email_confirm: true });
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const role = data.accao.replace("atribuir_", "") as "admin" | "suporte" | "empresa";
    const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: u.id, role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    const { data: actor } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    await supabaseAdmin.from("role_audit_log").insert({
      actor_id: context.userId, actor_email: actor.user?.email ?? null, target_user_id: u.id, target_email: u.email ?? null, role, action: "atribuida",
    });
    return { ok: true };
  });
