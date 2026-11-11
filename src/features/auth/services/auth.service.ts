import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabase';

export class AuthOperationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthOperationError';
  }
}

export function toAuthOperationError(error: unknown): AuthOperationError {
  if (error instanceof AuthOperationError) return error;

  if (isAuthRetryableFetchError(error) || error instanceof TypeError) {
    return new AuthOperationError(
      'connection_error',
      'Không thể kết nối dịch vụ xác thực. Kiểm tra mạng và thử lại.',
    );
  }

  if (isAuthError(error)) {
    const messages: Record<string, string> = {
      invalid_credentials: 'Email hoặc mật khẩu không đúng.',
      email_not_confirmed: 'Bạn cần xác nhận email trước khi đăng nhập.',
      refresh_token_not_found: 'Phiên đã kết thúc. Vui lòng đăng nhập lại.',
      refresh_token_already_used: 'Không thể làm mới phiên. Vui lòng đăng nhập lại.',
      over_request_rate_limit: 'Bạn thao tác quá nhanh. Hãy chờ rồi thử lại.',
      user_banned: 'Tài khoản đang bị khóa.',
      weak_password: 'Mật khẩu chưa đáp ứng chính sách của project Supabase.',
      user_already_exists: 'Email đã được đăng ký. Hãy thử đăng nhập.',
      email_exists: 'Email đã được đăng ký. Hãy thử đăng nhập.',
      email_address_invalid: 'Địa chỉ email không hợp lệ.',
      signup_disabled: 'Project Supabase chưa cho phép đăng ký tài khoản mới.',
      over_email_send_rate_limit: 'Đã vượt giới hạn gửi email xác nhận. Hãy chờ rồi thử lại.',
    };
    return new AuthOperationError(
      error.code ?? 'auth_error',
      messages[error.code ?? ''] ?? 'Không thể hoàn tất xác thực. Vui lòng thử lại.',
      error.status,
    );
  }

  return new AuthOperationError('unexpected_error', 'Có lỗi khi xử lý phiên đăng nhập. Vui lòng thử lại.');
}

export async function signIn(email: string, password: string) {
  if (!email.trim() || !password) {
    throw new AuthOperationError('missing_credentials', 'Vui lòng nhập email và mật khẩu.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw toAuthOperationError(error);
  return data.session;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw toAuthOperationError(error);
  return data.session;
}

export async function signUp(email: string, password: string) {
  if (!email.trim() || !password) {
    throw new AuthOperationError('missing_credentials', 'Vui lòng nhập email và mật khẩu.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AuthOperationError('invalid_email', 'Địa chỉ email không hợp lệ.');
  }

  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw toAuthOperationError(error);
  return { requiresEmailConfirmation: !data.session };
}

export async function signOut() {
  // Local sign-out can remove the stored session even if server revocation fails.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw toAuthOperationError(error);
}
