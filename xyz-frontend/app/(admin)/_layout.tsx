/**
 * @file app/(admin)/_layout.tsx
 * @description Admin portal root layout.
 *
 * Guards: only users with role === 'admin' may enter this group.
 * All other roles are redirected to their home group by the root _layout.tsx,
 * but we add an explicit guard here as defence-in-depth.
 */

import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== 'admin') {
    // Wrong role — redirect to their correct home group
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
