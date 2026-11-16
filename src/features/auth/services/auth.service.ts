import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabase';
import { clearPasswordRecoveryUrl, getPasswordRecoveryRedirectUrl, isPasswordRecoveryUrl } from './password-recovery';

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
      otp_expired: 'Liên kết đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu email mới.',
      flow_state_expired: 'Liên kết đã hết hạn. Vui lòng yêu cầu email mới.',
      flow_state_not_found: 'Không tìm thấy yêu cầu khôi phục. Hãy yêu cầu email mới trên thiết bị này.',
      bad_code_verifier: 'Hãy mở liên kết trên cùng thiết bị và trình duyệt đã yêu cầu đặt lại mật khẩu.',
      pkce_code_verifier_not_found: 'Không tìm thấy yêu cầu trên thiết bị này. Hãy yêu cầu email mới và mở liên kết trên cùng thiết bị hoặc trình duyệt.',
      same_password: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      session_not_found: 'Phiên khôi phục đã kết thúc. Vui lòng yêu cầu email mới.',
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

export async function requestPasswordReset(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AuthOperationError('invalid_email', 'Vui lòng nhập địa chỉ email hợp lệ.');
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getPasswordRecoveryRedirectUrl(),
  });
  if (error) throw toAuthOperationError(error);
}

export async function acceptPasswordRecoveryLink(value: string) {
  if (!isPasswordRecoveryUrl(value)) {
    throw new AuthOperationError('invalid_recovery_link', 'Liên kết khôi phục không hợp lệ.');
  }
  const url = new URL(value);
  const code = url.searchParams.get('code');
  if (url.searchParams.has('error') || url.hash || !code || url.searchParams.getAll('code').length !== 1) {
    throw new AuthOperationError('invalid_recovery_link', 'Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu email mới.');
  }
  const flowId = url.searchParams.get('sb_flow_id');
  const { data, error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error) throw toAuthOperationError(error);
  // Provider opens the reset form only on the SDK's PASSWORD_RECOVERY event.
  if (!data.session) {
    throw new AuthOperationError('invalid_recovery_link', 'Liên kết không thuộc yêu cầu đặt lại mật khẩu trên thiết bị này.');
  }
  clearPasswordRecoveryUrl(value);
}

export async function updatePassword(password: string) {
  if (!password) {
    throw new AuthOperationError('missing_password', 'Vui lòng nhập mật khẩu mới.');
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toAuthOperationError(error);
}
