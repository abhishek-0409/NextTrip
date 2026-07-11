

import React from 'react';
import { Stack } from 'expo-router';

export default function BookingLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="[packageId]" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="detail/[id]" />
      <Stack.Screen name="pay-balance/[id]" />
      <Stack.Screen
        name="confirmation"
        options={{
          // Prevent going back to payment after confirmation
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
