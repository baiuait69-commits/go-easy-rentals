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

export const listarAuditoriaFuncoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("role_audit_log")
      .select("id, actor_email, target_email, role, action, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
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

    const { data: alvo } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const { data: actor } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    await supabaseAdmin.from("role_audit_log").insert({
      actor_id: context.userId,
      actor_email: actor?.user?.email ?? null,
      target_user_id: data.userId,
      target_email: alvo?.user?.email ?? null,
      role: data.role,
      action: data.activo ? "atribuida" : "removida",
    });

    return { ok: true };
  });

const EMAIL_GESTOR_INICIAL = "nichoolson668@gmail.com";

/** Cria a conta de gestor inicial. Só permitido para o email de arranque e só se ainda não existir. */
export const criarContaGestorInicial = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        password: z.string().min(6).max(72),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (data.email !== EMAIL_GESTOR_INICIAL) {
      throw new Error("Este email não está autorizado a criar a conta de gestor inicial.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lista, error: erroLista } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (erroLista) throw new Error(erroLista.message);
    if (lista.users.some((u) => (u.email ?? "").toLowerCase() === data.email)) {
      throw new Error("Esta conta de gestor já existe. Use o formulário de entrada.");
    }

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    const { error: erroFuncao } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: criado.user.id, role: "admin" }, { onConflict: "user_id,role" });
    if (erroFuncao) throw new Error(erroFuncao.message);

    await supabaseAdmin.from("role_audit_log").insert({
      actor_id: criado.user.id,
      actor_email: data.email,
      target_user_id: criado.user.id,
      target_email: data.email,
      role: "admin",
      action: "atribuida",
    });

    return { ok: true };
  });

/** Um gestor cria uma nova conta de painel já com funções atribuídas. */
export const criarContaComFuncoes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        password: z.string().min(6).max(72),
        funcoes: z.array(funcaoSchema).min(1),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    const { error: erroFuncoes } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        data.funcoes.map((role) => ({ user_id: criado.user.id, role })),
        { onConflict: "user_id,role" },
      );
    if (erroFuncoes) throw new Error(erroFuncoes.message);

    const { data: actor } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    await supabaseAdmin.from("role_audit_log").insert(
      data.funcoes.map((role) => ({
        actor_id: context.userId,
        actor_email: actor?.user?.email ?? null,
        target_user_id: criado.user.id,
        target_email: data.email,
        role,
        action: "atribuida",
      })),
    );

    return { ok: true };
  });
