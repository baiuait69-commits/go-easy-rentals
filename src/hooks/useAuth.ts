import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// Shared auth store: one listener + one getSession for the whole app,
// avoiding parallel token refreshes that revoke each other.
type State = { session: Session | null; loading: boolean };
let state: State = { session: null, loading: true };
const listeners = new Set<() => void>();
let started = false;

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabase.auth.onAuthStateChange((_e, s) => {
    if (s?.access_token === state.session?.access_token && !state.loading) return;
    set({ session: s, loading: false });
  });
  supabase.auth.getSession().then(({ data }) => set({ session: data.session, loading: false }));
}

const serverState: State = { session: null, loading: true };

export function useAuth() {
  const s = useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => serverState,
  );
  return { session: s.session, user: (s.session?.user ?? null) as User | null, loading: s.loading };
}
