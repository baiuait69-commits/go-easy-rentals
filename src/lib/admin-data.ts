import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export async function loadAdminData() {
  
  const [reservations, partners, userStatus] = await Promise.all([
    db.from("admin_reservations").select("*").order("created_at", { ascending: false }),
    db.from("admin_partners").select("*").order("updated_at", { ascending: false }),
    db.from("admin_user_status").select("*"),
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
  const { error } = await db.from("admin_reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return true;
}

export async function updatePartnerStatus(id: string, status: string) {
  if (!supabase) return false;
  const { error } = await db.from("admin_partners").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return true;
}

export async function updateUserActive(userId: string, active: boolean) {
  if (!supabase) return false;
  const { error } = await db.from("admin_user_status").upsert(
    { user_id: userId, active, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return true;
}
