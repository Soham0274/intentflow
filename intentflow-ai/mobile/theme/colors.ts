// IntentFlow AI — Global Design Token System
// Aesthetic: Dark futuristic command center meets consumer-grade polish

export const DarkColors = {
  // ─── Backgrounds ────────────────────────────────────────────────────────
  bg:           '#0A0B0F',           // near-black with faint navy undertone
  bgSurface:    '#0F1118',           // slightly elevated surface
  bgCard:       '#12141A',           // dark charcoal with slight blue warmth
  bgCardAlt:    '#1A1D26',           // elevated surface
  bgCardHover:  '#1E2130',           // pressed / hover state
  bgInput:      '#1C1F2E',           // input field background
  bgOverlay:    'rgba(10,11,15,0.85)', // modal overlay

  // ─── Borders ────────────────────────────────────────────────────────────
  border:       'rgba(255,255,255,0.06)',  // subtle border
  borderActive: 'rgba(255,255,255,0.14)', // active border
  borderAccent: 'rgba(108,99,255,0.40)',  // violet accent border

  // ─── Primary Accent — Electric Violet-Indigo ────────────────────────────
  purple:       '#6C63FF',
  purpleLight:  '#8B83FF',
  purpleDim:    'rgba(108,99,255,0.15)',
  purpleGlow:   'rgba(108,99,255,0.35)',

  // Legacy aliases (blue → violet migration)
  blue:         '#6C63FF',
  blueLight:    '#8B83FF',
  blueDim:      'rgba(108,99,255,0.15)',

  // ─── Secondary Accent — Teal-Mint ──────────────────────────────────────
  teal:         '#00C896',
  tealLight:    '#00E5AD',
  tealDim:      'rgba(0,200,150,0.15)',

  // ─── Semantic Colors ───────────────────────────────────────────────────
  orange:       '#FF8C42',
  orangeDim:    'rgba(255,140,66,0.15)',
  success:      '#00C896',
  successDim:   'rgba(0,200,150,0.15)',
  error:        '#FF4D4D',
  errorDim:     'rgba(255,77,77,0.15)',
  warning:      '#FF8C42',
  warningDim:   'rgba(255,140,66,0.15)',

  // ─── Text Hierarchy ───────────────────────────────────────────────────
  textPrimary:   '#FFFFFF',
  textSecondary: '#A0A8C0',         // cool grey-blue
  textMuted:     '#5A6280',         // tertiary
  textDisabled:  '#3A3F55',
  textAccent:    '#6C63FF',
  textPurple:    '#6C63FF',
  textError:     '#FF4D4D',

  // ─── Toggle ────────────────────────────────────────────────────────────
  toggleOn:     '#6C63FF',
  toggleOff:    '#2A2D3A',

  // ─── Bottom Nav ────────────────────────────────────────────────────────
  navBg:        '#1A1D2E',
  navActive:    '#FFFFFF',
  navInactive:  '#5A6280',
};

export const LightColors = {
  ...DarkColors,
};

export type ColorScheme = typeof DarkColors;
