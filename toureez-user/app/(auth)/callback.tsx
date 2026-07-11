

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function OAuthCallbackScreen(): React.ReactElement {
  // The auth guard in _layout.tsx handles navigation once the session resolves.
  // This screen just shows a spinner so there's no flash of blank content.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundBase ?? '#FFF8F0',
  },
});
