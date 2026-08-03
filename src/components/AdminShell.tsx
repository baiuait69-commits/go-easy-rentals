import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { roles } = useRoles();
  const isAdmin = roles.includes("admin");

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin-login", replace: true });
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background relative shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" /> Kubuka Gestão
          </p>
          <Button size="sm" variant="ghost" className="rounded-xl" onClick={sair}>
            <LogOut className="mr-1 h-4 w-4" /> Sair
          </Button>
        </header>

        <div className="pb-24">{children}</div>

        <nav className="fixed bottom-0 z-30 w-full max-w-[440px] border-t border-border bg-card/95 backdrop-blur">
          <ul className={`grid ${isAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
            <li>
              <Link
                to="/admin"
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold uppercase tracking-wide ${
                  pathname === "/admin" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <LayoutDashboard className="h-5 w-5" /> Painel
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link
                  to="/admin-funcoes"
                  className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold uppercase tracking-wide ${
                    pathname === "/admin-funcoes" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" /> Funções
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}