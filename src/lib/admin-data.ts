import { supabase } from "@/lib/supabase";

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
  const { error } = await supabase.from("admin_user_status").upsert({ user_id: userId, active, updated_at: new Date().toISOString() });
  if (error) throw error;
  return true;
}
