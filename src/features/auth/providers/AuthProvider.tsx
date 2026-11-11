import { createContext, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabase';
import * as authService from '../services/auth.service';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isInitializing: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  error: authService.AuthOperationError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [operation, setOperation] = useState<'signIn' | 'signUp' | 'signOut' | null>(null);
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
      setSession(nextSession);
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
    name: 'signIn' | 'signUp' | 'signOut',
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

  const signIn = useCallback(async (email: string, password: string) => {
    await runOperation('signIn', () => authService.signIn(email, password));
  }, [runOperation]);
  const signUp = useCallback((email: string, password: string) => (
    runOperation('signUp', () => authService.signUp(email, password))
  ), [runOperation]);
  const signOut = useCallback(() => runOperation('signOut', authService.signOut), [runOperation]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    isInitializing,
    isSigningIn: operation === 'signIn',
    isSigningUp: operation === 'signUp',
    isSigningOut: operation === 'signOut',
    error,
    signIn,
    signUp,
    signOut,
  }), [session, isInitializing, operation, error, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
