import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LayoutProvider } from './src/theme';
import { AppNavigator } from './src/app/AppNavigator';

/**
 * Entry Point ứng dụng - Khởi tạo bởi TV1 (Bùi Công Danh)
 * Bọc SafeAreaProvider -> LayoutProvider (Responsive Layout) -> AppNavigator
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <LayoutProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </LayoutProvider>
    </SafeAreaProvider>
  );
}
