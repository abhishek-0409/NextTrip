

export function initialiseSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native') as {
      init?: (options: Record<string, unknown>) => void;
    };
    Sentry.init?.({ dsn, tracesSampleRate: 0.2, enableAutoSessionTracking: true });
  } catch {
    // Continue without Sentry when the optional package/native module is absent.
  }
}
