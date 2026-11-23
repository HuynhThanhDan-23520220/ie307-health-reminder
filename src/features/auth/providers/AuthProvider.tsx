import { cancelAllReminders } from '../../reminders/services/reminder-scheduler';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '../../../services/supabase';
import * as authService from '../services/auth.service';
import { isPasswordRecoveryUrl } from '../services/password-recovery';

type AuthOperation = 'signIn' | 'signUp' | 'signOut' | 'requestPasswordReset' | 'recoveryLink' | 'updatePassword';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isInitializing: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isSendingPasswordReset: boolean;
  isHandlingRecoveryLink: boolean;
  isUpdatingPassword: boolean;
  passwordRecovery: 'none' | 'editing' | 'complete';
  error: authService.AuthOperationError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [operation, setOperation] = useState<AuthOperation | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState<'none' | 'editing' | 'complete'>('none');
  const recoveryUserId = useRef<string | null>(null);
  const [error, setError] = useState<authService.AuthOperationError | null>(null);
  const pendingOperation = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    let active = true;
    let sessionChanged = false;
    mounted.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active || (event === 'INITIAL_SESSION' && sessionChanged)) return;
      if (event !== 'INITIAL_SESSION') sessionChanged = true;
      // Keep this callback synchronous to avoid re-entering the SDK's auth lock.
      // [TV4] Đăng xuất → hủy toàn bộ lời nhắc của tài khoản cũ (tình huống 4).
      if (event === 'SIGNED_OUT' && Platform.OS !== 'web') void cancelAllReminders();
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        recoveryUserId.current = nextSession.user.id;
        setPasswordRecovery('editing');
      } else if (!nextSession || (recoveryUserId.current && recoveryUserId.current !== nextSession.user.id)) {
        recoveryUserId.current = null;
        setPasswordRecovery('none');
      }
      setError(null);
      setIsInitializing(false);
    });

    void authService.getSession().then((restoredSession) => {
      if (!active || sessionChanged) return;
      setSession(restoredSession);
      setIsInitializing(false);
    }).catch((restoreError: unknown) => {
      if (!active || sessionChanged) return;
      setError(authService.toAuthOperationError(restoreError));
      setIsInitializing(false);
    });

    const updateAutoRefresh = (state: string | null | undefined) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    const appStateSubscription = Platform.OS !== 'web'
      ? AppState.addEventListener('change', updateAutoRefresh)
      : undefined;
    if (Platform.OS !== 'web') updateAutoRefresh(AppState.currentState);

    return () => {
      active = false;
      mounted.current = false;
      subscription.unsubscribe();
      appStateSubscription?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, []);

  const runOperation = useCallback(async <T,>(
    name: AuthOperation,
    action: () => Promise<T>,
  ) => {
    if (pendingOperation.current) {
      throw new authService.AuthOperationError('operation_in_progress', 'Vui lòng chờ thao tác xác thực hiện tại hoàn tất.');
    }

    pendingOperation.current = true;
    setOperation(name);
    setError(null);
    try {
      // Auth events are the source of session state, including partial sign-out failures.
      return await action();
    } catch (operationError) {
      const authError = authService.toAuthOperationError(operationError);
      if (mounted.current) setError(authError);
      throw authError;
    } finally {
      pendingOperation.current = false;
      if (mounted.current) setOperation(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const seen = new Set<string>();
    const handleUrl = async (url: string | null) => {
      if (!active || !url || !isPasswordRecoveryUrl(url) || seen.has(url)) return;
      seen.add(url);
      try {
        await runOperation('recoveryLink', () => authService.acceptPasswordRecoveryLink(url));
      } catch (linkError) {
        seen.delete(url);
        if (active) setError(authService.toAuthOperationError(linkError));
      }
    };
    const subscription = Linking.addEventListener('url', ({ url }) => { void handleUrl(url); });
    void Linking.getInitialURL().then(handleUrl).catch(() => {
      if (active) setError(new authService.AuthOperationError('link_error', 'Không đọc được liên kết mở ứng dụng. Vui lòng thử mở lại email.'));
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [runOperation]);

  const signIn = useCallback(async (email: string, password: string) => {
    await runOperation('signIn', () => authService.signIn(email, password));
  }, [runOperation]);
  const signUp = useCallback((email: string, password: string) => (
    runOperation('signUp', () => authService.signUp(email, password))
  ), [runOperation]);
  const signOut = useCallback(() => runOperation('signOut', authService.signOut), [runOperation]);
  const requestPasswordReset = useCallback((email: string) => (
    runOperation('requestPasswordReset', () => authService.requestPasswordReset(email))
  ), [runOperation]);
  const updatePassword = useCallback((password: string) => runOperation('updatePassword', async () => {
    if (passwordRecovery !== 'editing' || !session || recoveryUserId.current !== session.user.id) {
      throw new authService.AuthOperationError('recovery_required', 'Vui lòng mở liên kết khôi phục hợp lệ trước khi đổi mật khẩu.');
    }
    const userId = session.user.id;
    await authService.updatePassword(password);
    if (mounted.current && recoveryUserId.current === userId) setPasswordRecovery('complete');
  }), [runOperation, passwordRecovery, session]);
  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isInitializing,
    isSigningIn: operation === 'signIn',
    isSigningUp: operation === 'signUp',
    isSigningOut: operation === 'signOut',
    isSendingPasswordReset: operation === 'requestPasswordReset',
    isHandlingRecoveryLink: operation === 'recoveryLink',
    isUpdatingPassword: operation === 'updatePassword',
    passwordRecovery,
    error,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    clearError,
  }), [session, isInitializing, operation, passwordRecovery, error, signIn, signUp, signOut, requestPasswordReset, updatePassword, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
