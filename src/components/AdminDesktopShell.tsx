import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, CarFront, FileCheck2, LayoutDashboard, LogOut, Menu, ShieldCheck, Tags, Users, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin-anuncios", label: "Anúncios", icon: CarFront },
  { to: "/admin-documentos", label: "Documentos", icon: FileCheck2 },
  { to: "/admin-categorias", label: "Categorias", icon: Tags },
  { to: "/admin-funcoes", label: "Utilizadores & Funções", icon: Users },
] as const;

export function AdminDesktopShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { roles } = useRoles();
  const isAdmin = roles.includes("admin");
  const [open, setOpen] = useState(false);
  const visibleLinks = isAdmin ? links : links.slice(0, 1);
  async function sair() { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); navigate({ to: "/admin-login", replace: true }); }
  const menu = <nav className="space-y-1">{visibleLinks.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${pathname === to ? "bg-accent text-accent-foreground shadow-lg shadow-accent/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>;
  return <div className="min-h-screen bg-[#071019] text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
    <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-[#09131d] lg:flex lg:flex-col"><div className="flex h-20 items-center gap-3 border-b border-border/80 px-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-display text-sm">KUBUKA</p><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Painel de gestão</p></div></div><div className="flex-1 p-3"><p className="px-3 pb-2 pt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operação</p>{menu}<div className="mt-5 rounded-xl border border-border/80 bg-background/30 p-3"><div className="flex items-center gap-2 text-xs font-semibold"><BarChart3 className="h-4 w-4 text-accent" /> Visão global</div><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Reservas, frota, anúncios, documentos e receitas num só lugar.</p></div></div><div className="border-t border-border/80 p-3"><Button variant="ghost" className="w-full justify-start rounded-xl text-muted-foreground" onClick={sair}><LogOut className="mr-2 h-4 w-4" /> Sair</Button></div></aside>
    <main className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-[#09131d]/95 px-4 backdrop-blur lg:px-7"><div className="flex items-center gap-3"><Button size="icon" variant="ghost" className="rounded-xl lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button><div><p className="text-sm font-semibold">Painel administrativo</p><p className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">Marketplace · Aluguer de viaturas</p></div></div><div className="flex items-center gap-2"><span className="hidden rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground sm:inline-flex">Administrador</span><div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"><ShieldCheck className="h-4 w-4" /></div></div></header><div className="pb-10">{children}</div></main>
  </div>{open && <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-[82%] max-w-sm border-r border-border bg-[#09131d] p-4" onClick={(e) => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ShieldCheck className="h-4 w-4" /></div><span className="font-display">KUBUKA</span></div><Button size="icon" variant="ghost" className="rounded-xl" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button></div>{menu}<Button variant="ghost" className="mt-6 w-full justify-start rounded-xl text-muted-foreground" onClick={sair}><LogOut className="mr-2 h-4 w-4" /> Sair</Button></aside></div>}</div>;
}
