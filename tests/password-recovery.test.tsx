import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import App from '../App';
import { supabase } from '../src/services/supabase';
import * as authService from '../src/features/auth/services/auth.service';
import { isPasswordRecoveryUrl } from '../src/features/auth/services/password-recovery';

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'breakflow://auth/reset-password'),
  getInitialURL: jest.fn(async () => null),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('../src/services/supabase', () => ({
  supabase: { auth: {
    getSession: jest.fn(), onAuthStateChange: jest.fn(), startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn(),
    resetPasswordForEmail: jest.fn(), exchangeCodeForSession: jest.fn(), updateUser: jest.fn(), signOut: jest.fn(),
  } },
}));
jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const user = { id: 'recovery-user', email: 'test@example.com', aud: 'authenticated', created_at: '', app_metadata: {}, user_metadata: {} };
const session = { access_token: 'test-access', refresh_token: 'test-refresh', token_type: 'bearer' as const, expires_in: 3600, user };
function emit(event: 'PASSWORD_RECOVERY' | 'SIGNED_OUT' | 'USER_UPDATED') {
  jest.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0](event, event === 'SIGNED_OUT' ? null : session);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Linking.getInitialURL).mockResolvedValue(null);
  jest.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
  jest.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: { id: 'test', callback: jest.fn(), unsubscribe: jest.fn() } },
  });
  jest.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ data: {}, error: null });
  jest.mocked(supabase.auth.updateUser).mockImplementation(async () => {
    emit('USER_UPDATED');
    return { data: { user }, error: null };
  });
  jest.mocked(supabase.auth.exchangeCodeForSession).mockImplementation(async () => {
    emit('PASSWORD_RECOVERY');
    return { data: { session, user, redirectType: 'recovery' }, error: null };
  });
  jest.mocked(supabase.auth.signOut).mockImplementation(async () => {
    emit('SIGNED_OUT');
    return { error: null };
  });
});

test('form quên mật khẩu kiểm tra email và chỉ gửi email với redirect đã cấu hình', async () => {
  await render(<App />);
  // Chờ AuthProvider flush getSession() promise và set isInitializing = false,
  // nếu không button sẽ còn ở trạng thái disabled và fireEvent.press bị bỏ qua.
  expect(await screen.findByRole('button', { name: 'Quên mật khẩu?' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Quên mật khẩu?' }));
  expect(screen.queryByLabelText('Mật khẩu')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Email'), 'invalid');
  await fireEvent.press(screen.getByRole('button', { name: 'Gửi email đặt lại mật khẩu' }));
  expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Email'), ' test@example.com ');
  await fireEvent.press(screen.getByRole('button', { name: 'Gửi email đặt lại mật khẩu' }));
  expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
    redirectTo: 'breakflow://auth/reset-password',
  });
  expect(screen.getByText(/Nếu email này có tài khoản/)).toBeOnTheScreen();
  expect(supabase.auth.updateUser).not.toHaveBeenCalled();
});

test('cold start với link PKCE mở form, chặn mật khẩu không khớp, đổi mật khẩu rồi đăng xuất', async () => {
  jest.mocked(Linking.getInitialURL).mockResolvedValue('breakflow://auth/reset-password?code=one-time-code');
  await render(<App />);
  expect(await screen.findByLabelText('Mật khẩu mới')).toBeOnTheScreen();
  expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('one-time-code', undefined);
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), ' new-password ');
  await fireEvent.changeText(screen.getByLabelText('Nhập lại mật khẩu mới'), 'different');
  await fireEvent.press(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }));
  expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Nhập lại mật khẩu mới'), ' new-password ');
  await fireEvent.press(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }));
  expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: ' new-password ' });
  expect(screen.getByText(/Đã đổi mật khẩu thành công/)).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Quay lại đăng nhập' }));
  expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(screen.getByLabelText('Email')).toBeOnTheScreen();
});

test('warm link trùng chỉ đổi code một lần và cleanup listener khi unmount', async () => {
  const view = await render(<App />);
  const callback = jest.mocked(Linking.addEventListener).mock.calls[0][1];
  const event = { url: 'breakflow://auth/reset-password?code=warm-code' };
  await act(async () => { callback(event); callback(event); });
  expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  const subscription = jest.mocked(Linking.addEventListener).mock.results[0].value;
  await view.unmount();
  expect(subscription.remove).toHaveBeenCalled();
});

test('callback truyền flow ID cho SDK nếu link có nhiều luồng PKCE', async () => {
  await render(<App />);
  await act(async () => {
    await authService.acceptPasswordRecoveryLink('breakflow://auth/reset-password?code=code-with-flow&sb_flow_id=flow-1');
  });
  expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('code-with-flow', { flowId: 'flow-1' });
});

test('lỗi đổi mật khẩu giữ form để thử lại và không báo thành công', async () => {
  jest.mocked(Linking.getInitialURL).mockResolvedValue('breakflow://auth/reset-password?code=valid-code');
  jest.mocked(supabase.auth.updateUser).mockRejectedValue(new TypeError('Network request failed'));
  await render(<App />);
  await screen.findByLabelText('Mật khẩu mới');
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu mới'), 'new-password');
  await fireEvent.changeText(screen.getByLabelText('Nhập lại mật khẩu mới'), 'new-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }));
  expect(screen.getByText(/Không thể kết nối dịch vụ xác thực/)).toBeOnTheScreen();
  expect(screen.queryByText(/Đã đổi mật khẩu thành công/)).toBeNull();
  expect(screen.getByLabelText('Mật khẩu mới')).toBeOnTheScreen();
});

test('không tin host/path lạ, token trong fragment hoặc link báo lỗi', async () => {
  expect(isPasswordRecoveryUrl('https://evil.example/auth/reset-password?code=x')).toBe(false);
  expect(isPasswordRecoveryUrl('breakflow://auth/other?code=x')).toBe(false);
  for (const url of [
    'breakflow://auth/reset-password#access_token=fake&refresh_token=fake',
    'breakflow://auth/reset-password?error=access_denied&error_description=sensitive',
    'breakflow://auth/reset-password?code=a&code=b',
  ]) {
    await expect(authService.acceptPasswordRecoveryLink(url)).rejects.toMatchObject({ code: 'invalid_recovery_link' });
  }
  expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
});

test('link hết hạn không mở form đổi mật khẩu và không hiển thị lỗi thô chứa credential', async () => {
  jest.mocked(Linking.getInitialURL).mockResolvedValue('breakflow://auth/reset-password?error=access_denied&error_description=secret');
  await render(<App />);
  expect(await screen.findByText(/Liên kết không hợp lệ hoặc đã hết hạn/)).toBeOnTheScreen();
  expect(screen.queryByLabelText('Mật khẩu mới')).toBeNull();
  expect(screen.queryByText('secret')).toBeNull();
});
