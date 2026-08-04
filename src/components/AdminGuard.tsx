import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { areasPara, type AppRole } from "@/lib/permissions";

type Props = {
  children: ReactNode;
  /** Função obrigatória para aceder à rota. Sem valor, basta ter qualquer função. */
  requerFuncao?: AppRole;
};

export function AdminGuard({ children, requerFuncao }: Props) {
  const { session, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  const semSessao = !authLoading && !session;

  useEffect(() => {
    if (semSessao) navigate({ to: "/admin-login", replace: true });
  }, [semSessao, navigate]);

  if (authLoading || rolesLoading || !session) {
    return (
      <AdminShell>
        <div className="px-5 pt-16 text-sm text-muted-foreground">A verificar permissões…</div>
      </AdminShell>
    );
  }

  const temAcesso = requerFuncao ? roles.includes(requerFuncao) : areasPara(roles).length > 0;

  if (!temAcesso) {
    return (
      <AdminShell>
        <div className="px-5 pt-16 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {requerFuncao === "admin"
              ? "Apenas contas com função de gestor podem aceder a esta área."
              : "Esta área é reservada a contas com função de gestor, empresa ou suporte. Peça a um gestor para lhe atribuir uma função."}
          </p>
          <Button asChild className="mt-6 h-12 w-full rounded-2xl">
            <Link to="/admin-login">Entrar noutra conta</Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  return <>{children}</>;
}
