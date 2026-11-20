import { supabase } from "../../services/supabase";
import type { ActivityInput } from "./activitySchema";

export type Activity = {
  id: string;
  durationMinutes: number;
  occurredAt: string;
  note: string | null;
};

const toModel = (r: any): Activity => ({
  id: r.id,
  durationMinutes: r.duration_minutes,
  occurredAt: r.occurred_at,
  note: r.note,
});

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Bạn chưa đăng nhập");
  return id;
}

export const activityRepo = {
  async list(from: Date, to: Date): Promise<Activity[]> {
    const { data, error } = await supabase
      .from("activities")
      .select("id, duration_minutes, occurred_at, note")
      .gte("occurred_at", from.toISOString())
      .lt("occurred_at", to.toISOString())
      .order("occurred_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toModel);
  },

  // requestId giữ nguyên khi thử lại để không bị lưu trùng
  async create(input: ActivityInput, requestId: string): Promise<void> {
    const { error } = await supabase.from("activities").insert({
      request_id: requestId,
      duration_minutes: input.durationMinutes,
      occurred_at: input.occurredAt.toISOString(),
      note: input.note || null,
    });
    // 23505 = trùng request_id: lần trước đã lưu được rồi
    if (error && error.code !== "23505") throw error;
  },

  async update(id: string, input: ActivityInput): Promise<void> {
    const { error } = await supabase
      .from("activities")
      .update({
        duration_minutes: input.durationMinutes,
        occurred_at: input.occurredAt.toISOString(),
        note: input.note || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) throw error;
  },

  // Cho TV4: lần vận động gần nhất
  async lastOccurredAt(): Promise<Date | null> {
    const { data, error } = await supabase
      .from("activities")
      .select("occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0] ? new Date(data[0].occurred_at) : null;
  },
};