import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { enableScreens } from 'react-native-screens';

// Native screen transitions do not run in Jest; exercise the JS navigation stack.
enableScreens(false);

// Jest has no native Expo manifest; keep navigation real and stub only its URL origin.
jest.mock('expo-linking', () => ({
  ...jest.requireActual('expo-linking'),
  createURL: (path: string) => `breakflow://${path.replace(/^\//, '')}`,
}));

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('mở trang chủ và chuyển dữ liệu từ thao tác nhanh sang nhật ký', async () => {
  await render(<App />);

  expect(await screen.findByText('Chào Bùi Công Danh!')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Vươn vai 5p (TV3)'));
  await act(() => jest.runAllTimersAsync());

  expect(await screen.findByText('• prefillMinutes: 5 phút')).toBeOnTheScreen();
  expect(screen.getByText('• activityType: stretch')).toBeOnTheScreen();

  await fireEvent.press(screen.getByText('Giả lập Lưu +5 phút & Quay về Trang chủ (TV1)'));
  await act(() => jest.runAllTimersAsync());
  expect(await screen.findByText('25 / 30 phút')).toBeOnTheScreen();

  // A second identical amount is a new navigation event, not a duplicate render.
  // AppButton intentionally ignores repeated presses within 600 ms.
  await act(() => jest.advanceTimersByTimeAsync(601));
  await fireEvent.press(screen.getByText('Vươn vai 5p (TV3)'));
  await act(() => jest.runAllTimersAsync());
  await fireEvent.press(await screen.findByText('Giả lập Lưu +5 phút & Quay về Trang chủ (TV1)'));
  await act(() => jest.runAllTimersAsync());
  expect(await screen.findByText('30 / 30 phút')).toBeOnTheScreen();
});
