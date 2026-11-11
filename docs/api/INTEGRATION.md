# Bàn giao API Supabase

Hợp đồng `openapi.yaml` phiên bản 0.2.0 mô tả 13 thao tác trên 6 đường dẫn. App gọi Supabase bằng SDK hoặc HTTP, dựa trên các trường và quyền trong hợp đồng. Expo không tự thực thi file YAML khi khởi động.

## Phạm vi bàn giao

Đã chốt email/mật khẩu, đọc và sửa hồ sơ, đọc/tạo/sửa mục tiêu, đọc/thêm nhật ký, đọc/tạo/sửa/xóa cấu hình lịch nhắc. Google được bổ sung ở giai đoạn sau. Lọc ngày, phân trang và thứ tự nhật ký sẽ chốt sau theo yêu cầu của nhóm. Bộ lọc UID/ID phục vụ sửa, xóa và kiểm tra quyền; `request_id` phục vụ đọc lại yêu cầu gửi lặp.

Hai quyết định tạm thời cần nhóm xác nhận khi tích hợp là dùng tài khoản được tạo sẵn trong Supabase Dashboard và đăng xuất phiên hiện tại với `scope=local`. Đăng ký và quên mật khẩu chưa được yêu cầu rõ nên chưa có trong hợp đồng bản này. SDK mặc định đăng xuất global, vì vậy phải truyền `supabase.auth.signOut({ scope: 'local' })` theo phương án hiện tại.

## Căn cứ và tình trạng xác minh

- SQL và mô tả nghiệp vụ từ `Seminar/note/baocao.md`, đặc biệt mục 2 và mục 7. Phụ lục có cấu trúc bảng và trigger. Lệnh `REVOKE` được ghi trong SQL, còn lệnh `GRANT` và `CREATE POLICY` chưa được cung cấp đầy đủ. Cần giữ kết quả kiểm tra quyền thật để tái lập môi trường.
- Người phụ trách đã thông báo mục 6.1 chạy tốt và đã thử qua Postman. Các response thành công/lỗi của toàn bộ thao tác chưa có trong tài liệu bàn giao.
- `Seminar/PostmanResult/refresh-token.json` chứa một đối tượng phiên, gồm token và user. File không kèm URL request, grant_type, HTTP status hoặc header. Vì vậy chỉ dùng làm căn cứ cho cấu trúc phiên. Trường `expires_at` để tùy chọn do có thể được SDK tính thêm.
- Các ví dụ trong YAML đều là dữ liệu giả. Các HTTP status của thao tác chưa có bằng chứng đầy đủ được mô tả theo tài liệu Supabase/PostgREST và cần thử lại trên project trước nghiệm thu. Chưa gọi API live trong lần biên soạn này.
- Bản này là hợp đồng cho toàn bộ phạm vi cơ bản đã chốt, trạng thái draft-for-integration. Chưa phải bằng chứng tất cả thao tác đã đạt kiểm thử tích hợp.

## Quy ước gọi API

Mọi request dùng `apikey` là publishable key. Request dữ liệu và đăng xuất dùng thêm `Authorization: Bearer <access_token>`. Request token dùng `apikey` cùng JSON email/mật khẩu hoặc refresh token tương ứng `grant_type`. Không dùng secret/service_role trong ứng dụng.

Các endpoint bảng trả mảng. Hồ sơ/mục tiêu chưa có hoặc bị RLS lọc có thể trả `[]`. A truy vấn hồ sơ B thường nhận 200 với `[]`. Thiếu quyền ghi theo bảng/cột có thể trả 403 với mã 42501. Tránh suy ra mọi trường hợp truy cập chéo đều trả 403.

App gửi bộ lọc `user_id=eq.<uid>` khi sửa hồ sơ/mục tiêu, `id=eq.<id>` khi sửa/xóa lịch. Bộ lọc là quy ước bắt buộc của app trong YAML; PostgREST không tự bắt buộc các query đó. Không tạo request sửa/xóa trước khi kiểm tra ID đã có giá trị hợp lệ. Chuỗi bộ lọc không được có khoảng trắng hoặc tab trước `eq.`.

Quy ước HTTP ghi dùng `Prefer: return=representation` và không thêm `select` vào request ghi trong bản này. Với SDK, nối `.select()` sau `.insert()`, `.update()` hoặc `.delete()` để lấy các dòng bị ảnh hưởng. POST trả 201 và mảng dòng mới. PATCH/DELETE trả 200 và mảng dòng đã xử lý. Nếu không có `Prefer`, server có thể trả body rỗng theo chế độ mặc định. PATCH/DELETE trả `[]` thì phải xử lý trường hợp không có dòng, không báo đã sửa/xóa một bản ghi.

App chỉ gửi các trường thuộc schema ghi. Bỏ `user_id`, `id`, `created_at`, `updated_at` trong JSON ghi. Database tự xác định chủ sở hữu bằng JWT, sinh ID và dấu thời gian. Ngoại lệ là `request_id` do app sinh cho hoạt động. Schema ghi chặn trường dư để hướng dẫn client; database thực thi quyền theo cột và ràng buộc.

Trong bản này GET thường lấy `select=*`. GET profiles vẫn hỗ trợ chuỗi ba cột `user_id,display_name,time_zone` đã thử. Khi đọc với ba cột, các trường hồ sơ còn lại không có trong response.

## Phiên và lỗi

Sau đăng nhập hoặc refresh, cập nhật cả access token và refresh token. Dùng cơ chế refresh của SDK, tránh nhiều yêu cầu refresh đồng thời. Token hết hạn thì làm mới phiên, refresh bị từ chối thì yêu cầu đăng nhập lại. Lỗi mạng cần có trạng thái thử lại, không được xem là mật khẩu sai chỉ từ HTTP status.

Sau đăng xuất, xóa phiên cục bộ, dữ liệu cache của tài khoản cũ và lịch thông báo trên thiết bị. JWT cũ có thể còn hiệu lực đến khi hết hạn. Kiểm tra refresh token bị từ chối và app không khôi phục phiên cũ khi mở lại. Phân biệt lỗi mạng đăng xuất với việc server đã thu hồi refresh token, vì SDK có thể đã xóa phiên cục bộ trước khi server trả kết quả.

Auth và Data API có cấu trúc lỗi khác nhau. Auth ưu tiên `error_code`; Data API ưu tiên `code`. Mã 23514 thường là CHECK, 23502 là NOT NULL, 23505 là trùng khóa, 42501 là quyền truy cập. Lỗi gateway hoặc máy chủ có thể trả nội dung khác JSON, cần kiểm tra Content-Type.

## Phối hợp thành viên

| Thành viên | Việc cần phối hợp |
|---|---|
| TV1 | Dùng trạng thái phiên để điều hướng. Tổng phút hiển thị chỉ dựa trên hoạt động đã lưu thành công. Mục tiêu chưa có là trạng thái cần thiết lập, không tự ghi mặc định ngoài ý định người dùng. |
| TV2 | Quản lý client Supabase, khôi phục/làm mới phiên, ánh xạ lỗi và các hàm truy cập dữ liệu. Lưu lại SQL quyền và policy thực tế. |
| TV3 | Sinh UUID `request_id` trước lần gửi đầu, giữ nguyên payload khi thử lại. Chỉ xử lý như yêu cầu lặp khi 23505 xuất phát từ `activities_user_request_uniq`. Đọc lại theo request_id dưới cùng tài khoản, so sánh số phút, cùng thời điểm và note; note bỏ trống quy về null. Cùng nội dung dùng lại bản ghi, khác nội dung báo xung đột ở app. |
| TV4 | Dùng ID lịch lưu trên server để liên kết lịch cục bộ. Chỉ cập nhật thông báo sau khi xác nhận dữ liệu ghi. Hoãn 5 phút không ghi nhật ký. Hủy lịch và bỏ qua thao tác thông báo cũ khi đổi tài khoản. |
| TV5 | Lưu request và response mẫu đã ẩn thông tin xác thực cho từng thao tác. Kiểm tra quyền A/B, dữ liệu sai, gửi lặp, cập nhật/xóa 0 dòng, refresh và đăng xuất. |
| TV6 | Ghi rõ phiên bản hợp đồng, phạm vi đã thử và bằng chứng. Các mô tả mong đợi cần tách khỏi kết quả thực tế. |

`occurred_at` gửi ISO 8601 có offset hoặc UTC. Xác định ngày theo `profiles.time_zone`, từ đầu ngày đến trước đầu ngày tiếp theo. `local_time` là giờ địa phương, ngày lặp 1 là thứ Hai và 7 là Chủ nhật. App phải kiểm tra múi giờ IANA vì cột text chưa có CHECK tương ứng.

Lọc ngày và phân trang đang hoãn. GET activities có giới hạn số dòng theo cấu hình Data API và chưa cam kết thứ tự. Trước khi nghiệm thu tổng phút hôm nay, phải có cách lấy đủ dữ liệu của ngày hoặc phép tổng hợp đáng tin cậy. Không lấy một response có thể bị cắt làm toàn bộ lịch sử để cộng.

## Kiểm thử còn cần lưu bằng chứng

| Luồng | Bằng chứng cần có |
|---|---|
| Auth | Đăng nhập đúng/sai, refresh thành công/thất bại, logout local và refresh phiên đã logout bị từ chối. |
| Profiles | Đọc đầy đủ/ba cột, sửa trường cho phép, chặn cột hệ thống, A đọc/sửa B không làm lộ hoặc đổi dữ liệu B. |
| Goals | Tạo lần đầu, trùng mục tiêu, đổi 30 thành 45, từ chối 0 và kiểm tra updated_at. |
| Activities | Lưu 12 phút, gửi lặp chỉ có một dòng, đọc lại request_id, thử cùng ID khác nội dung và phút ngoài khoảng. |
| Reminders | Tạo/sửa/tắt/xóa lịch, ngày rỗng/trùng/ngoài 1–7/null bị từ chối, chặn giờ 24:00:00 và kiểm tra tài khoản chéo. |
| Tích hợp app | Khôi phục phiên, đổi A sang B, mất mạng khi ghi, dọn cache/lịch sau logout, tổng phút với dữ liệu qua nửa đêm. |

## Tài liệu tham chiếu

- [Supabase Auth REST OpenAPI](https://github.com/supabase/auth/blob/master/openapi.yaml)
- [Phạm vi đăng xuất](https://supabase.com/docs/guides/auth/signout)
- [PostgREST trả dòng sau thao tác ghi](https://docs.postgrest.org/en/stable/references/api/preferences.html#return-representation)
- [Mã lỗi PostgREST](https://docs.postgrest.org/en/stable/references/errors.html)
