# GHI CHÉP CÔNG VIỆC & BÀN GIAO CỦA TV1 (BÙI CÔNG DANH)

- **Thành viên:** Bùi Công Danh (TV1)
- **Vai trò:** Thiết kế giao diện trẻ trung (dành cho học sinh, sinh viên & người đi làm), bố cục thích ứng (Responsive), khung điều hướng (Navigation Framework) và màn hình Trang chủ (Dashboard).
- **Ưu tiên thực hiện:** Khung điều hướng & UI Components dùng chung để TV3–TV4 triển khai đồng nhất.

---

## 1. Danh sách các hạng mục TV1 đã hoàn thành

1. **Hệ thống Design System & Bố cục thích ứng (`src/theme/`):**
   - `src/theme/tokens.ts`: Bộ màu trẻ trung, năng động (`Electric Indigo #4F46E5`, `Vibrant Orange #F97316`, `Fresh Emerald #10B981`, `Sky Cyan #0EA5E9`), thang khoảng cách `SPACING`, bo góc `RADIUS` và cỡ chữ `FONT_SIZES`.
   - `src/theme/LayoutContext.tsx`: Tự động nhận diện kích thước màn hình (`useWindowDimensions`) để tính toán `isSmallScreen`, `isTabletOrLarge`, `useTwoColumnRow`, giúp bố cục tự động co giãn từ điện thoại nhỏ sang điện thoại lớn/tablet mà không bị tràn chữ.

2. **Bộ Component dùng chung (`src/components/`):**
   - `ScreenContainer`: Khung bọc màn hình tích hợp sẵn `SafeAreaView`, `KeyboardAvoidingView` và `ScrollView` thích ứng.
   - `AppText`: Component hiển thị văn bản đồng bộ theo `FONT_SIZES` và `LayoutContext`.
   - `AppCard`: Khung thẻ bo góc hiện đại dùng chung cho mọi màn hình.
   - `AppButton`: Nút bấm có cơ chế chống bấm lặp (`debounceMs = 600ms`) hỗ trợ TV3 và TV4 ngăn người dùng bấm Lưu nhiều lần liên tiếp.
   - `MedicalDisclaimerBanner`: Khung lưu ý sức khỏe & tuyên bố miễn trừ trách nhiệm y tế.

3. **Khung điều hướng & Deep Linking (`src/app/` — Ưu tiên bàn giao cho TV3 & TV4):**
   - `src/app/navigation.types.ts`: Định nghĩa `MainTabParamList` gồm 4 tab chính (`HomeTab`, `ActivityLogTab`, `RemindersTab`, `ProfileAuthTab`) kèm kiểu dữ liệu truyền tham số chặt chẽ.
   - `src/app/linking.ts`: Cấu hình Deep Link (`healthtracker://home`, `healthtracker://log`, `healthtracker://reminders`) hỗ trợ TV4 điều hướng từ Notification Actions hoặc Widget vào thẳng màn hình trong ứng dụng.
   - `src/app/AppNavigator.tsx`: Khung Bottom Tabs hoàn chỉnh và các Slot tích hợp sẵn cho TV2, TV3, TV4.

4. **Màn hình Trang chủ (`src/features/dashboard/`):**
   - `DailyProgressHeroCard`: Hiển thị tổng số phút vận động hôm nay, phần trăm hoàn thành mục tiêu, trạng thái giữ chuỗi Streak ($\ge 80\%$ mục tiêu) và lượng nước khuyến nghị tự động tính lại theo thời gian vận động.
   - `StreakAndAlertRow`: Hiển thị chuỗi ngày liên tiếp (Streak), số phiên giải lao và banner cảnh báo khi ngồi học/làm việc liên tục vượt ngưỡng.
   - `QuickNavigationCard`: Cụm nút thao tác nhanh chuyển thẳng sang màn hình Form nhập của TV3 (điền sẵn `prefillMinutes` & `activityType`) hoặc màn hình Lịch nhắc của TV4.
   - `WeeklyTrendChartCard`: Biểu đồ cột thống kê phong độ vận động 7 ngày trong tuần và so sánh với tuần trước.

---

## 2. Hướng dẫn nhanh cho TV3 và TV4 khi ghép code

### Dành cho TV3 (Phụ trách `src/features/activity-log/`):
- Bọc màn hình bằng `<ScreenContainer>` và dùng `<AppCard>`, `<AppText>`, `<AppButton>` từ `src/components`.
- Nhận tham số điền sẵn từ Trang chủ hoặc Notification bằng `route.params?.prefillMinutes` và `route.params?.activityType`.
- Sau khi lưu thành công, có thể gọi `navigation.navigate('HomeTab', { lastLoggedMinutes, lastLoggedWaterMl })` để cập nhật tiến độ Trang chủ.

### Dành cho TV4 (Phụ trách `src/features/reminders/`):
- Bọc màn hình bằng `<ScreenContainer>` và dùng `<AppCard>`, `<AppText>`, `<AppButton>` từ `src/components`.
- Khi người dùng bấm vào thông báo hoặc nút hành động ngoài ứng dụng (Chủ đề 14), có thể mở Deep Link `healthtracker://log?prefillMinutes=5&activityType=stretch` hoặc dùng `navigation.navigate('ActivityLogTab', { prefillMinutes: 5, activityType: 'stretch' })`.
