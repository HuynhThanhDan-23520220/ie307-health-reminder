import { supabase } from '../../../services/supabase';

/** Khớp schema ReminderSchedule trong docs/api/openapi.yaml (bảng reminder_schedules). */
export type ReminderSchedule = {
  id: string;
  user_id: string;
  local_time: string; // 'HH:mm:ss'
  days_of_week: number[]; // 1 = Thứ Hai ... 7 = Chủ nhật
  enabled: boolean;
};

export type CreateReminderInput = {
  local_time: string;
  days_of_week: number[];
  enabled?: boolean;
};

export type UpdateReminderInput = Partial<CreateReminderInput>;

/** Lấy toàn bộ lịch của tài khoản đang đăng nhập (RLS tự lọc theo JWT). */
export async function listReminders(): Promise<ReminderSchedule[]> {
  const { data, error } = await supabase
    .from('reminder_schedules')
    .select('*')
    .order('local_time', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReminderSchedule[];
}

/** Không gửi user_id/id/created_at: database tự điền theo auth.uid(). */
export async function createReminder(input: CreateReminderInput): Promise<ReminderSchedule> {
  const { data, error } = await supabase.from('reminder_schedules').insert(input).select();
  if (error) throw error;
  if (!data || data.length !== 1) throw new Error('Không nhận được lịch vừa tạo.');
  return data[0] as ReminderSchedule;
}

export async function updateReminder(id: string, input: UpdateReminderInput): Promise<ReminderSchedule> {
  const { data, error } = await supabase.from('reminder_schedules').update(input).eq('id', id).select();
  if (error) throw error;
  // RLS lọc mất dòng → trả [] thay vì lỗi. Không được báo "đã sửa".
  if (!data || data.length === 0) throw new Error('Không tìm thấy lịch nhắc hoặc bạn không có quyền sửa.');
  return data[0] as ReminderSchedule;
}

export async function deleteReminder(id: string): Promise<void> {
  const { data, error } = await supabase.from('reminder_schedules').delete().eq('id', id).select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Không tìm thấy lịch nhắc hoặc bạn không có quyền xóa.');
}
