import { act, render } from '@testing-library/react-native';
import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from '../src/features/auth/providers/AuthProvider';
import { useAuth } from '../src/features/auth/hooks/useAuth';
import { supabase } from '../src/services/supabase';

jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

const session: Session = {
  access_token: 'test-access',
  refresh_token: 'test-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  user: { id: 'test-user', aud: 'authenticated', created_at: '', app_metadata: {}, user_metadata: {} },
};

let auth: ReturnType<typeof useAuth>;
const unsubscribe = jest.fn();

function Probe() {
  const value = useAuth();
  useEffect(() => { auth = value; }, [value]);
  return null;
}

function emit(event: Parameters<Parameters<typeof supabase.auth.onAuthStateChange>[0]>[0], nextSession: Session | null) {
  const callback = jest.mocked(supabase.auth.onAuthStateChange).mock.calls[0][0];
  return callback(event, nextSession);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
    data: { subscription: { id: 'test', callback: jest.fn(), unsubscribe } },
  });
  jest.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });
});

test('kết quả khôi phục cũ không ghi đè phiên vừa đăng nhập; hủy subscription khi tháo Provider', async () => {
  let resolveRestore!: (value: Awaited<ReturnType<typeof supabase.auth.getSession>>) => void;
  jest.mocked(supabase.auth.getSession).mockReturnValue(new Promise((resolve) => { resolveRestore = resolve; }));

  const view = await render(<AuthProvider><Probe /></AuthProvider>);
  expect(auth.isInitializing).toBe(true);

  await act(() => { emit('SIGNED_IN', session); });
  await act(async () => { resolveRestore({ data: { session: null }, error: null }); });

  expect(auth.session).toEqual(session);
  expect(auth.isInitializing).toBe(false);
  await view.unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

test('chặn thao tác đồng thời và giữ nguyên mật khẩu khi gửi đăng nhập', async () => {
  let resolveSignIn!: (value: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>) => void;
  jest.mocked(supabase.auth.signInWithPassword).mockReturnValue(new Promise((resolve) => { resolveSignIn = resolve; }));
  await render(<AuthProvider><Probe /></AuthProvider>);

  let signingIn!: Promise<void>;
  await act(() => { signingIn = auth.signIn(' test@example.com ', ' password '); });
  expect(auth.isSigningIn).toBe(true);
  await expect(auth.signOut()).rejects.toMatchObject({ code: 'operation_in_progress' });
  expect(supabase.auth.signOut).not.toHaveBeenCalled();
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: ' password ' });

  await act(async () => {
    emit('SIGNED_IN', session);
    resolveSignIn({ data: { user: session.user, session }, error: null });
    await signingIn;
  });
  expect(auth.isSigningIn).toBe(false);
  expect(auth.user?.id).toBe(session.user.id);
});

test('giữ trạng thái đã đăng xuất nếu SDK xóa phiên rồi báo lỗi mạng', async () => {
  await render(<AuthProvider><Probe /></AuthProvider>);
  await act(() => { emit('SIGNED_IN', session); });
  jest.mocked(supabase.auth.signOut).mockImplementation(async () => {
    emit('SIGNED_OUT', null);
    throw new TypeError('Network request failed');
  });

  await act(async () => {
    await expect(auth.signOut()).rejects.toMatchObject({ code: 'connection_error' });
  });

  expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(auth.session).toBeNull();
  expect(auth.error?.code).toBe('connection_error');
  expect(auth.isSigningOut).toBe(false);
});

test('đăng ký cần xác nhận email chưa tạo phiên đăng nhập', async () => {
  jest.mocked(supabase.auth.signUp).mockResolvedValue({ data: { user: session.user, session: null }, error: null });
  await render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => {
    await expect(auth.signUp(' new@example.com ', 'new-password')).resolves.toEqual({ requiresEmailConfirmation: true });
  });
  expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'new-password' });
  expect(auth.session).toBeNull();
  expect(auth.isSigningUp).toBe(false);
});
