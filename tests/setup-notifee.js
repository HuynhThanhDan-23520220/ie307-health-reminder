// [TV4] Notifee là native module → dùng bản giả lập do thư viện cung cấp khi chạy Jest.
jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));
