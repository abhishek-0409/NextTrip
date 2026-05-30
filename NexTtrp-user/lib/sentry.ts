/**
 * @file lib/sentry.ts
 * @description Optional Sentry error monitoring.
 * Wrapped in try/catch so the app never crashes if the native Sentry
 * module is not linked (no @sentry/react-native plugin in app.json).
 * Set EXPO_PUBLIC_SENTRY_DSN in eas.json to enable.
 */

export function initialiseSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
    Sentry.init({ dsn, tracesSampleRate: 0.2 });
  } catch {
    // Sentry native module not available — continue without it
  }
}
