// [TV4] Notifee là native module → khi chạy Jest dùng bản giả lập tự viết.
// (Bản jest-mock.js có sẵn của Notifee viết bằng ESM nên Jest không nạp được.)
jest.mock('@notifee/react-native', () => {
  const notifee = {
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    createChannel: jest.fn(async () => 'channel'),
    setNotificationCategories: jest.fn(async () => undefined),
    getNotificationSettings: jest.fn(async () => ({ authorizationStatus: 1, android: { alarm: 1 } })),
    openAlarmPermissionSettings: jest.fn(async () => undefined),
    createTriggerNotification: jest.fn(async () => 'id'),
    displayNotification: jest.fn(async () => 'id'),
    cancelTriggerNotifications: jest.fn(async () => undefined),
    cancelDisplayedNotifications: jest.fn(async () => undefined),
    cancelDisplayedNotification: jest.fn(async () => undefined),
    cancelAllNotifications: jest.fn(async () => undefined),
    getInitialNotification: jest.fn(async () => null),
    onForegroundEvent: jest.fn(() => () => undefined),
    onBackgroundEvent: jest.fn(),
  };
  return {
    __esModule: true,
    default: notifee,
    AndroidImportance: { DEFAULT: 3, HIGH: 4 },
    AndroidNotificationSetting: { NOT_SUPPORTED: -1, DISABLED: 0, ENABLED: 1 },
    AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
    EventType: { UNKNOWN: -1, DISMISSED: 0, PRESS: 1, ACTION_PRESS: 2, DELIVERED: 3 },
    RepeatFrequency: { NONE: -1, HOURLY: 0, DAILY: 1, WEEKLY: 2 },
    TriggerType: { TIMESTAMP: 0, INTERVAL: 1 },
  };
});
