
export const Colors = {
  // ── Primary brand (forest green) ────────────────────────────
  primary:          '#25584B',
  primaryDark:      '#1B463B',
  primaryLight:     '#EAF2EF',
  primaryUltraLight:'#F4FAF8',

  // ── Accent (terracotta) ──────────────────────────────────────
  secondary:        '#C86A3D',
  secondaryDark:    '#A8552F',
  secondaryLight:   '#FAF0EB',

  // ── Gold / accent ────────────────────────────────────────────
  accent:           '#C89A35',
  accentLight:      '#FBF5E4',

  // ── Purple (kept for admin moderation badges) ─────────────────
  purple:           '#7C5CBA',
  purpleLight:      'rgba(124,92,186,0.10)',

  // ── Neutral dark ────────────────────────────────────────────
  navy:             '#1F2328',
  navyLight:        '#3A4149',

  // ── Backgrounds ─────────────────────────────────────────────
  background:       '#F7F5F0',
  backgroundSoft:   '#EDE9E4',
  backgroundWhite:  '#FFFFFF',

  // ── Surfaces ────────────────────────────────────────────────
  surface:          '#FFFFFF',
  surfaceRaised:    '#F7F5F0',

  // ── Text ────────────────────────────────────────────────────
  text:             '#1F2328',
  textSecondary:    '#3A4149',
  textLight:        '#68737A',
  textWhite:        '#FFFFFF',

  // ── Borders ─────────────────────────────────────────────────
  border:           '#DDD7CF',
  borderLight:      '#EDE9E4',
  divider:          '#EDE9E4',

  // ── Semantic ────────────────────────────────────────────────
  star:             '#C89A35',
  error:            '#D64C4C',
  errorLight:       'rgba(214,76,76,0.10)',
  success:          '#2E8B57',
  successLight:     'rgba(46,139,87,0.10)',
  warning:          '#D99A2B',
  warningLight:     'rgba(217,154,43,0.10)',
  info:             '#25584B',
  infoLight:        '#EAF2EF',

  // ── Overlays ─────────────────────────────────────────────────
  overlay:          'rgba(31,35,40,0.55)',
  overlayLight:     'rgba(31,35,40,0.28)',
} as const;

export type ColorKey = keyof typeof Colors;
