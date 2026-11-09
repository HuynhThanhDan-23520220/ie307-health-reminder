# Nâng Expo SDK 58 — 09/11/2026

## Thay đổi

- Expo 52 → 58.0.23; React 18.3.1 → 19.3.0; React Native 0.76.3 → 0.88.1.
- TypeScript 5.3.3 → 6.0.3. Kế thừa tsconfig của Expo, bỏ baseUrl, dùng bundler, alias tương đối và khai báo types cho React/React Native/Jest.
- Đồng bộ các Expo modules, safe-area-context, screens, AsyncStorage và NetInfo theo SDK 58. Bổ sung dependency web và development client.
- Zod 3 → 4.6.7 và resolver tương thích; dự án chưa có schema Zod nên chưa có schema cần chuyển đổi.
- Jest 30, jest-expo 58, React Native Testing Library 14 và test-renderer 1. Bỏ jest-native cũ; dùng matcher tích hợp trong Testing Library.
- Thêm cấu hình ESLint và Jest còn thiếu. Giữ React Navigation, không chuyển kiến trúc điều hướng.
- Trang chủ nhận và tiêu thụ dữ liệu demo khi focus; xóa tham số đã xử lý để lần ghi cùng số phút tiếp theo vẫn cập nhật và tránh xử lý lại cùng tham số khi quay lại tab.
- Cập nhật README, requirements.txt và lockfile. Không nâng bằng --force hoặc --legacy-peer-deps.

## Kiểm chứng

- `npm run typecheck`: đạt với TypeScript 6, không dùng ignoreDeprecations.
- `npm run lint`: đạt.
- `npm test -- --runInBand`: smoke test dùng giao diện và điều hướng thật, mock ranh giới manifest Expo và safe area của môi trường Jest.
- `npm run export:check`: đóng gói JavaScript/assets Android, iOS và web thành công.
- `npx expo-doctor`: 19/20 đạt. Cảnh báo còn lại: Notifee bị React Native Directory đánh dấu unmaintained. Không ẩn cảnh báo này bằng exclude.
- `npm audit`: 31 cảnh báo (1 low, 30 moderate), 0 high, 0 critical; trước nâng cấp là 33 (8 low, 18 moderate, 6 high, 1 critical). Không đồng nghĩa dependency đã sạch lỗ hổng. Cảnh báo còn lại đi qua các công cụ Expo/Jest/ESLint và thư viện phụ thuộc. Không chạy audit fix --force vì đề xuất thay đổi major hoặc hạ SDK.

## Giới hạn

Chưa build APK/IPA và chưa kiểm thử thiết bị thật. Export JavaScript không xác nhận tương thích native của Notifee, thông báo nền, OAuth hoặc SecureStore. Bản npm Notifee 9.1.8 không chứa app.plugin.js, nên cấu hình plugins chỉ bổ sung expo-secure-store; không thêm tên Notifee vào plugins làm hỏng việc đọc Expo config. Native build/autolinking và Notification Actions cần được kiểm tra riêng trước demo.

Mã nguồn hiện tại vẫn là UI/demo, chưa phải backend và luồng lưu vận động hoàn chỉnh. Không thay đổi project backend hay thông tin xác thực.

## Sao lưu và cài lại

`node_modules` và `package-lock.json` trước nâng cấp (bao gồm thay đổi lockfile có sẵn) được giữ ngoài repo tại `../.sdk52-backup/`. Không copy chúng vào cây SDK 58. Các thành viên dùng `npm ci` với lockfile mới. Tệp nguồn được sửa tại chỗ, chưa commit/push tự động.

Nguồn tham khảo: [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [TypeScript 6](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html), [Testing Library 14](https://oss.callstack.com/react-native-testing-library/docs/start/quick-start).
