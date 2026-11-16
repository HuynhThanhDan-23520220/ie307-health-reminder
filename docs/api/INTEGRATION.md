# Bàn giao API Supabase

Hợp đồng `openapi.yaml` phiên bản 0.3.0 mô tả 16 thao tác trên 7 đường dẫn. App gọi Supabase bằng SDK hoặc HTTP, dựa trên các trường và quyền trong hợp đồng. Expo không tự thực thi file YAML khi khởi động.

## Phạm vi bàn giao

Đã có đăng ký và đăng nhập email/mật khẩu trong mã Auth. Hợp đồng gồm đọc/sửa hồ sơ, đọc/tạo/sửa mục tiêu, đọc/thêm/sửa/xóa nhật ký và đọc/tạo/sửa/xóa cấu hình lịch nhắc. Google được bổ sung ở giai đoạn sau. Lọc ngày, phân trang và thứ tự nhật ký sẽ chốt sau theo yêu cầu của nhóm. Bộ lọc UID/ID phục vụ sửa, xóa và kiểm tra quyền; `request_id` phục vụ đọc lại yêu cầu tạo hoạt động bị gửi lặp.

App có form đăng ký để tạo tài khoản bên cạnh tài khoản thử tạo sẵn trong Dashboard. Khi Confirm email bật, SDK có thể trả user với session null; khi tắt có thể trả session ngay. Service app trả `requiresEmailConfirmation`, còn HTTP endpoint trả user hoặc đối tượng token theo cấu hình. Không xem HTTP 200 là bằng chứng chắc chắn email chưa từng tồn tại. Phần nhận callback xác nhận email trong app chưa được tích hợp. Quên mật khẩu đã có luồng email/PKCE và form đặt mật khẩu mới; cấu hình Cloud và giới hạn xem [QuenMatKhau.md](../../../note/QuenMatKhau.md). OpenAPI 0.3.0 hiện chưa mô tả các endpoint recovery mới. Đăng xuất hiện chọn `scope=local`; phải truyền `supabase.auth.signOut({ scope: 'local' })` vì mặc định SDK là global.

## Căn cứ và tình trạng xác minh

- SQL và mô tả nghiệp vụ từ `Seminar/note/baocao.md`, đặc biệt mục 2 và mục 7. Phụ lục có cấu trúc bảng và trigger. Lệnh `REVOKE` được ghi trong SQL, còn lệnh `GRANT` và `CREATE POLICY` chưa được cung cấp đầy đủ. Cần giữ kết quả kiểm tra quyền thật để tái lập môi trường.
- Người phụ trách đã thông báo mục 6.1 chạy tốt và đã thử qua Postman. Các response thành công/lỗi của toàn bộ thao tác chưa có trong tài liệu bàn giao.
- Ngày 15/11/2026, người dùng xác nhận POST activities bỏ user_id đã chạy được, sau đó xác nhận đã cập nhật quyền/policy UPDATE/DELETE trên cloud và các kiểm thử Postman hoạt động đúng. Trạng thái này ghi nhận theo báo cáo người dùng. Chưa có raw export hoặc response chi tiết của đợt này, nên các ví dụ trong hợp đồng là dữ liệu giả và các HTTP status vẫn cần đối chiếu bằng bằng chứng lưu lại.
- `Seminar/PostmanResult/refresh-token.json` chứa một đối tượng phiên, gồm token và user. File không kèm URL request, grant_type, HTTP status hoặc header. Vì vậy chỉ dùng làm căn cứ cho cấu trúc phiên. Trường `expires_at` để tùy chọn do có thể được SDK tính thêm.
- Các ví dụ trong YAML đều là dữ liệu giả. Các HTTP status của thao tác chưa có bằng chứng đầy đủ được mô tả theo tài liệu Supabase/PostgREST và cần thử lại trên project trước nghiệm thu. Chưa gọi API live trong lần biên soạn này.
- Bản này là hợp đồng cho toàn bộ phạm vi cơ bản đã chốt, trạng thái draft-for-integration. Chưa phải bằng chứng tất cả thao tác đã đạt kiểm thử tích hợp.

## Quy ước gọi API

Mọi request dùng `apikey` là publishable key. Request dữ liệu và đăng xuất dùng thêm `Authorization: Bearer <access_token>`. Request token dùng `apikey` cùng JSON email/mật khẩu hoặc refresh token tương ứng `grant_type`. Không dùng secret/service_role trong ứng dụng.

Các endpoint bảng trả mảng. Hồ sơ/mục tiêu chưa có hoặc bị RLS lọc có thể trả `[]`. A truy vấn hồ sơ B thường nhận 200 với `[]`. Thiếu quyền ghi theo bảng/cột có thể trả 403 với mã 42501. Tránh suy ra mọi trường hợp truy cập chéo đều trả 403.

App gửi bộ lọc `user_id=eq.<uid>` khi sửa hồ sơ/mục tiêu, `id=eq.<id>` khi sửa/xóa hoạt động hoặc lịch. Bộ lọc là quy ước bắt buộc của app trong YAML; PostgREST không tự bắt buộc các query đó. Không tạo request sửa/xóa trước khi kiểm tra ID đã có giá trị hợp lệ. Chuỗi bộ lọc không được có khoảng trắng hoặc tab trước `eq.`.

Quy ước HTTP ghi dùng `Prefer: return=representation` và không thêm `select` vào request ghi trong bản này. Với SDK, nối `.select()` sau `.insert()`, `.update()` hoặc `.delete()` để lấy các dòng bị ảnh hưởng. POST trả 201 và mảng dòng mới. PATCH/DELETE trả 200 và mảng dòng đã xử lý. Nếu không có `Prefer`, server có thể trả body rỗng theo chế độ mặc định. PATCH/DELETE trả `[]` thì phải xử lý trường hợp không có dòng, không báo đã sửa/xóa một bản ghi.

App chỉ gửi các trường thuộc schema ghi. Bỏ `user_id`, `id`, `created_at`, `updated_at` trong JSON ghi. Database tự xác định chủ sở hữu bằng JWT, sinh ID và dấu thời gian. Ngoại lệ là `request_id` do app sinh cho hoạt động. Schema ghi chặn trường dư để hướng dẫn client; database thực thi quyền theo cột và ràng buộc.

Trong bản này GET thường lấy `select=*`. GET profiles hỗ trợ thêm chuỗi ba cột `user_id,display_name,time_zone` đã thử và bốn cột `user_id,display_name,time_zone,created_at` đang dùng trong màn hình Auth. Response chỉ có các cột đã chọn.

## Quy tắc tạo, sửa và xóa hoạt động

| Thao tác | Dữ liệu app gửi | Quyền và phản hồi theo hợp đồng |
|---|---|---|
| POST activities | duration_minutes, occurred_at, request_id và note tùy chọn | Chủ sở hữu lấy từ JWT qua mặc định auth.uid(). Không gửi user_id. Với Prefer trả một dòng mới và HTTP 201. |
| PATCH activities | Ít nhất một trong duration_minutes, occurred_at, note; lọc đúng id | Chỉ được sửa hoạt động của mình. Trigger set_activities_updated_at hiện có tự gán updated_at. HTTP 200 trả dòng sau cập nhật hoặc []. |
| DELETE activities | Lọc đúng id, body trống | Xác nhận người dùng rồi xóa hẳn hoạt động của mình. HTTP 200 trả dòng đã xóa hoặc []. |

Database giữ khoảng 1–1440 phút. UI có thể đặt ngưỡng thấp hơn, nhưng quy tắc bắt buộc cho mọi client phải được thực thi ở server. Giữ nguyên id, user_id, request_id và created_at khi sửa; app không gửi updated_at. Gửi cột bị hạn chế có thể gây 42501 ngay cả khi giá trị user_id đúng bằng UID của mình.

Policy activities_update_own dùng USING và WITH CHECK theo chủ sở hữu; activities_delete_own dùng USING theo chủ sở hữu. Quyền SELECT cùng policy đọc vẫn cần để trả các dòng đã thao tác. UPDATE/DELETE bị RLS lọc dòng thường trả [] thay vì lỗi 403. App phải kiểm tra số dòng trả về trước khi báo đã sửa/xóa một bản ghi.

Sau sửa/xóa, tải lại nhật ký và tổng phút. Khi đổi occurred_at sang ngày khác, cập nhật dữ liệu ngày cũ và ngày mới. Nếu mất response sau ghi, đối chiếu lại dữ liệu thay vì cộng/trừ phút lần nữa. Hiện chưa có kiểm tra phiên bản chống ghi đè đồng thời, nên các cập nhật sau có thể ghi đè các trường trùng nhau của cập nhật trước.

TV3 cần bỏ user_id khỏi payload tạo, bỏ updated_at khỏi payload sửa và dùng .select() sau UPDATE/DELETE để nhận các dòng ảnh hưởng. Chỉ bỏ qua 23505 sau khi đã kiểm tra ràng buộc activities_user_request_uniq và đọc lại nội dung. Cloud/Postman đã được người dùng xác nhận; việc code TV3 đã cập nhật và tích hợp đủ cần kiểm tra riêng khi ghép nhánh.

## Phiên và lỗi

Sau đăng nhập hoặc refresh, cập nhật cả access token và refresh token. Dùng cơ chế refresh của SDK, tránh nhiều yêu cầu refresh đồng thời. Token hết hạn thì làm mới phiên, refresh bị từ chối thì yêu cầu đăng nhập lại. Lỗi mạng cần có trạng thái thử lại, không được xem là mật khẩu sai chỉ từ HTTP status.

Sau đăng xuất, xóa phiên cục bộ, dữ liệu cache của tài khoản cũ và lịch thông báo trên thiết bị. JWT cũ có thể còn hiệu lực đến khi hết hạn. Kiểm tra refresh token bị từ chối và app không khôi phục phiên cũ khi mở lại. Phân biệt lỗi mạng đăng xuất với việc server đã thu hồi refresh token, vì SDK có thể đã xóa phiên cục bộ trước khi server trả kết quả.

Auth và Data API có cấu trúc lỗi khác nhau. Auth ưu tiên `error_code`; Data API ưu tiên `code`. Mã 23514 thường là CHECK, 23502 là NOT NULL, 23505 là trùng khóa, 42501 là quyền truy cập. Lỗi gateway hoặc máy chủ có thể trả nội dung khác JSON, cần kiểm tra Content-Type.

## Phối hợp thành viên

| Thành viên | Việc cần phối hợp |
|---|---|
| TV1 | Dùng trạng thái phiên để điều hướng. Tổng phút hiển thị chỉ dựa trên hoạt động đã lưu thành công. Mục tiêu chưa có là trạng thái cần thiết lập, không tự ghi mặc định ngoài ý định người dùng. |
| TV2 | Quản lý client Supabase, khôi phục/làm mới phiên, ánh xạ lỗi và các hàm truy cập dữ liệu. Lưu lại SQL quyền và policy thực tế. |
| TV3 | Sinh UUID `request_id` trước lần gửi đầu, giữ nguyên payload khi thử lại. Chỉ xử lý như yêu cầu lặp khi 23505 xuất phát từ `activities_user_request_uniq`. Đọc lại theo request_id dưới cùng tài khoản, so sánh số phút, cùng thời điểm và note; note bỏ trống quy về null. Cùng nội dung dùng lại bản ghi, khác nội dung báo xung đột ở app. Sửa/xóa lọc theo id, kiểm tra dòng trả về và tải lại tổng phút. |
| TV4 | Dùng ID lịch lưu trên server để liên kết lịch cục bộ. Chỉ cập nhật thông báo sau khi xác nhận dữ liệu ghi. Hoãn 5 phút không ghi nhật ký. Hủy lịch và bỏ qua thao tác thông báo cũ khi đổi tài khoản. |
| TV5 | Lưu request và response mẫu đã ẩn thông tin xác thực cho từng thao tác. Kiểm tra quyền A/B, dữ liệu sai, gửi lặp, cập nhật/xóa 0 dòng, refresh và đăng xuất. |
| TV6 | Ghi rõ phiên bản hợp đồng, phạm vi đã thử và bằng chứng. Các mô tả mong đợi cần tách khỏi kết quả thực tế. |

`occurred_at` gửi ISO 8601 có offset hoặc UTC. Xác định ngày theo `profiles.time_zone`, từ đầu ngày đến trước đầu ngày tiếp theo. `local_time` là giờ địa phương, ngày lặp 1 là thứ Hai và 7 là Chủ nhật. App phải kiểm tra múi giờ IANA vì cột text chưa có CHECK tương ứng.

Lọc ngày và phân trang đang hoãn. GET activities có giới hạn số dòng theo cấu hình Data API và chưa cam kết thứ tự. Trước khi nghiệm thu tổng phút hôm nay, phải có cách lấy đủ dữ liệu của ngày hoặc phép tổng hợp đáng tin cậy. Không lấy một response có thể bị cắt làm toàn bộ lịch sử để cộng.

## Kiểm thử còn cần lưu bằng chứng

| Luồng | Bằng chứng cần có |
|---|---|
| Auth | Đăng ký có/chưa có session theo Confirm email, đăng nhập đúng/sai, refresh thành công/thất bại, logout local và refresh phiên đã logout bị từ chối. |
| Profiles | Đọc đầy đủ/ba cột, sửa trường cho phép, chặn cột hệ thống, A đọc/sửa B không làm lộ hoặc đổi dữ liệu B. |
| Goals | Tạo lần đầu, trùng mục tiêu, đổi 30 thành 45, từ chối 0 và kiểm tra updated_at. |
| Activities | POST không có user_id, sửa đúng ba trường, trigger updated_at, DELETE theo id, UPDATE/DELETE chéo A/B, thử ghi cột hệ thống, các biên 0/1440/1441, xóa lặp, gửi lặp POST và nội dung xung đột. Lưu bằng chứng các ca đã được người dùng xác nhận và ghi riêng các ca tích hợp app còn thiếu. |
| Reminders | Tạo/sửa/tắt/xóa lịch, ngày rỗng/trùng/ngoài 1–7/null bị từ chối, chặn giờ 24:00:00 và kiểm tra tài khoản chéo. |
| Tích hợp app | Khôi phục phiên, đổi A sang B, mất mạng khi ghi, dọn cache/lịch sau logout, tổng phút với dữ liệu qua nửa đêm. |

## Tài liệu tham chiếu

- [Supabase Auth REST OpenAPI](https://github.com/supabase/auth/blob/master/openapi.yaml)
- [Phạm vi đăng xuất](https://supabase.com/docs/guides/auth/signout)
- [PostgREST trả dòng sau thao tác ghi](https://docs.postgrest.org/en/stable/references/api/preferences.html#return-representation)
- [Mã lỗi PostgREST](https://docs.postgrest.org/en/stable/references/errors.html)
