import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,      // 30 seconds
      gcTime: 5 * 60_000,     // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    // Hydrate auth state from AsyncStorage on boot
    loadFromStorage();
  }, []);

  return <AppNavigator />;
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
