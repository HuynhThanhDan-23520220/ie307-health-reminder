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
  const { user } = useAuth();
  // Remount the form on account changes to discard old credentials and query results.
  return <AuthTestForm key={user?.id ?? 'signed-out'} />;
}

function AuthTestForm() {
  const { user, isInitializing, isSigningIn, isSigningUp, isSigningOut, error, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const busy = isInitializing || isSigningIn || isSigningUp || isSigningOut;

  async function submit() {
    setMessage('');
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
        <Text>{user ? 'Đã có phiên đăng nhập' : isRegistering ? 'Đăng ký' : 'Đăng nhập'}</Text>
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
            <TextInput
              accessibilityLabel="Mật khẩu"
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              style={styles.input}
            />
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
            <Button title={isRegistering ? 'Đăng ký' : 'Đăng nhập'} disabled={busy} onPress={() => { void submit(); }} />
            <Button title={isRegistering ? 'Quay lại đăng nhập' : 'Tạo tài khoản'} disabled={busy} onPress={() => {
              setIsRegistering(!isRegistering);
              setMessage('');
              setPassword('');
              setConfirmPassword('');
            }} />
          </>
        )}
        {(isSigningIn || isSigningUp || isSigningOut) && <Text>Đang gửi yêu cầu…</Text>}
        <Text accessibilityLiveRegion="polite">{message || error?.message || ''}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  input: { borderWidth: 1, padding: 10 },
});
