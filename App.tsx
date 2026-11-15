import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LayoutProvider } from './src/theme';
import { AuthProvider } from './src/features/auth/providers/AuthProvider';
import { useAuth } from './src/features/auth/hooks/useAuth';
import { AuthTestScreen } from './src/features/auth/screens/AuthTestScreen';
import { AppNavigator } from './src/app/AppNavigator';

function Root() {
  const { session, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!session) return <AuthTestScreen />;
  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LayoutProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Root />
        </AuthProvider>
      </LayoutProvider>
    </SafeAreaProvider>
  );
}