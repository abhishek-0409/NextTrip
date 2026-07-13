

import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

let reloadAsync: (() => Promise<void>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Updates = require('expo-updates') as { reloadAsync: () => Promise<void> };
  reloadAsync = Updates.reloadAsync;
} catch {
  // expo-updates not present (Expo Go) — Restart App button is hidden.
}

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (__DEV__) {
      // In production, forward to your error monitoring service (Sentry etc.)
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Uncaught render error:', error);
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  private handleTryAgain = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleRestart = (): void => {
    if (reloadAsync) {
      void reloadAsync();
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error } = this.state;
    const message = error?.message ?? 'An unexpected error occurred.';
    const showStack = __DEV__ && error?.stack != null;

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          <Text style={styles.heading}>Something went wrong</Text>
          <Text style={styles.subheading}>
            Toureez ran into an unexpected problem. Your data is safe.
          </Text>

          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Error details</Text>
            <Text style={styles.messageText} selectable>
              {message}
            </Text>
          </View>

          {showStack && (
            <View style={styles.stackBox}>
              <Text style={styles.stackText} selectable>
                {error.stack}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={this.handleTryAgain}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Try rendering the screen again"
            >
              <Text style={styles.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>

            {reloadAsync !== null && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={this.handleRestart}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Fully restart the application"
              >
                <Text style={styles.secondaryBtnText}>Restart App</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5F0' },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(214,76,76,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: { fontSize: 32 },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2328',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#3A4149',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 320,
  },
  messageBox: {
    width: '100%',
    backgroundColor: 'rgba(214,76,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(214,76,76,0.20)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D64C4C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13,
    color: '#D64C4C',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    lineHeight: 18,
  },
  stackBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD7CF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    maxHeight: 180,
  },
  stackText: {
    fontSize: 10,
    color: '#68737A',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    lineHeight: 15,
  },
  actions: { width: '100%', gap: 12, marginTop: 8 },
  primaryBtn: {
    backgroundColor: '#25584B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    backgroundColor: '#EAF2EF',
    borderWidth: 1,
    borderColor: '#25584B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#25584B', fontWeight: '700', fontSize: 15 },
});
