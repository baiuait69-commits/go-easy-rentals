import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

type QueryResult = { data: any[] | null; error: { message: string } | null };

export async function loadAdminData() {
  const [reservations, ads, profiles, payments, userStatus] = await Promise.all([
    db.from("reservas").select("*").order("created_at", { ascending: false }) as Promise<QueryResult>,
    db.from("anuncios").select("*").order("created_at", { ascending: false }) as Promise<QueryResult>,
    db.from("perfis").select("*").order("created_at", { ascending: false }) as Promise<QueryResult>,
    db.from("pagamentos").select("*").order("created_at", { ascending: false }) as Promise<QueryResult>,
    db.from("admin_user_status").select("*") as Promise<QueryResult>,
  ]);
  const failures = [
    ["reservas", reservations.error],
    ["anúncios", ads.error],
    ["perfis", profiles.error],
    ["pagamentos", payments.error],
    ["estado dos utilizadores", userStatus.error],
  ].filter(([, error]) => error) as [string, { message: string }][];
  return {
    reservations: reservations.data ?? [],
    ads: ads.data ?? [],
    profiles: profiles.data ?? [],
    payments: payments.data ?? [],
    userStatus: userStatus.data ?? [],
    errors: failures,
    error: failures.length ? { message: failures.map(([table, error]) => `${table}: ${error.message}`).join(" · ") } : null,
  };
}

export async function updateReservationStatus(id: string, status: string) {
  const { data, error } = await db.from("reservas").update({ estado: status }).eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Reserva não encontrada ou sem permissão para alterar.");
  return true;
}

export async function updatePartnerStatus(id: string, status: string) {
  const { data, error } = await db.from("perfis").update({ verificado: status === "Aprovado" }).eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Perfil não encontrado ou sem permissão para alterar.");
  return true;
}

export async function updateUserActive(userId: string, active: boolean) {
  const { error } = await db.from("admin_user_status").upsert(
    { user_id: userId, active, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return true;
}
