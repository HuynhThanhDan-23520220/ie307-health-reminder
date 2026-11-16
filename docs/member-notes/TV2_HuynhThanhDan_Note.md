# NHẬT KÝ CÔNG VIỆC & BÁO CÁO CÁ NHÂN - TV2

> Cập nhật ngày 16/11/2026. Tóm tắt từ [báo cáo backend](../../../note/baocao.md), bổ sung tình trạng Auth và quên mật khẩu hiện tại. Kết quả Cloud/Postman ghi theo xác nhận người thực hiện; các ca chưa có bằng chứng riêng không được coi là đã nghiệm thu trên app tích hợp.

## 1. Thông tin chung

- **Họ và tên:** Huỳnh Thanh Dân
- **Mã số sinh viên:** 23520220
- **Vai trò phụ trách (TV1 - TV6):** TV2 — xác thực, backend, database và quyền truy cập dữ liệu theo tài khoản.
- **Các thư mục/file phụ trách:** `src/features/auth/`, `src/services/supabase.ts`, `src/env.d.ts`, `docs/api/`; phối hợp cấu hình `.env`, tích hợp `App.tsx` và các bài kiểm thử Auth trong `tests/`.
- **Nền tảng backend:** Supabase Auth, PostgreSQL và Supabase Data API. App gọi SDK dùng chung; Supabase quản lý tài khoản và phiên, database thực thi ràng buộc và quyền sở hữu.
- **Phạm vi bàn giao:** Đăng ký, đăng nhập, khôi phục/làm mới phiên, đăng xuất; thiết kế bốn bảng nghiệp vụ; hợp đồng API và hướng dẫn tích hợp cho TV1/TV3/TV4.

## 2. Ánh xạ Kiến thức Môn học (Slide / Bài giảng áp dụng)

| Chức năng / Kỹ thuật đã cài đặt | Áp dụng từ Slide / Bài giảng nào? | Giải thích ngắn gọn cách áp dụng trong code |
| :--- | :--- | :--- |
| Component, state và lifecycle | Bài 02 — React Native Fundamentals | Form dùng state lưu nhập liệu; Provider đăng ký sự kiện, khôi phục phiên và cleanup khi tháo component. |
| Form trên thiết bị di động | Bài 03 — Core Components, Layout, Styling and Responsive UI; bài 06, mục 6.4 | Dùng `TextInput`, che mật khẩu, khóa nút khi gửi; tận dụng `ScreenContainer` có safe area, cuộn và xử lý bàn phím. |
| Trạng thái dùng chung và lớp truy cập API | Bài 05 — State Management and Networking | `AuthProvider` giữ trạng thái dùng chung; `useAuth()` đọc Context; service và client Supabase tách khỏi giao diện Auth. |
| Validation và lỗi form | Bài 06, mục 6.2–6.4 | Kiểm tra dữ liệu bắt buộc, định dạng email đăng ký/khôi phục và hai mật khẩu khớp nhau; ánh xạ lỗi tiếng Việt. Form hiện dùng `useState`, chưa dùng React Hook Form/Zod. |
| Vòng đời xác thực và phiên | Bài 06, mục 6.5–6.7 | Khôi phục phiên, nhận sự kiện Auth, giao SDK quản lý token/refresh; chặn thao tác đồng thời và kết quả khôi phục cũ. |
| Phân biệt xác thực và phân quyền | Bài 06, mục 6.1 và 6.6 | Supabase Auth xác thực tài khoản; database dùng GRANT và RLS theo UID để giới hạn thao tác và dữ liệu từng người. |
| Callback khôi phục mật khẩu | Bài 04 — Navigation; bài 06 về PKCE và deep link | Dùng PKCE, kiểm tra callback URL và đổi code lấy phiên. Chỉ mở form đặt mật khẩu sau sự kiện `PASSWORD_RECOVERY`. Hiện mới cấu hình và thử thành công trên Web. |
| Kiểm thử lỗi và trạng thái phiên | Bài 06, mục 6.12 | Có test mock cho thao tác đồng thời, khôi phục trả muộn, logout lỗi mạng và recovery; tách kết quả này khỏi kiểm thử Cloud/thiết bị thật. |

## 3. Các Thư viện & Cấu hình đã thực hiện

### 3.1. Thư viện sử dụng

- `@supabase/supabase-js`: tạo client, gọi Auth và truy vấn Data API; SDK quản lý token và sự kiện phiên.
- `@react-native-async-storage/async-storage`: lưu phiên trên mobile theo cấu hình hiện tại. **Chưa chuyển sang SecureStore.**
- `react-native-url-polyfill/auto`: bổ sung API URL cho React Native.
- React Context và hooks: chia sẻ session/user, trạng thái thao tác và lỗi; `useRef` chặn thao tác lặp ngay lập tức.
- React Native `AppState`: bật auto refresh khi app hoạt động, dừng khi về nền trên mobile.
- `expo-linking`: sinh và tiếp nhận callback khôi phục mật khẩu.
- Jest và `@testing-library/react-native`: kiểm thử logic Provider và thao tác trên form.

### 3.2. Cấu hình client và Auth

- `.env` cung cấp `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Không đưa service_role key, mật khẩu tài khoản hoặc credential SMTP vào app.
- Client bật `persistSession`, `autoRefreshToken`, `flowType: 'pkce'`; giữ `detectSessionInUrl: false` để app xử lý callback thủ công.
- `auth.service.ts` đóng gói đăng ký/đăng nhập/đăng xuất và recovery; `AuthOperationError` chuẩn hóa lỗi để UI xử lý.
- `AuthProvider` dùng `getSession()` và `onAuthStateChange`; `runOperation()` chặn thao tác Auth đồng thời. `busy` trên form khóa giao diện trong lúc xử lý.
- Logout dùng `scope: 'local'`. Phiên local có thể đã bị xóa dù request thu hồi server gặp lỗi mạng; access token đã phát có thể còn hiệu lực đến khi hết hạn.
- Biến `EXPO_PUBLIC_SESSION_MAX_AGE_MS` trong mẫu env chưa được Auth sử dụng; chưa có cơ chế bắt đăng nhập lại sau 15 phút theo biến này.

### 3.3. Database, ràng buộc và quyền

| Bảng | Vai trò / ràng buộc chính | Quyền app theo thiết kế |
| :--- | :--- | :--- |
| `profiles` | Một hồ sơ mỗi UID; tên, avatar, ngày sinh, múi giờ và dấu thời gian | Đọc hồ sơ của mình; sửa `display_name`, `avatar_url`, `birth_date`, `time_zone`. Hồ sơ do trigger tạo. |
| `goals` | Một mục tiêu hiện tại mỗi UID; số phút từ 1–1440 | Đọc, tạo và sửa mục tiêu của mình; chưa cấp DELETE. |
| `activities` | Nhật ký có số phút 1–1440, thời điểm, ghi chú; UNIQUE `(user_id, request_id)` | Đọc/thêm/sửa/xóa hoạt động của mình. UPDATE chỉ nhận `duration_minutes`, `occurred_at`, `note`. |
| `reminder_schedules` | Giờ địa phương nhỏ hơn 24:00; 1–7 ngày hợp lệ, không rỗng/trùng/null; trạng thái bật/tắt | Đọc/thêm/sửa/xóa lịch của mình; chỉ ghi các trường cấu hình lịch. |

- Bốn bảng liên kết tới `auth.users.id`; khóa ngoại dùng `ON DELETE CASCADE`. UID của ba bảng nghiệp vụ lấy mặc định `auth.uid()`.
- Bật RLS, thu hẹp quyền `anon`; cấp quyền bảng/cột cho `authenticated`. Policy kiểm tra `user_id = (select auth.uid())`.
- Trigger `create_profile_after_signup` sinh hồ sơ khi tạo tài khoản. Hàm dùng `SECURITY DEFINER`, `search_path = ''` và tên bảng đầy đủ.
- Các trigger `BEFORE UPDATE` tự đặt `updated_at` trên bốn bảng. Không tạo trigger DELETE riêng cho thao tác xóa hoạt động.
- Có chỉ mục hoạt động theo `(user_id, occurred_at)` và lịch theo `user_id`.
- OpenAPI **0.3.0** mô tả **16 thao tác trên 7 đường dẫn**, gồm đăng ký và sửa/xóa hoạt động. Các endpoint recovery mới chưa được bổ sung vào bản hợp đồng này.
- Báo cáo đã lưu SQL cấu trúc/trigger và phần quyền UPDATE/DELETE hoạt động; chưa có đầy đủ lệnh GRANT/CREATE POLICY để dựng lại cả bốn bảng từ đầu.

### 3.4. Lưu ý bắt buộc: quên mật khẩu hiện chỉ dùng được trên Web

> **Người thực hiện hiện chỉ thêm Redirect URL cho Web/localhost trên Supabase Cloud. Luồng quên mật khẩu đã được thử thành công trên Web. App build Android/iOS hiện chưa dùng được tính năng này với cấu hình Cloud đang có.**

- Đã có code gửi email, nhận callback và đặt mật khẩu mới; có code tiếp nhận link trên mobile nhưng chưa đủ cấu hình để coi app build đã hỗ trợ.
- Trước khi dùng trên app build, cần thêm `breakflow://auth/reset-password` vào Redirect URLs của Supabase, đối chiếu scheme trong bản cài, rồi thử mở email quay lại app trên thiết bị thật.
- Với PKCE, mở link trong cùng app/thiết bị hoặc browser profile đã gửi yêu cầu. Link hết hạn/đã dùng hoặc mất code verifier thì yêu cầu email mới.
- Sau khi đổi code thành công trên Web, app dọn query/fragment bằng `history.replaceState` mà không reload; Android/iOS bỏ qua bước này.
- Form recovery chưa khôi phục trạng thái riêng sau khi reload/đóng app ở giữa luồng; nên hoàn tất trong lần mở link đó.
- Hướng dẫn cấu hình đầy đủ nằm trong [QuenMatKhau.md](../../../note/QuenMatKhau.md).

## 4. Luồng dữ liệu của Module phụ trách

### 4.1. Đăng ký, đăng nhập và đăng xuất

```text
AuthTestScreen → useAuth() → AuthProvider → auth.service.ts
→ client Supabase → Supabase Auth
→ sự kiện Auth → Provider cập nhật Context → giao diện render lại
```

- **Khởi động:** Provider đăng ký sự kiện và lấy phiên đã lưu. Kết quả khôi phục cũ không được ghi đè một sự kiện Auth mới.
- **Đăng ký:** form kiểm tra mật khẩu nhập lại; service kiểm tra email rồi gọi Auth. Trigger tạo `profiles` theo UID. Khi chưa có session, form hướng dẫn xác nhận email.
- **Đăng nhập:** service trim email, giữ nguyên mật khẩu, gọi `signInWithPassword()`. Provider nhận phiên qua sự kiện SDK.
- **Đọc hồ sơ thử:** `ProfileTest` gọi client để lấy `user_id,display_name,time_zone,created_at`, lọc theo UID. Server tiếp tục kiểm tra GRANT/RLS.
- **Làm mới phiên:** SDK dùng refresh token; Provider nhận session mới qua sự kiện. App mobile phối hợp auto refresh với `AppState`.
- **Đăng xuất/đổi tài khoản:** SDK kết thúc phiên local; Context cập nhật. Form được tạo lại theo UID để bỏ nhập liệu/kết quả cũ. Dọn cache nghiệp vụ và lịch thông báo toàn app còn cần phối hợp TV3/TV4.

### 4.2. Quên mật khẩu trên Web

```text
Quên mật khẩu → nhập email → resetPasswordForEmail(email, redirectTo)
→ mở link trong email → exchangeCodeForSession(code)
→ PASSWORD_RECOVERY → nhập mật khẩu mới và xác nhận
→ updateUser({ password }) → thông báo thành công
→ Quay lại đăng nhập → signOut(local)
```

Gửi email chưa làm thay đổi mật khẩu. Mật khẩu được Supabase Auth quản lý, không lưu vào bảng hồ sơ.

### 4.3. Dữ liệu nghiệp vụ và phối hợp thành viên

- App dùng chung client/phiên. Khi tạo dữ liệu, bỏ `user_id`, `id`, `created_at`, `updated_at` khỏi JSON; database tự gán theo cấu hình. Riêng `request_id` hoạt động do app sinh.
- **TV3:** giữ nguyên `request_id` và payload khi thử lại. Khi trùng ràng buộc `activities_user_request_uniq`, đọc lại và so sánh nội dung trước khi dùng lại bản ghi hoặc báo xung đột.
- Khi sửa/xóa, kiểm tra ID trước khi gửi; HTTP dùng `Prefer: return=representation`, SDK nối `.select()`. Kết quả `[]` không có nghĩa đã sửa/xóa thành công một dòng.
- **TV1/TV3:** tổng phút chỉ tính hoạt động lưu thành công; sau sửa/xóa cần tải lại nhật ký và tổng phút của ngày liên quan. Tính ngày theo `profiles.time_zone`, khoảng từ đầu ngày đến trước đầu ngày kế tiếp.
- **TV4:** cấu hình lịch lưu trên server; thông báo do thiết bị quản lý. Chỉ đồng bộ thông báo sau kết quả ghi; hoãn 5 phút không tạo nhật ký hoặc tăng tổng phút.
- Lọc ngày, phân trang và việc lấy đủ dữ liệu để cộng tổng còn cần chốt khi tích hợp; không coi một response có thể bị giới hạn dòng là toàn bộ lịch sử.

### 4.4. Tình trạng kiểm thử và bàn giao

| Hạng mục | Trạng thái ghi nhận |
| :--- | :--- |
| Cấu hình database và Postman | Theo `baocao.md`, người thực hiện xác nhận kiểm tra mục 6.1 tốt; ngày 15/11 xác nhận POST activities bỏ `user_id` lưu được và quyền/policy UPDATE/DELETE hoạt động đúng. Chưa có raw request/response riêng cho từng ca của đợt này. |
| Quên mật khẩu trên localhost | Người thực hiện đã xác nhận gửi email, mở link và đổi mật khẩu thành công trên Web. |
| Kiểm tra mã gần nhất | TypeScript đạt; 4 bộ với 16 bài kiểm thử tự động đạt. Auth/SDK được mock nên không chứng minh cấu hình Cloud hoặc mobile thật. |
| Quên mật khẩu trên app build | **Chưa dùng được với cấu hình hiện tại: Supabase mới được thêm URL Web.** Chưa nghiệm thu callback Android/iOS. |
| Bản ghép toàn nhóm | Cần kiểm tra luồng Auth → lịch nhắc → ghi/sửa/xóa hoạt động → tổng phút, cùng logout/đổi tài khoản và thông báo cũ. |

Bằng chứng cần bổ sung: method/path, payload, HTTP status, response đã che token, dữ liệu trước/sau, ảnh và bước tái hiện. Ưu tiên truy cập chéo A/B, dữ liệu sai, gửi lặp, refresh, logout lỗi mạng và hành vi trên thiết bị thật.

## 5. Nhật ký Lỗi gặp phải & Cách khắc phục

| STT | Mô tả lỗi gặp phải | Nguyên nhân | Cách khắc phục | Hình ảnh minh họa (Trước / Sau) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | POST activities bị lỗi khi TV3 gửi `user_id` | Quyền INSERT theo cột không cho app ghi chủ sở hữu trực tiếp | Bỏ `user_id`; database gán `auth.uid()`. Người thực hiện xác nhận Postman đã lưu thành công. | Chưa đính kèm. |
| 2 | Lỗi bộ lọc Data API `PGRST100` đã ghi nhận trong tài liệu quy trình | Có tab/khoảng trắng trước `eq.` | Sửa thành `user_id=eq.<uid>` hoặc bộ lọc ID tương ứng, không có ký tự thừa. | Chưa đính kèm. |
| 3 | Truy vấn trả `[]` dễ bị hiểu là lỗi hoặc thao tác thành công | Chưa có dữ liệu, ID không tồn tại hoặc dòng bị RLS lọc | Kiểm tra số dòng trả về; không báo đã sửa/xóa khi không có dòng. Đây là quy tắc xử lý cần giữ khi tích hợp. | Chưa đính kèm. |
| 4 | URL Web vẫn giữ `auth/reset-password?code=...` sau recovery | Đổi giao diện theo Context không tự thay địa chỉ trình duyệt | Đã bổ sung dọn query/fragment sau khi đổi code lấy phiên thành công; không reload và chỉ chạy trên Web. Chưa ghi nhận kiểm thử thủ công lại sau thay đổi. | Chưa đính kèm. |
| 5 | App build hiện chưa dùng được quên mật khẩu | Supabase Cloud mới thêm Redirect URL Web; callback mobile chưa được cấu hình và nghiệm thu | Cần thêm callback `breakflow://auth/reset-password`, đối chiếu bản cài và thử lại trên điện thoại. **Chưa đánh dấu đã khắc phục.** | Chưa đính kèm. |

**Nguồn bàn giao:** [baocao.md](../../../note/baocao.md) · [QuyTrinh.md](../../../note/QuyTrinh.md) · [QuenMatKhau.md](../../../note/QuenMatKhau.md) · [OpenAPI](../api/openapi.yaml) · [INTEGRATION.md](../api/INTEGRATION.md).
