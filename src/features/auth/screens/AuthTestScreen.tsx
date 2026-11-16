import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '../../../components';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { toAuthOperationError } from '../services/auth.service';

function ProfileTest({ userId }: { userId: string }) {
  const [result, setResult] = useState('Chưa đọc hồ sơ.');
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(false);
  const pending = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function readProfile() {
    if (pending.current) return;
    pending.current = true;
    setIsLoading(true);
    setResult('Đang đọc hồ sơ từ Supabase…');
    try {
      const { data, error } = await supabase.from('profiles')
        .select('user_id,display_name,time_zone,created_at')
        .eq('user_id', userId);
      if (error) throw new Error(`${error.code}: ${error.message}`);
      if (mounted.current) {
        setResult(data.length ? JSON.stringify(data, null, 2) : 'Không có hồ sơ được trả về. Kiểm tra trigger, quyền SELECT và RLS.');
      }
    } catch (error) {
      if (mounted.current) setResult(error instanceof Error ? error.message : 'Không đọc được hồ sơ.');
    } finally {
      pending.current = false;
      if (mounted.current) setIsLoading(false);
    }
  }

  return (
    <View style={styles.section}>
      <Button title="Đọc hồ sơ" disabled={isLoading} onPress={() => { void readProfile(); }} />
      <Text selectable accessibilityLiveRegion="polite">{result}</Text>
    </View>
  );
}

// thành viên 2
export function AuthTestScreen() {
  const { user, passwordRecovery, isHandlingRecoveryLink } = useAuth();
  if (isHandlingRecoveryLink) {
    return <ScreenContainer><Text>Đang xác minh liên kết khôi phục…</Text></ScreenContainer>;
  }
  if (passwordRecovery !== 'none') return <PasswordRecoveryForm key={user?.id} />;
  // Remount the form on account changes to discard old credentials and query results.
  return <AuthTestForm key={user?.id ?? 'signed-out'} />;
}

function PasswordRecoveryForm() {
  const { user, passwordRecovery, isUpdatingPassword, isSigningOut, error, updatePassword, signOut, clearError } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const busy = isUpdatingPassword || isSigningOut;

  async function save() {
    clearError();
    setMessage('');
    if (password !== confirmation) {
      setMessage('Hai mật khẩu không khớp.');
      return;
    }
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmation('');
    } catch (saveError) {
      setMessage(toAuthOperationError(saveError).message);
    }
  }

  async function leave() {
    setMessage('');
    try {
      await signOut();
    } catch (logoutError) {
      setMessage(toAuthOperationError(logoutError).message);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.section}>
        <Text>Đặt lại mật khẩu</Text>
        <Text>Email: {user?.email}</Text>
        {passwordRecovery === 'complete' ? (
          <Text>Đã đổi mật khẩu thành công. Hãy quay lại đăng nhập bằng mật khẩu mới.</Text>
        ) : (
          <>
            <TextInput accessibilityLabel="Mật khẩu mới" placeholder="Mật khẩu mới" secureTextEntry
              autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
              value={password} onChangeText={setPassword} editable={!busy} style={styles.input} />
            <TextInput accessibilityLabel="Nhập lại mật khẩu mới" placeholder="Nhập lại mật khẩu mới" secureTextEntry
              autoCapitalize="none" autoCorrect={false} autoComplete="new-password"
              value={confirmation} onChangeText={setConfirmation} editable={!busy} style={styles.input} />
            <Button title="Lưu mật khẩu mới" disabled={busy} onPress={() => { void save(); }} />
          </>
        )}
        <Button title={passwordRecovery === 'complete' ? 'Quay lại đăng nhập' : 'Hủy và đăng xuất'} disabled={busy}
          onPress={() => { void leave(); }} />
        {busy && <Text>Đang gửi yêu cầu…</Text>}
        <Text accessibilityLiveRegion="polite">{message || error?.message || ''}</Text>
      </View>
    </ScreenContainer>
  );
}

function AuthTestForm() {
  const { user, isInitializing, isSigningIn, isSigningUp, isSigningOut, isSendingPasswordReset,
    error, signIn, signUp, signOut, requestPasswordReset, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState('');
  const busy = isInitializing || isSigningIn || isSigningUp || isSigningOut || isSendingPasswordReset;

  async function submit() {
    setMessage('');
    clearError();
    if (isForgotPassword) {
      try {
        await requestPasswordReset(email);
        setMessage('Nếu email này có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư rác và mở liên kết trên cùng thiết bị hoặc trình duyệt này.');
      } catch (resetError) {
        setMessage(toAuthOperationError(resetError).message);
      }
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setMessage('Hai mật khẩu không khớp.');
      return;
    }
    try {
      if (isRegistering) {
        const result = await signUp(email, password);
        setMessage(result.requiresEmailConfirmation
          ? 'Yêu cầu đăng ký đã gửi. Kiểm tra email xác nhận trước khi đăng nhập. Đối chiếu tài khoản trong Supabase Dashboard.'
          : 'Đăng ký đã trả về phiên đăng nhập.');
      } else {
        await signIn(email, password);
      }
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setMessage(toAuthOperationError(submitError).message);
    }
  }

  async function logout() {
    setMessage('');
    try {
      await signOut();
    } catch (logoutError) {
      setMessage(toAuthOperationError(logoutError).message);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.section}>
        <Text>thành viên 2 kiểm thử</Text>
        <Text>{user ? 'Đã có phiên đăng nhập' : isForgotPassword ? 'Khôi phục mật khẩu' : isRegistering ? 'Đăng ký' : 'Đăng nhập'}</Text>
        {isInitializing && <Text>Đang kiểm tra phiên…</Text>}
        {user ? (
          <>
            <Text selectable>Email: {user.email ?? '(không có email)'}</Text>
            <Text selectable>UID: {user.id}</Text>
            <ProfileTest userId={user.id} />
            <Button title="Đăng xuất" disabled={busy} onPress={() => { void logout(); }} />
          </>
        ) : (
          <>
            <TextInput
              accessibilityLabel="Email"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!busy}
              style={styles.input}
            />
            {!isForgotPassword && <TextInput
              accessibilityLabel="Mật khẩu"
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              style={styles.input}
            />}
            {isRegistering && (
              <TextInput
                accessibilityLabel="Nhập lại mật khẩu"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
                style={styles.input}
              />
            )}
            <Button title={isForgotPassword ? 'Gửi email đặt lại mật khẩu' : isRegistering ? 'Đăng ký' : 'Đăng nhập'} disabled={busy} onPress={() => { void submit(); }} />
            {!isRegistering && !isForgotPassword && <Button title="Quên mật khẩu?" disabled={busy} onPress={() => {
              setIsForgotPassword(true);
              clearError();
              setMessage('');
              setPassword('');
              setConfirmPassword('');
            }} />}
            <Button title={isRegistering || isForgotPassword ? 'Quay lại đăng nhập' : 'Tạo tài khoản'} disabled={busy} onPress={() => {
              setIsRegistering(isForgotPassword ? false : !isRegistering);
              setIsForgotPassword(false);
              clearError();
              setMessage('');
              setPassword('');
              setConfirmPassword('');
            }} />
          </>
        )}
        {(isSigningIn || isSigningUp || isSigningOut || isSendingPasswordReset) && <Text>Đang gửi yêu cầu…</Text>}
        <Text accessibilityLiveRegion="polite">{message || error?.message || ''}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  input: { borderWidth: 1, padding: 10 },
});
