import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function garantirAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sem permissão de gestor");
}

export const listarDocumentosPendentes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirAdmin(context.supabase, context.userId);
    const { data, error } = await (context.supabase as any).from("documentos_verificacao").select("id, user_id, tipo, numero, ficheiro_url, estado, motivo_rejeicao, created_at, reviewed_at, perfis(nome, telefone)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const reverDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), estado: z.enum(["aprovado", "rejeitado"]), motivo: z.string().trim().max(500).optional() }).parse(data))
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    if (data.estado === "rejeitado" && !data.motivo) throw new Error("Indique o motivo da rejeição");
    const { error } = await (context.supabase as any).from("documentos_verificacao").update({ estado: data.estado, motivo_rejeicao: data.estado === "rejeitado" ? data.motivo : null, reviewed_at: new Date().toISOString(), reviewed_by: context.userId }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listarCategoriasAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirAdmin(context.supabase, context.userId);
    const { data, error } = await (context.supabase as any).from("categorias_marketplace").select("*").order("ordem").order("nome");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const atualizarCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), nome: z.string().trim().min(2).max(80), descricao: z.string().trim().max(240).optional(), ativo: z.boolean(), ordem: z.number().int().min(0).max(999) }).parse(data))
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any).from("categorias_marketplace").update({ nome: data.nome, descricao: data.descricao || null, ativo: data.ativo, ordem: data.ordem }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
