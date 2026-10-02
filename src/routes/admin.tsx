import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CarFront, Check, CircleDollarSign, FileCheck2, Headphones, ShieldCheck, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminDesktopShell } from "@/components/AdminDesktopShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/useRoles";
import { areasPara, rotuloArea, rotuloFuncao } from "@/lib/permissions";
import { loadAdminData, updatePartnerStatus, updateReservationStatus, updateUserActive } from "@/lib/admin-data";
import { supabase } from "@/integrations/supabase/client";

const kz = (value: number) => new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(value) + " Kz";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Dashboard do gestor — Teu Carro" }, { name: "description", content: "Painel de gestão operacional do marketplace." }] }),
  component: () => <AdminGuard><Admin /></AdminGuard>,
});

function Admin() {
  const { roles } = useRoles();
  const areas = areasPara(roles);
  const isAdmin = roles.includes("admin");
  const [tab, setTab] = useState(areas[0] ?? "estatisticas");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [data, setData] = useState<any>({ reservations: [], ads: [], profiles: [], payments: [], userStatus: [] });
  const [loading, setLoading] = useState(true);\n  const [loadError, setLoadError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const next = await loadAdminData();
    if (next.error) toast.error(next.error.message);
    setData(next);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    const channel = supabase.channel("admin-production-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservas" }, () => void reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "anuncios" }, () => void reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "perfis" }, () => void reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "pagamentos" }, () => void reload())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const reservations = data.reservations ?? [];
  const ads = data.ads ?? [];
  const profiles = data.profiles ?? [];
  const payments = data.payments ?? [];
  const userStatus = data.userStatus ?? [];
  const activeAds = ads.filter((a: any) => a.estado === "aprovado");
  const pendingAds = ads.filter((a: any) => a.estado === "pendente");
  const pendingProfiles = profiles.filter((p: any) => ["proprietario", "empresa"].includes(p.tipo_conta) && !p.verificado);
  const volume = reservations.reduce((sum: number, r: any) => sum + Number(r.total || 0), 0);
  const commission = reservations.reduce((sum: number, r: any) => sum + Number(r.comissao || 0), 0);
  const pendingPayments = payments.filter((p: any) => ["pendente", "processando"].includes(p.estado));
  const filteredReservations = useMemo(() => reservations.filter((r: any) => {
    const text = `${r.numero} ${r.titulo} ${r.item_ref}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (status === "Todos" || r.estado === status);
  }), [reservations, search, status]);

  async function approvePartner(id: string, name: string) {
    try { await updatePartnerStatus(id, "Aprovado"); toast.success(name + " aprovado."); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível aprovar."); }
  }

  async function toggleUser(id: string, active: boolean) {
    try { await updateUserActive(id, !active); toast.success(!active ? "Utilizador activado." : "Utilizador bloqueado."); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível actualizar."); }
  }

  async function changeReservation(id: string, next: string) {
    try { await updateReservationStatus(id, next); toast.success("Estado da reserva actualizado."); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível actualizar."); }
  }

  return <AdminDesktopShell><div className="px-4 py-6 lg:px-8 lg:py-7">
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent"><ShieldCheck className="h-3.5 w-3.5" /> Administração</p><h1 className="mt-1 font-display text-2xl lg:text-3xl">Dashboard</h1><p className="mt-1 text-xs text-muted-foreground">{loading ? "A sincronizar com o Supabase…" : "Dados operacionais provenientes do Supabase."}</p><div className="mt-2 flex gap-1">{roles.map((r) => <Badge key={r} variant="secondary">{rotuloFuncao[r]}</Badge>)}</div></div>
      {isAdmin && <Button asChild className="rounded-xl"><Link to="/admin-funcoes"><ShieldCheck className="mr-2 h-4 w-4" /> Funções e permissões</Link></Button>}
    </header>

    {loadError && <div role="alert" className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm"><p className="font-semibold">Alguns dados não foram carregados</p><p className="mt-1 break-words text-muted-foreground">{loadError}</p><Button variant="outline" size="sm" className="mt-3 rounded-lg" onClick={() => void reload()}>Tentar novamente</Button></div>}\n\n    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi title="Anúncios" value={String(ads.length)} detail={`${activeAds.length} publicados · ${pendingAds.length} pendentes`} icon={<CarFront className="h-5 w-5" />} />
      <Kpi title="Reservas" value={String(reservations.length)} detail={`${reservations.filter((r: any) => r.estado === "pendente").length} pendentes`} icon={<CircleDollarSign className="h-5 w-5" />} />
      <Kpi title="Utilizadores" value={String(profiles.length)} detail={`${profiles.filter((p: any) => p.verificado).length} verificados`} icon={<Users className="h-5 w-5" />} />
      <Kpi title="Volume" value={kz(volume)} detail={`Comissão ${kz(commission)}`} icon={<ArrowUpRight className="h-5 w-5" />} />
    </section>

    <div className="mt-5 grid gap-5 lg:grid-cols-3">
      <Panel title="Pendências" subtitle="Acções rápidas"><div className="space-y-2">
        <QuickAction href="/admin-anuncios" icon={<CarFront className="h-4 w-4" />} title="Aprovar anúncios" value={`${pendingAds.length} pendentes`} />
        <QuickAction href="/admin-documentos" icon={<FileCheck2 className="h-4 w-4" />} title="Verificar documentos" value="Abrir fila" />
        <QuickAction href="/admin-categorias" icon={<ShieldCheck className="h-4 w-4" />} title="Gerir categorias" value="Catálogo" />
      </div></Panel>
      <Panel title="Parceiros" subtitle="Contas de proprietários/empresas"><p className="font-display text-3xl text-accent">{pendingProfiles.length}</p><p className="mt-1 text-xs text-muted-foreground">contas aguardam verificação</p></Panel>
      <Panel title="Pagamentos" subtitle="Estado das transacções"><p className="font-display text-3xl text-accent">{pendingPayments.length}</p><p className="mt-1 text-xs text-muted-foreground">transacções pendentes</p></Panel>
    </div>

    <Tabs value={tab} onValueChange={setTab} className="mt-6">
      <TabsList className="grid w-full max-w-4xl rounded-xl" style={{ gridTemplateColumns: `repeat(${areas.length}, minmax(0, 1fr))` }}>{areas.map((a) => <TabsTrigger key={a} value={a} className="rounded-lg text-[11px]">{rotuloArea[a]}</TabsTrigger>)}</TabsList>

      {areas.includes("estatisticas") && <TabsContent value="estatisticas" className="mt-4"><div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Anúncios publicados"><div className="space-y-3">{activeAds.slice(0, 8).map((a: any) => <div key={a.id} className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 text-xs last:border-0"><div><p className="font-medium">{a.titulo}</p><p className="text-muted-foreground">{a.municipio} · {a.categoria}</p></div><Badge>{a.preco_dia != null ? kz(Number(a.preco_dia)) + " / dia" : "Preço do proprietário"}</Badge></div>)}{!activeAds.length && <Empty text="Ainda não existem anúncios aprovados." />}</div></Panel>
        <Panel title="Reservas recentes"><div className="space-y-3">{reservations.slice(0, 8).map((r: any) => <div key={r.id} className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 text-xs last:border-0"><div><p className="font-medium">{r.numero} · {r.titulo}</p><p className="text-muted-foreground">{new Date(r.inicio).toLocaleDateString("pt-PT")}</p></div><Badge variant={r.estado === "concluida" ? "default" : "secondary"}>{r.estado}</Badge></div>)}{!reservations.length && <Empty text="Ainda não existem reservas." />}</div></Panel>
      </div></TabsContent>}

      {areas.includes("reservas") && <TabsContent value="reservas" className="mt-4"><Panel title="Gestão de reservas"><div className="mb-4 grid gap-2 md:grid-cols-[1fr_180px]"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar reserva ou anúncio..." className="rounded-xl" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm"><option>Todos</option><option>pendente</option><option>confirmada</option><option>em_utilizacao</option><option>concluida</option><option>cancelada</option><option>rejeitada</option></select></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead className="text-muted-foreground"><tr><th className="pb-3">Nº</th><th>Anúncio</th><th>Período</th><th>Valor</th><th>Comissão</th><th>Estado</th><th></th></tr></thead><tbody>{filteredReservations.map((r: any) => <tr key={r.id} className="border-t border-border/70"><td className="py-3 font-semibold">{r.numero}</td><td>{r.titulo}</td><td>{new Date(r.inicio).toLocaleDateString("pt-PT")} → {new Date(r.fim).toLocaleDateString("pt-PT")}</td><td>{kz(Number(r.total))}</td><td>{kz(Number(r.comissao || 0))}</td><td><Badge>{r.estado}</Badge></td><td><select value={r.estado} onChange={(e) => changeReservation(r.id, e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1"><option value="pendente">Pendente</option><option value="confirmada">Confirmada</option><option value="em_utilizacao">Em utilização</option><option value="concluida">Concluída</option><option value="cancelada">Cancelada</option><option value="rejeitada">Rejeitada</option></select></td></tr>)}</tbody></table>{!filteredReservations.length && <Empty text="Nenhuma reserva encontrada." />}</div></Panel></TabsContent>}

      {areas.includes("parceiros") && <TabsContent value="parceiros" className="mt-4"><Panel title="Proprietários e empresas"><div className="grid gap-3 lg:grid-cols-2">{profiles.filter((p: any) => ["proprietario", "empresa"].includes(p.tipo_conta)).map((p: any) => <div key={p.id} className="rounded-xl border border-border/70 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{p.nome || "Sem nome"}</p><p className="text-xs text-muted-foreground">{p.tipo_conta} · {p.municipio || "Município não indicado"}</p></div><Badge variant={p.verificado ? "default" : "secondary"}>{p.verificado ? "Verificado" : "Pendente"}</Badge></div>{isAdmin && !p.verificado && <div className="mt-3 flex gap-2"><Button className="rounded-xl" size="sm" onClick={() => approvePartner(p.id, p.nome || "Parceiro")}><Check className="mr-1 h-4 w-4" /> Aprovar</Button><Button variant="secondary" size="sm" className="rounded-xl" onClick={() => toast("Para rejeitar, use a verificação documental.")}><X className="mr-1 h-4 w-4" /> Rever</Button></div>}</div>)}{!profiles.some((p: any) => ["proprietario", "empresa"].includes(p.tipo_conta)) && <Empty text="Ainda não existem proprietários ou empresas." />}</div></Panel></TabsContent>}

      {areas.includes("utilizadores") && <TabsContent value="utilizadores" className="mt-4"><Panel title="Utilizadores"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-muted-foreground"><tr><th className="pb-3">Nome</th><th>Tipo</th><th>Município</th><th>Verificação</th><th>Estado</th><th></th></tr></thead><tbody>{profiles.map((p: any) => { const state = userStatus.find((s: any) => s.user_id === p.id); const active = state?.active ?? true; return <tr key={p.id} className="border-t border-border/70"><td className="py-3 font-medium">{p.nome || "Sem nome"}</td><td>{p.tipo_conta}</td><td>{p.municipio || "—"}</td><td>{p.verificado ? "Verificado" : "Pendente"}</td><td><Badge variant={active ? "default" : "destructive"}>{active ? "Activo" : "Bloqueado"}</Badge></td><td><Button size="sm" variant="secondary" className="rounded-lg" onClick={() => toggleUser(p.id, active)}>{active ? "Bloquear" : "Reactivar"}</Button></td></tr>); })}</tbody></table>{!profiles.length && <Empty text="Ainda não existem perfis." />}</div></Panel></TabsContent>}

      {areas.includes("pagamentos") && <TabsContent value="pagamentos" className="mt-4"><Panel title="Pagamentos e transacções"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="text-muted-foreground"><tr><th className="pb-3">Data</th><th>Referência</th><th>Método</th><th>Valor</th><th>Comissão</th><th>Estado</th></tr></thead><tbody>{payments.map((p: any) => <tr key={p.id} className="border-t border-border/70"><td className="py-3">{new Date(p.created_at).toLocaleDateString("pt-PT")}</td><td>{p.referencia || p.id}</td><td>{p.metodo}</td><td>{kz(Number(p.valor))}</td><td>{kz(Number(p.comissao || 0))}</td><td><Badge variant={p.estado === "pago" ? "default" : p.estado === "falhado" ? "destructive" : "secondary"}>{p.estado}</Badge></td></tr>)}</tbody></table>{!payments.length && <Empty text="Ainda não existem transacções registadas." />}</div></Panel></TabsContent>}

      {areas.includes("suporte") && <TabsContent value="suporte" className="mt-4"><Panel title="Suporte"><p className="text-sm text-muted-foreground">Para reclamações e sugestões, o canal oficial é 948 848 048.</p><Button asChild className="mt-4 rounded-xl"><a href="tel:+244948848048"><Headphones className="mr-2 h-4 w-4" /> Ligar para 948 848 048</a></Button></Panel></TabsContent>}
    </Tabs>
  </div></AdminDesktopShell>;
}

function Kpi({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-border/80 bg-card p-4 lg:p-5"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">{title}</p><span className="text-accent">{icon}</span></div><p className="mt-3 font-display text-2xl">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div>;
}
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border/80 bg-card p-4 lg:p-5"><div className="mb-4"><h2 className="text-sm font-semibold">{title}</h2>{subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}</div>{children}</section>;
}
function QuickAction({ href, icon, title, value }: { href: "/admin-anuncios" | "/admin-documentos" | "/admin-categorias"; icon: React.ReactNode; title: string; value: string }) {
  return <Link to={href} className="flex items-center gap-3 rounded-xl border border-border/70 p-3 transition hover:border-accent/50 hover:bg-secondary/40"><span className="text-accent">{icon}</span><span className="min-w-0 flex-1"><span className="block text-xs font-medium">{title}</span><span className="block text-[11px] text-muted-foreground">{value}</span></span><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></Link>;
}
function Empty({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>; }
