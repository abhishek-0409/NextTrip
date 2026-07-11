import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export function useScreenBack(): () => void {
  const { from } = useLocalSearchParams<{ from?: string }>();

  return useCallback(() => {
    if (from === 'account') {
      router.replace('/(vendor)/account');
    } else if (from === 'dashboard') {
      router.replace('/(vendor)');
    } else {
      router.back();
    }
  }, [from]);
}
