import { createFileRoute, Link } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, XAxis } from "recharts";
import { Ban, Check, CircleDollarSign, Headphones, Lock, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/useRoles";
import { areasPara, rotuloArea, rotuloFuncao } from "@/lib/permissions";
import {
  kwanza,
  pagamentosAdmin,
  parceiros,
  ticketsSuporte,
  utilizacaoSemanal,
  utilizadores,
} from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard do gestor — Kubuka" },
      {
        name: "description",
        content:
          "Painel de administração Kubuka: utilizadores, aprovação de parceiros, estatísticas, pagamentos, comissões e suporte.",
      },
      { property: "og:title", content: "Dashboard do gestor — Kubuka" },
      { property: "og:description", content: "Gestão global da plataforma de aluguer de viaturas em Angola." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { roles, loading } = useRoles();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const pendentes = parceiros.filter((p) => p.estado === "Pendente");
  const comissaoTotal = pagamentosAdmin.reduce((acc, p) => acc + p.comissao, 0);
  const volume = pagamentosAdmin.reduce((acc, p) => acc + p.valor, 0);
  const areas = areasPara(roles);
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!authLoading && !session) navigate({ to: "/admin-login", replace: true });
  }, [authLoading, session, navigate]);

  if (loading || !session) {
    return (
      <AdminShell>
        <div className="px-5 pt-16 text-sm text-muted-foreground">A verificar permissões…</div>
      </AdminShell>
    );
  }

  if (areas.length === 0) {
    return (
      <AdminShell>
        <div className="px-5 pt-16 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é reservada a contas com função de gestor, empresa ou suporte. Peça a um gestor
            para lhe atribuir uma função.
          </p>
          <Button asChild className="mt-6 h-12 w-full rounded-2xl">
            <Link to="/admin-login">Entrar noutra conta</Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <header className="px-5 pt-8">
        <p className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Administração
        </p>
        <h1 className="text-2xl">Dashboard do gestor</h1>
        <div className="mt-2 flex flex-wrap gap-1">
          {roles.map((r) => (
            <Badge key={r} variant="secondary">
              {rotuloFuncao[r]}
            </Badge>
          ))}
        </div>
        {isAdmin && (
          <Button asChild variant="secondary" className="mt-3 w-full rounded-xl">
            <Link to="/admin-funcoes">
              <ShieldCheck className="mr-1 h-4 w-4" /> Gerir funções e permissões
            </Link>
          </Button>
        )}
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 px-5">
        <Kpi rotulo="Utilizadores" valor={`${utilizadores.length}`} />
        <Kpi rotulo="Parceiros" valor={`${parceiros.length}`} />
        <Kpi rotulo="Pendentes" valor={`${pendentes.length}`} />
      </div>

      <Tabs defaultValue={areas[0]!} className="mt-5 px-5">
        <TabsList
          className="grid w-full rounded-2xl"
          style={{ gridTemplateColumns: `repeat(${areas.length}, minmax(0, 1fr))` }}
        >
          {areas.map((a) => (
            <TabsTrigger key={a} value={a} className="rounded-xl text-[11px]">
              {rotuloArea[a]}
            </TabsTrigger>
          ))}
        </TabsList>

        {areas.includes("estatisticas") && (
        <TabsContent value="estatisticas" className="mt-4 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm">Reservas por dia (semana actual)</h2>
            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilizacaoSemanal}>
                  <XAxis dataKey="dia" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} />
                  <Area
                    dataKey="reservas"
                    stroke="var(--color-chart-1)"
                    fill="var(--color-chart-1)"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <Kpi rotulo="Volume transaccionado" valor={kwanza(volume)} />
            <Kpi rotulo="Comissões" valor={kwanza(comissaoTotal)} />
            <Kpi rotulo="Taxa de conversão" valor="34%" />
            <Kpi rotulo="Avaliação média" valor="4.7" />
          </section>
        </TabsContent>
        )}

        {areas.includes("suporte") && (
        <TabsContent value="suporte" className="mt-4 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm">
              <Headphones className="h-4 w-4 text-accent" /> Suporte ao cliente
            </h2>
            <ul className="mt-3 space-y-3">
              {ticketsSuporte.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{t.assunto}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.id} · {t.utilizador} · prioridade {t.prioridade}
                    </p>
                  </div>
                  <Badge variant={t.estado === "Resolvido" ? "default" : "secondary"}>{t.estado}</Badge>
                </li>
              ))}
            </ul>
            <Button variant="secondary" className="mt-4 w-full rounded-xl" onClick={() => toast("Abrindo caixa de suporte")}>
              Abrir centro de suporte
            </Button>
          </section>
        </TabsContent>
        )}

        {areas.includes("parceiros") && (
        <TabsContent value="parceiros" className="mt-4 space-y-3">
          {parceiros.map((p) => (
            <article key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm">{p.nome}</h2>
                  <p className="text-xs text-muted-foreground">
                    NIF {p.nif} · {p.zona} · {p.frota} viaturas
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Plano {p.plano}</p>
                </div>
                <Badge variant={p.estado === "Aprovado" ? "default" : "secondary"}>{p.estado}</Badge>
              </div>
              {!isAdmin ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Apenas gestores podem aprovar ou suspender parceiros.
                </p>
              ) : p.estado === "Pendente" ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button className="rounded-xl" onClick={() => toast.success(`${p.nome} aprovado`)}>
                    <Check className="mr-1 h-4 w-4" /> Aprovar
                  </Button>
                  <Button variant="secondary" className="rounded-xl" onClick={() => toast(`${p.nome} rejeitado`)}>
                    <X className="mr-1 h-4 w-4" /> Rejeitar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="mt-3 w-full rounded-xl"
                  onClick={() =>
                    toast(p.estado === "Suspenso" ? `${p.nome} reactivado` : `${p.nome} suspenso`)
                  }
                >
                  <Ban className="mr-1 h-4 w-4" /> {p.estado === "Suspenso" ? "Reactivar" : "Suspender"}
                </Button>
              )}
            </article>
          ))}
        </TabsContent>
        )}

        {areas.includes("utilizadores") && (
        <TabsContent value="utilizadores" className="mt-4 space-y-3">
          {utilizadores.map((u) => (
            <article key={u.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 truncate text-sm">
                  <Users className="h-4 w-4 text-accent" /> {u.nome}
                </h2>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {u.tipo} · {u.reservas} reservas · {u.verificado ? "verificado" : "por verificar"}
                </p>
              </div>
              {isAdmin ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => toast(u.activo ? `${u.nome} bloqueado` : `${u.nome} reactivado`)}
                >
                  {u.activo ? "Bloquear" : "Reactivar"}
                </Button>
              ) : (
                <Badge variant="secondary">{u.activo ? "Activo" : "Bloqueado"}</Badge>
              )}
            </article>
          ))}
        </TabsContent>
        )}

        {areas.includes("pagamentos") && (
        <TabsContent value="pagamentos" className="mt-4 space-y-3">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm">
              <CircleDollarSign className="h-4 w-4 text-accent" /> Comissões acumuladas
            </h2>
            <p className="mt-1 font-display text-2xl text-accent">{kwanza(comissaoTotal)}</p>
            <p className="text-xs text-muted-foreground">12% sobre {kwanza(volume)} transaccionados</p>
          </section>

          {pagamentosAdmin.map((p) => (
            <article key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm">{p.id}</h3>
                  <p className="text-xs text-muted-foreground">
                    {p.origem} · {p.metodo}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Comissão {kwanza(p.comissao)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-accent">{kwanza(p.valor)}</p>
                  <Badge variant={p.estado === "Liquidado" ? "default" : "secondary"}>{p.estado}</Badge>
                </div>
              </div>
            </article>
          ))}
        </TabsContent>
        )}
      </Tabs>
    </AdminShell>
  );
}

function Kpi({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <p className="font-display text-lg text-accent">{valor}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
    </div>
  );
}