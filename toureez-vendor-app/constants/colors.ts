
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

  // ── Accent / gold ────────────────────────────────────────────
  accent:           '#C89A35',
  accentDark:       '#A87E28',
  accentLight:      '#FBF5E4',

  // ── Neutral dark ────────────────────────────────────────────
  navy:             '#1F2328',
  navyMedium:       '#3A4149',
  navyLight:        '#68737A',

  // ── Backgrounds ─────────────────────────────────────────────
  background:       '#F7F5F0',
  backgroundWhite:  '#FFFFFF',
  backgroundSoft:   '#EDE9E4',
  surface:          '#FFFFFF',

  // ── Text ────────────────────────────────────────────────────
  text:             '#1F2328',
  textSecondary:    '#3A4149',
  textLight:        '#68737A',
  textWhite:        '#FFFFFF',
  textOrange:       '#C86A3D',
  textBlue:         '#25584B',

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

  // ── Package status ───────────────────────────────────────────
  statusDraft:      '#68737A',
  statusDraftBg:    'rgba(104,115,122,0.10)',
  statusPending:    '#D99A2B',
  statusPendingBg:  'rgba(217,154,43,0.10)',
  statusActive:     '#2E8B57',
  statusActiveBg:   'rgba(46,139,87,0.10)',
  statusRejected:   '#D64C4C',
  statusRejectedBg: 'rgba(214,76,76,0.10)',

  // ── Booking status ───────────────────────────────────────────
  bookingPending:   '#D99A2B',
  bookingConfirmed: '#2E8B57',
  bookingCancelled: '#D64C4C',
  bookingCompleted: '#25584B',

  // ── Shadows / overlays ───────────────────────────────────────
  shadowOrange:     'rgba(37,88,75,0.18)',
  shadowNavy:       'rgba(31,35,40,0.10)',
  shadowDark:       'rgba(0,0,0,0.06)',
  overlay:          'rgba(31,35,40,0.55)',
  overlayLight:     'rgba(31,35,40,0.28)',

  // ── Tab ─────────────────────────────────────────────────────
  tabActive:        '#25584B',
  tabInactive:      '#68737A',
  tabBackground:    '#FFFFFF',

  // ── Misc ─────────────────────────────────────────────────────
  muted:            '#68737A',
  white:            '#FFFFFF',
  transparent:      'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
