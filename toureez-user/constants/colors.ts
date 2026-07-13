
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

  // ── Neutral dark (headings) ──────────────────────────────────
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
  success:          '#2E8B57',
  warning:          '#D99A2B',

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

  // ── Compatibility aliases ────────────────────────────────────
  backgroundBase:   '#F7F5F0',
  backgroundDeep:   '#EDE9E4',
  backgroundLayer1: '#FFFFFF',
  backgroundLayer2: '#F7F5F0',
  backgroundLayer3: '#EDE9E4',
  backgroundSecondary: '#FFFFFF',
  surfacePrimary:   '#FFFFFF',
  surfaceElevated:  '#FFFFFF',
  surfaceElevated1: '#FFFFFF',
  surfaceElevated2: '#F7F5F0',
  surfacePressed:   '#EAF2EF',
  surfaceBorder:    '#DDD7CF',
  surfaceBorderStrong: '#DDD7CF',
  surfaceBorderDim: '#EDE9E4',
  glassPrimary:     '#FFFFFF',
  glassSecondary:   '#F7F5F0',
  glassTertiary:    '#EDE9E4',
  glassHighlight:   '#FFFFFF',
  glassBorder:      '#DDD7CF',
  glassBorderBright:'#DDD7CF',
  glassBorderDim:   '#EDE9E4',
  primaryDeep:      '#1B463B',
  primaryGlow:      '#EAF2EF',
  primaryGlowStrong:'rgba(37,88,75,0.18)',
  accentViolet:     '#25584B',
  accentGold:       '#C89A35',
  accentGlow:       '#FBF5E4',
  gold:             '#C89A35',
  goldGlow:         '#FBF5E4',
  textPrimary:      '#1F2328',
  textTertiary:     '#68737A',
  textOnPrimary:    '#FFFFFF',
  textGlow:         '#25584B',
  textInverse:      '#FFFFFF',
  muted:            '#68737A',
  white:            '#FFFFFF',
  errorLight:       '#FEE2E2',
  errorGlow:        'rgba(214,76,76,0.10)',
  successLight:     '#D1FAE5',
  warningLight:     '#FEF3C7',
  info:             '#25584B',
  infoLight:        '#EAF2EF',
  wishlistActive:   '#D64C4C',
  wishlistInactive: '#68737A',
  tabBarActive:     '#25584B',
  tabBarInactive:   '#68737A',
  tabBarBackground: '#FFFFFF',
  shadow:           'rgba(31,35,40,0.10)',
  shadowCard:       'rgba(31,35,40,0.08)',
  shadowTeal:       'rgba(37,88,75,0.15)',
  overlayGlass:     'rgba(31,35,40,0.55)',
  transparent:      'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
