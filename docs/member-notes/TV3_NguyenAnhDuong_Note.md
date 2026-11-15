# Ghi chú TV3 – Nhập liệu và Nhật ký vận động

## 1. Phạm vi
- Form nhập vận động (React Hook Form + Zod)
- Danh sách nhật ký, sửa, xóa
- Chống ghi trùng bằng request_id
- Vị trí code: `src/features/activity-log/`, `src/utils/`

## 2. Thư viện đã cài
- react-hook-form, zod, @hookform/resolvers
- expo-crypto (sinh request_id)

## 3. Luồng dữ liệu
Form -> Zod kiểm tra -> activityRepo.create -> Supabase (bảng activities)
Lưu xong -> điều hướng về HomeTab kèm lastLoggedMinutes

## 4. Lỗi gặp và cách xử lý
| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| 42501 permission denied | Bảng activities thiếu GRANT/RLS | Nhờ TV2 cấp quyền |

## 5. Kiến thức áp dụng
- React Hook Form thay useState (giảm code)
- Zod làm nguồn xác thực, backend vẫn xác thực lại
- request_id chống ghi trùng khi thử lại sau lỗi mạng

## 6. Hình minh họa
(chèn ảnh chụp form, danh sách, lỗi)