/**
 * Optional Sentry — safe without native plugin.
 */
export function initialiseSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  try {
    const Sentry = require("@sentry/react-native");
    Sentry.init({ dsn, tracesSampleRate: 0.2 });
  } catch {}
}