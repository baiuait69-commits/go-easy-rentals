import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/AdminGuard";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { kz, rotuloCategoria, rotuloEstado, type Estado } from "@/lib/marketplace";

export const Route = createFileRoute("/admin-anuncios")({
  head: () => ({
    meta: [
      { title: "Aprovação de anúncios — Teu Carro" },
      { name: "description", content: "Aprove, rejeite ou bloqueie anúncios do marketplace." },
      { property: "og:title", content: "Aprovação de anúncios — Teu Carro" },
      { property: "og:description", content: "Moderação de anúncios do marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <AdminAnuncios />
    </AdminGuard>
  ),
});

function AdminAnuncios() {
  const queryClient = useQueryClient();

  const anunciosQuery = useQuery({
    queryKey: ["admin-anuncios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mudarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: Estado }) => {
      const { error } = await supabase.from("anuncios").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado do anúncio actualizado.");
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const anuncios = anunciosQuery.data ?? [];
  const pendentes = anuncios.filter((a) => a.estado === "pendente");

  return (
    <AdminShell>
      <div className="space-y-4 px-5 py-6">
        <div>
          <h1 className="text-2xl">Anúncios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendentes.length} à espera de aprovação · {anuncios.length} no total
          </p>
        </div>

        <ul className="space-y-3">
          {anuncios.map((a) => (
            <li key={a.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base">{a.titulo}</h2>
                  <p className="text-xs text-muted-foreground">
                    {rotuloCategoria(a.categoria)} · {a.municipio} · {kz(a.preco_dia)}/dia
                  </p>
                </div>
                <Badge variant={a.estado === "aprovado" ? "default" : "secondary"}>
                  {rotuloEstado[a.estado]}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 rounded-xl"
                  disabled={a.estado === "aprovado" || mudarEstado.isPending}
                  onClick={() => mudarEstado.mutate({ id: a.id, estado: "aprovado" })}
                >
                  <Check className="mr-1 h-4 w-4" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 rounded-xl"
                  disabled={a.estado === "rejeitado" || mudarEstado.isPending}
                  onClick={() => mudarEstado.mutate({ id: a.id, estado: "rejeitado" })}
                >
                  <X className="mr-1 h-4 w-4" /> Rejeitar
                </Button>
              </div>
            </li>
          ))}
          {!anunciosQuery.isLoading && anuncios.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Ainda não existem anúncios.
            </li>
          )}
        </ul>
      </div>
    </AdminShell>
  );
}
