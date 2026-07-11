const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Some of the information you entered is invalid. Please check and try again.',
  401: 'You need to log in to continue.',
  403: "You don't have permission to do that.",
  404: 'The item you requested could not be found.',
  409: 'This already exists or conflicts with existing data.',
  422: 'Some fields are invalid or missing. Please check your input and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again in a moment.',
  502: 'Service is temporarily unavailable. Please try again shortly.',
  503: 'Service is temporarily unavailable. Please try again shortly.',
  504: 'The server took too long to respond. Please try again.',
};

const AUTH_PATTERNS: [RegExp, string][] = [
  [/invalid login credentials/i, 'Incorrect email or password. Please try again.'],
  [/email not confirmed/i, 'Please verify your email address before logging in.'],
  [/user already registered/i, 'An account with this email already exists. Try logging in instead.'],
  [/password should be at least/i, 'Password must be at least 6 characters.'],
  [/invalid email/i, 'Please enter a valid email address.'],
  [/email.*invalid/i, 'Please enter a valid email address.'],
  [/token has expired/i, 'Your session has expired. Please log in again.'],
  [/for security purposes/i, 'For security, please wait a moment before trying again.'],
  [/signup_disabled/i, 'New registrations are currently disabled. Please contact support.'],
  [/email.*already.*use/i, 'This email is already registered. Try logging in instead.'],
  [/unable to validate/i, 'Your session could not be verified. Please log in again.'],
  [/network/i, 'Network error. Please check your connection and try again.'],
];

const DB_PATTERNS: [RegExp, string][] = [
  [/duplicate key value/i, 'This already exists. Please use a different value.'],
  [/violates unique constraint/i, 'This already exists. Please use a different value.'],
  [/invalid input syntax/i, 'Invalid data provided. Please check your input.'],
  [/violates not.null constraint/i, 'A required field is missing.'],
  [/violates foreign key constraint/i, 'This item is linked to other data and cannot be removed.'],
  [/value too long/i, 'One of the values you entered is too long.'],
  [/out of range/i, 'A value you entered is out of the allowed range.'],
  [/permission denied/i, "You don't have permission to perform this action."],
];

export function friendlyError(raw: string | null | undefined): string {
  if (!raw) return 'Something went wrong. Please try again.';

  const stripped = raw.replace(/^[a-zA-Z]+:\s*/, '');
  const cleaned = stripped.replace(/^(sign in|sign up|reset password|update password|failed to \w+):\s*/i, '');

  const statusMatch = cleaned.match(/status\s+(\d{3})/i) ?? raw.match(/status\s+(\d{3})/i);
  if (statusMatch) {
    const code = parseInt(statusMatch[1], 10);
    return HTTP_STATUS_MESSAGES[code] ?? 'An unexpected error occurred. Please try again.';
  }

  for (const [pattern, message] of AUTH_PATTERNS) {
    if (pattern.test(cleaned) || pattern.test(raw)) return message;
  }

  for (const [pattern, message] of DB_PATTERNS) {
    if (pattern.test(cleaned) || pattern.test(raw)) return message;
  }

  if (cleaned.length <= 120 && !/\b(constraint|syntax|uuid|sql|pg_|oid|wal)\b/i.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return 'Something went wrong. Please try again.';
}

export function friendlyThrown(err: unknown): string {
  if (err instanceof Error) return friendlyError(err.message);
  if (typeof err === 'string') return friendlyError(err);
  return 'Something went wrong. Please try again.';
}
