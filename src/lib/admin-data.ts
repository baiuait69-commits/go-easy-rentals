import { supabase } from "@/lib/supabase";

export async function loadAdminData() {
  if (!supabase) return { reservations: [], partners: [], userStatus: [], error: null };
  const [reservations, partners, userStatus] = await Promise.all([
    supabase.from("admin_reservations").select("*").order("created_at", { ascending: false }),
    supabase.from("admin_partners").select("*").order("updated_at", { ascending: false }),
    supabase.from("admin_user_status").select("*"),
  ]);
  const error = reservations.error || partners.error || userStatus.error;
  return {
    reservations: reservations.data ?? [],
    partners: partners.data ?? [],
    userStatus: userStatus.data ?? [],
    error,
  };
}

export async function updateReservationStatus(id: string, status: string) {
  if (!supabase) return false;
  const { error } = await supabase.from("admin_reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return true;
}

export async function updatePartnerStatus(id: string, status: string) {
  if (!supabase) return false;
  const { error } = await supabase.from("admin_partners").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return true;
}

export async function updateUserActive(userId: string, active: boolean) {
  if (!supabase) return false;
  const { error } = await supabase.from("admin_user_status").upsert(
    { user_id: userId, active, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return true;
}
