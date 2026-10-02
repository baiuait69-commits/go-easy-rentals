import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/permissions";

export function useRoles() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) {
          setRoles([]);
          setError(error.message);
        } else {
          setRoles((data ?? []).map((r) => r.role as AppRole));
          setError(null);
        }
        setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [user, authLoading]);

  return { roles, loading: loading || authLoading, error };
}
