import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LayoutProvider } from './src/theme';
import { AuthProvider } from './src/features/auth/providers/AuthProvider';
import { AuthTestScreen } from './src/features/auth/screens/AuthTestScreen';

/**
 * Entry Point ứng dụng - Khởi tạo bởi TV1 (Bùi Công Danh)
 * thành viên 2 kiểm thử
 * Tạm hiển thị AuthTestScreen để kiểm thử Supabase trước khi tích hợp AppNavigator.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <LayoutProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          {/* thành viên 2 kiểm thử */}
          <AuthTestScreen />
        </AuthProvider>
      </LayoutProvider>
    </SafeAreaProvider>
  );
}
