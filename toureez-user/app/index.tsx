

import React from 'react';
import { Redirect } from 'expo-router';
import { getHomeRouteForRole, useAuthStore } from '../store/authStore';
import { FullScreenLoader } from '../components/ui/LoadingSpinner';


export default function Index(): React.ReactElement {
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  // Session check still in progress — show loader, do not redirect yet
  if (isLoading) {
    return <FullScreenLoader />;
  }

  // Session resolved — route to the correct group
  if (user) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  return <Redirect href="/(auth)/login" />;
}
