/**
 * @file app/_layout.tsx
 * Root layout — bootstraps Supabase auth listener, TanStack Query, and routes
 * the user to the correct screen based on their role.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, SplashScreen, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { getMyProfile } from '../lib/api/auth';
import { useAuthStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AuthBootstrap(): null {
  const { setSession, setLoading, clearUser } = useAuthStore();

  useEffect(() => {
    // Restore session on cold start
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await getMyProfile();
        if (profile?.role === 'admin') {
          setSession(profile, session);
          router.replace('/(admin)');
        } else {
          // Has a session but not admin — sign out and show login
          await supabase.auth.signOut();
          clearUser();
          router.replace('/(auth)/login');
        }
      } else {
        router.replace('/(auth)/login');
      }
      setLoading(false);
      void SplashScreen.hideAsync();
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearUser();
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

export default function RootLayout(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </QueryClientProvider>
  );
}
