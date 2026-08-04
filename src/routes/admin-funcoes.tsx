import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, History, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/AdminGuard";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRoles } from "@/hooks/useRoles";
import { definirFuncao, listarAuditoriaFuncoes, listarUtilizadoresComFuncoes } from "@/lib/roles.functions";
import { permissoes, rotuloArea, rotuloFuncao, type AppRole } from "@/lib/permissions";

const FUNCOES: AppRole[] = ["admin", "empresa", "suporte"];

export const Route = createFileRoute("/admin-funcoes")({
  head: () => ({
    meta: [
      { title: "Funções e permissões — Kubuka" },
      {
        name: "description",
        content:
          "Atribua funções de gestor, empresa e suporte aos utilizadores da Kubuka e veja as áreas do painel a que cada função dá acesso.",
      },
      { property: "og:title", content: "Funções e permissões — Kubuka" },
      { property: "og:description", content: "Gestão de acessos por área no painel do gestor Kubuka." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FuncoesPage,
});

function FuncoesPage() {
  return (
    <AdminGuard requerFuncao="admin">
      <Funcoes />
    </AdminGuard>
  );
}

function Funcoes() {
  const { roles } = useRoles();
  const isAdmin = roles.includes("admin");
  const queryClient = useQueryClient();
  const listar = useServerFn(listarUtilizadoresComFuncoes);
  const definir = useServerFn(definirFuncao);
  const listarAuditoria = useServerFn(listarAuditoriaFuncoes);

  const utilizadoresQuery = useQuery({
    queryKey: ["admin", "utilizadores-funcoes"],
    queryFn: () => listar(),
    enabled: isAdmin,
  });

  const auditoriaQuery = useQuery({
    queryKey: ["admin", "auditoria-funcoes"],
    queryFn: () => listarAuditoria(),
    enabled: isAdmin,
  });

  const mutacao = useMutation({
    mutationFn: (vars: { userId: string; role: AppRole; activo: boolean }) => definir({ data: vars }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "utilizadores-funcoes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "auditoria-funcoes"] });
      toast.success(vars.activo ? `Função ${rotuloFuncao[vars.role]} atribuída` : `Função ${rotuloFuncao[vars.role]} removida`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell>
      <header className="px-5 pt-8">
        <Link to="/admin" className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Painel do gestor
        </Link>
        <h1 className="mt-2 text-2xl">Funções e permissões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada função dá acesso a áreas específicas do painel. Atribua-as aos utilizadores registados.
        </p>
      </header>

      <section className="mt-5 space-y-2 px-5">
        {FUNCOES.map((f) => (
          <article key={f} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-accent" /> {rotuloFuncao[f]}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1">
              {permissoes[f].map((a) => (
                <Badge key={a} variant="secondary">
                  {rotuloArea[a]}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 space-y-3 px-5">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Utilizadores</h2>

        {utilizadoresQuery.isLoading && <p className="text-sm text-muted-foreground">A carregar utilizadores…</p>}
        {utilizadoresQuery.isError && (
          <p className="text-sm text-destructive">
            Não foi possível carregar os utilizadores: {(utilizadoresQuery.error as Error).message}
          </p>
        )}

        {(utilizadoresQuery.data ?? []).map((u) => (
          <article key={u.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm">{u.email}</p>
                <p className="text-xs text-muted-foreground">
                  {u.confirmado ? "Email confirmado" : "Por confirmar"} ·{" "}
                  {new Date(u.criadoEm).toLocaleDateString("pt-PT")}
                </p>
              </div>
              <Badge variant={u.funcoes.length ? "default" : "secondary"}>
                {u.funcoes.length ? u.funcoes.map((f) => rotuloFuncao[f]).join(", ") : "Cliente"}
              </Badge>
            </div>

            <div className="mt-3 space-y-2">
              {FUNCOES.map((f) => (
                <label key={f} className="flex items-center justify-between gap-3 text-sm">
                  <span>{rotuloFuncao[f]}</span>
                  <Switch
                    checked={u.funcoes.includes(f)}
                    disabled={mutacao.isPending}
                    onCheckedChange={(v) => mutacao.mutate({ userId: u.id, role: f, activo: v })}
                  />
                </label>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 space-y-3 px-5 pb-4">
        <h2 className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
          <History className="h-4 w-4" /> Registo de alterações
        </h2>

        {auditoriaQuery.isLoading && <p className="text-sm text-muted-foreground">A carregar registo…</p>}
        {auditoriaQuery.isError && (
          <p className="text-sm text-destructive">
            Não foi possível carregar o registo: {(auditoriaQuery.error as Error).message}
          </p>
        )}
        {auditoriaQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há alterações registadas.</p>
        )}

        {(auditoriaQuery.data ?? []).map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-sm">
                <span className="truncate">{r.actor_email ?? "Gestor"}</span>{" "}
                {r.action === "atribuida" ? "atribuiu" : "removeu"}{" "}
                <strong>{rotuloFuncao[r.role as AppRole]}</strong>{" "}
                {r.action === "atribuida" ? "a" : "de"} {r.target_email ?? "utilizador"}
              </p>
              <Badge variant={r.action === "atribuida" ? "default" : "secondary"}>
                {r.action === "atribuida" ? "Atribuída" : "Removida"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleString("pt-PT")}
            </p>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
