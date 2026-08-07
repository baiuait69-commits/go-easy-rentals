import { Link, useRouterState } from "@tanstack/react-router";
import { Car, CalendarClock, Building2, User, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const tabs: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Viaturas", icon: Car },
  { to: "/reservas", label: "Reservas", icon: CalendarClock },
  { to: "/empresa", label: "Empresa", icon: Building2 },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visiveis = tabs;

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background relative shadow-[0_0_60px_-25px_rgba(30,64,140,0.45)]">
        <div className="pb-28">{children}</div>

        <nav className="fixed bottom-0 z-30 w-full max-w-[440px] border-t border-border bg-card/95 backdrop-blur">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${visiveis.length}, minmax(0, 1fr))` }}>
            {visiveis.map((tab) => {
              const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
              return (
                <li key={tab.to}>
                  <Link
                    to={tab.to}
                    className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}