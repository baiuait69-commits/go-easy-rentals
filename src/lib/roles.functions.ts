import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const funcaoSchema = z.enum(["admin", "empresa", "suporte"]);

async function garantirAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sem permissão de gestor");
}

export const listarUtilizadoresComFuncoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lista, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);

    const { data: funcoes, error: erroFuncoes } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (erroFuncoes) throw new Error(erroFuncoes.message);

    return lista.users.map((u) => ({
      id: u.id,
      email: u.email ?? "(sem email)",
      criadoEm: u.created_at,
      confirmado: Boolean(u.email_confirmed_at),
      funcoes: (funcoes ?? []).filter((f) => f.user_id === u.id).map((f) => f.role as z.infer<typeof funcaoSchema>),
    }));
  });

export const definirFuncao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: funcaoSchema, activo: z.boolean() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.userId === context.userId && data.role === "admin" && !data.activo) {
      throw new Error("Não pode remover a sua própria função de gestor");
    }

    if (data.activo) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
