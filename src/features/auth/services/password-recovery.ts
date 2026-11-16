import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export function clearPasswordRecoveryUrl(value: string) {
  if (Platform.OS !== 'web') return;
  // Keep browser-only types local: this project also compiles for React Native.
  const browserWindow = (globalThis as typeof globalThis & {
    window?: {
      location: { href: string; pathname: string };
      history: { state: unknown; replaceState: (state: unknown, title: string, url: string) => void };
    };
  }).window;
  if (!browserWindow) return;
  // Do not replace a different page if navigation happened during the exchange.
  if (browserWindow.location.href !== new URL(value).href) return;
  try {
    browserWindow.history.replaceState(browserWindow.history.state, '', browserWindow.location.pathname);
  } catch {
    // URL cleanup must not turn a successful session exchange into an auth error.
  }
}

// Works with the installed app scheme and with the current Expo web origin.
export function getPasswordRecoveryRedirectUrl() {
  return Linking.createURL('auth/reset-password');
}

export function isPasswordRecoveryUrl(value: string) {
  try {
    const incoming = new URL(value);
    const expected = new URL(getPasswordRecoveryRedirectUrl());
    return incoming.protocol === expected.protocol
      && incoming.host === expected.host
      && incoming.pathname === expected.pathname
      && !incoming.username && !incoming.password;
  } catch {
    return false;
  }
}
