

import { logger } from './utils/logger';

interface EnvCheck {
  key: string;

  reason: string;
}

const REQUIRED_ALWAYS: EnvCheck[] = [
  { key: 'SUPABASE_URL', reason: 'Supabase client cannot initialise without it' },
  { key: 'SUPABASE_ANON_KEY', reason: 'Supabase client cannot initialise without it' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', reason: 'Supabase admin client cannot initialise without it' },
];

const REQUIRED_PRODUCTION: EnvCheck[] = [
  { key: 'RAZORPAY_KEY_ID', reason: 'real payments will fail at checkout time with no warning otherwise' },
  { key: 'RAZORPAY_KEY_SECRET', reason: 'real payments will fail at checkout time with no warning otherwise' },
  { key: 'ALLOWED_ORIGINS', reason: 'without it, browser-based clients (e.g. the marketing site) are silently rejected by CORS' },
];

const isMissing = (key: string): boolean => {
  const value = process.env[key];
  return value === undefined || value.trim() === '';
};

export function runStartupChecks(): void {
  const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';

  const missingAlways = REQUIRED_ALWAYS.filter((check) => isMissing(check.key));
  const missingProduction = isProduction
    ? REQUIRED_PRODUCTION.filter((check) => isMissing(check.key))
    : [];

  const missing = [...missingAlways, ...missingProduction];

  if (missing.length > 0) {
    for (const check of missing) {
      logger.fatal({ key: check.key }, `Missing required env var ${check.key} — ${check.reason}`);
    }
    logger.fatal(
      { missing: missing.map((m) => m.key) },
      'Startup checks failed — refusing to start with an incomplete configuration.',
    );
    process.exit(1);
  }

  // ── Known footguns: don't hard-fail, but make them impossible to miss ──────

  if (isProduction && process.env.ENABLE_MOCK_PAYMENT === 'true') {
    logger.warn(
      'ENABLE_MOCK_PAYMENT=true in a production environment — the /bookings/confirm-mock ' +
      'endpoint will accept fake payments. Only intended for soft-launch testing; ' +
      'unset this variable once real Razorpay payments are verified working.',
    );
  }

  if (isProduction && isMissing('SENTRY_DSN')) {
    logger.warn('SENTRY_DSN not set in production — errors will only be visible in process logs.');
  }

  if (!isProduction) {
    logger.info('Running with NODE_ENV != production — CORS allows all origins and mock payments are unrestricted.');
  }

  logger.info({ env: process.env.NODE_ENV ?? 'development' }, 'Startup checks passed.');
}
