import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Heart, CalendarDays, User, Headphones, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const tabs: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/reservas", label: "As minhas reservas", icon: CalendarDays },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-[440px] min-h-screen bg-background relative shadow-[0_0_60px_-25px_rgba(212,175,55,0.35)]">
        <div className="pb-44">{children}</div>

        <a
          href="tel:+244948848048"
          className="fixed bottom-[68px] z-30 flex h-12 w-full max-w-[440px] items-center justify-center gap-2 border-t border-primary/20 bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg"
          aria-label="Ligar para o Suporte Técnico"
        >
          <Headphones className="h-4 w-4" />
          Suporte Técnico · 948 848 048
        </a>

        <nav className="fixed bottom-0 z-30 w-full max-w-[440px] border-t border-primary/25 bg-card/95 backdrop-blur">
          <ul className="grid grid-cols-4">
            {tabs.map((tab) => {
              const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
              return (
                <li key={tab.to}>
                  <Link
                    to={tab.to}
                    className={`flex flex-col items-center gap-1 px-1 py-3 text-center text-[10px] font-semibold tracking-wide transition-colors ${
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
