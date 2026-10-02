import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export async function loadAdminData() {
  const [reservations, ads, profiles, payments, userStatus] = await Promise.all([
    db.from("reservas").select("*").order("created_at", { ascending: false }),
    db.from("anuncios").select("*").order("created_at", { ascending: false }),
    db.from("perfis").select("*").order("created_at", { ascending: false }),
    db.from("pagamentos").select("*").order("created_at", { ascending: false }),
    db.from("admin_user_status").select("*"),
  ]);
  const error = reservations.error || ads.error || profiles.error || payments.error || userStatus.error;
  return {
    reservations: reservations.data ?? [],
    ads: ads.data ?? [],
    profiles: profiles.data ?? [],
    payments: payments.data ?? [],
    userStatus: userStatus.data ?? [],
    error,
  };
}

export async function updateReservationStatus(id: string, status: string) {
  const { error } = await db.from("reservas").update({ estado: status }).eq("id", id);
  if (error) throw error;
  return true;
}

export async function updatePartnerStatus(id: string, status: string) {
  const { error } = await db.from("perfis").update({ verificado: status === "Aprovado" }).eq("id", id);
  if (error) throw error;
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
