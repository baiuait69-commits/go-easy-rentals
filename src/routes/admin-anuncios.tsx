import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { kz, rotuloCategoria, rotuloEstado, type Estado } from "@/lib/marketplace";

export const Route = createFileRoute("/admin-anuncios")({
  head: () => ({ meta: [{ title: "Aprovação de anúncios — Teu Carro" }, { name: "description", content: "Aprove, rejeite ou bloqueie anúncios do marketplace." }] }),
  component: () => <AdminGuard requerFuncao="admin"><AdminAnuncios /></AdminGuard>,
});

function AdminAnuncios() {
  const queryClient = useQueryClient();
  const anunciosQuery = useQuery({ queryKey: ["admin-anuncios"], queryFn: async () => { const { data, error } = await supabase.from("anuncios").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const mudarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: Estado }) => { const { error } = await supabase.from("anuncios").update({ estado }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Estado do anúncio actualizado."); queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const anuncios = anunciosQuery.data ?? [];
  const pendentes = anuncios.filter((a) => a.estado === "pendente");
  return <AdminShell><div className="space-y-4 px-5 py-6"><div><h1 className="text-2xl">Aprovação de anúncios</h1><p className="mt-1 text-sm text-muted-foreground">{pendentes.length} à espera de aprovação · {anuncios.length} no total</p></div><ul className="space-y-3">{anuncios.map((a) => <li key={a.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3">{a.imagem ? <img src={a.imagem} alt="" className="h-16 w-20 rounded-xl object-cover" /> : <div className="h-16 w-20 rounded-xl bg-muted" />}<div className="min-w-0 flex-1"><h2 className="truncate text-base">{a.titulo}</h2><p className="text-xs text-muted-foreground">{rotuloCategoria(a.categoria)} · {a.municipio} · {kz(a.preco_dia)}/dia</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.descricao || "Sem descrição."}</p></div><Badge variant={a.estado === "aprovado" ? "default" : a.estado === "bloqueado" ? "destructive" : "secondary"}>{rotuloEstado[a.estado]}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2"><Button size="sm" variant="outline" className="rounded-xl" disabled={!a.imagem}><a href={a.imagem ?? "#"} target="_blank" rel="noreferrer"><Eye className="mr-1 inline h-4 w-4" /> Ver</a></Button><Button size="sm" className="rounded-xl" disabled={a.estado === "aprovado" || mudarEstado.isPending} onClick={() => mudarEstado.mutate({ id: a.id, estado: "aprovado" })}><Check className="mr-1 h-4 w-4" /> Aprovar</Button><Button size="sm" variant="secondary" className="rounded-xl" disabled={a.estado === "rejeitado" || mudarEstado.isPending} onClick={() => mudarEstado.mutate({ id: a.id, estado: a.estado === "aprovado" ? "bloqueado" : "rejeitado" })}><X className="mr-1 h-4 w-4" /> {a.estado === "aprovado" ? "Bloquear" : "Rejeitar"}</Button></div></li>)}{!anunciosQuery.isLoading && anuncios.length === 0 && <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Ainda não existem anúncios.</li>}</ul></div></AdminShell>;
}
