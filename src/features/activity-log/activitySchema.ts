import { z } from "zod";

// TODO: chuyển sang shared/ khi TV2 có bản chuẩn
export const activitySchema = z.object({
  durationMinutes: z
    .number({ message: "Nhập số phút" })
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu 1 phút")
    .max(600, "Tối đa 600 phút"),
  occurredAt: z
    .date()
    .refine(
      (d) => d.getTime() <= Date.now() + 60_000,
      "Không được chọn thời điểm ở tương lai"
    ),
  note: z.string().trim().max(200, "Tối đa 200 ký tự").optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;