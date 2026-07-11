

import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { FullScreenLoader } from '../components/ui/LoadingSpinner';
import { VENDOR_ROLE } from '../types';

export default function Index(): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <FullScreenLoader message="Loading Toureez Vendor..." />;
  }
  if (user !== null && user.role === VENDOR_ROLE) {
    return <Redirect href="/(vendor)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
