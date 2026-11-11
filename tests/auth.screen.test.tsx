import { act, fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { supabase } from '../src/services/supabase';

jest.mock('../src/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
});

test('App mở form kiểm thử và gửi đăng nhập bằng dữ liệu đã nhập', async () => {
  const user = { id: 'test-user', aud: 'authenticated', created_at: '', app_metadata: {}, user_metadata: {} };
  jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
    data: { user, session: { access_token: 'test-access', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user } }, error: null,
  });
  await render(<App />);
  expect(screen.getByText('thành viên 2 kiểm thử')).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByLabelText('Email'), 'test@example.com');
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu'), 'password');
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
});

test('form đăng ký chặn mật khẩu khác nhau và hiển thị yêu cầu xác nhận email', async () => {
  jest.mocked(supabase.auth.signUp).mockResolvedValue({ data: { user: null, session: null }, error: null });
  await render(<App />);
  await fireEvent.press(screen.getByRole('button', { name: 'Tạo tài khoản' }));
  await fireEvent.changeText(screen.getByLabelText('Email'), 'new@example.com');
  await fireEvent.changeText(screen.getByLabelText('Mật khẩu'), 'new-password');
  await fireEvent.changeText(screen.getByLabelText('Nhập lại mật khẩu'), 'different');
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng ký' }));
  expect(screen.getByText('Hai mật khẩu không khớp.')).toBeOnTheScreen();
  expect(supabase.auth.signUp).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByLabelText('Nhập lại mật khẩu'), 'new-password');
  await act(async () => { await fireEvent.press(screen.getByRole('button', { name: 'Đăng ký' })); });
  expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'new-password' });
  expect(screen.getByText(/Yêu cầu đăng ký đã gửi/)).toBeOnTheScreen();
  expect(screen.queryByText('Đã có phiên đăng nhập')).toBeNull();
});

test('đọc hồ sơ cloud theo UID của phiên và xóa kết quả khi đăng xuất', async () => {
  const user = { id: 'profile-test-user', email: 'test@example.com', aud: 'authenticated', created_at: '', app_metadata: {}, user_metadata: {} };
  jest.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { access_token: 'test-access', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user } }, error: null,
  });
  const eq = jest.fn().mockResolvedValue({ data: [{ user_id: user.id, display_name: 'Hồ sơ thử' }], error: null });
  const select = jest.fn(() => ({ eq }));
  (supabase.from as jest.Mock).mockReturnValue({ select });
  jest.mocked(supabase.auth.signOut).mockImplementation(async () => {
    jest.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0]('SIGNED_OUT', null);
    return { error: null };
  });

  await render(<App />);
  await fireEvent.press(screen.getByRole('button', { name: 'Đọc hồ sơ' }));
  expect(supabase.from).toHaveBeenCalledWith('profiles');
  expect(eq).toHaveBeenCalledWith('user_id', user.id);
  expect(await screen.findByText(/Hồ sơ thử/)).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Đăng xuất' }));
  expect(screen.queryByText(/Hồ sơ thử/)).toBeNull();
  expect(screen.getByLabelText('Email')).toBeOnTheScreen();
});
