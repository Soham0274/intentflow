export const DarkColors = {
  // Backgrounds
  bg:           '#0D0D1A',   // primary deep dark
  bgCard:       '#13131F',   // card surface
  bgCardAlt:    '#1A1A2E',   // elevated card
  bgCardHover:  '#1E1E30',   // pressed state
  bgInput:      '#161622',   // input field background
  bgOverlay:    'rgba(13,13,26,0.85)', // modal overlay

  // Borders
  border:       '#2A2A3D',
  borderActive: '#7C3AED',

  // Accents
  purple:       '#7C3AED',
  purpleLight:  '#9D6EFB',
  purpleDim:    'rgba(124,58,237,0.25)',
  teal:         '#14B8A6',
  tealLight:    '#2DD4BF',
  tealDim:      'rgba(20,184,166,0.20)',
  orange:       '#F59E0B',
  orangeDim:    'rgba(245,158,11,0.20)',

  // Status
  success:      '#10B981',
  successDim:   'rgba(16,185,129,0.20)',
  error:        '#EF4444',
  errorDim:     'rgba(239,68,68,0.18)',
  warning:      '#F97316',

  // Text
  textPrimary:  '#FFFFFF',
  textSecondary:'#8B8BA7',
  textMuted:    '#4B4B6A',
  textAccent:   '#14B8A6',
  textPurple:   '#9D6EFB',
  textError:    '#EF4444',

  // Toggle
  toggleOn:     '#7C3AED',
  toggleOff:    '#2A2A3D',

  // Bottom nav
  navBg:        'rgba(13,13,26,0.90)',
  navActive:    '#7C3AED',
  navInactive:  '#4B4B6A',
};

export const LightColors = {
  // Backgrounds
  bg:           '#F4F4FB',
  bgCard:       '#FFFFFF',
  bgCardAlt:    '#EFEFFA',
  bgCardHover:  '#E8E8F5',
  bgInput:      '#F0F0FA',
  bgOverlay:    'rgba(244,244,251,0.88)',

  // Borders
  border:       '#DCDCEE',
  borderActive: '#7C3AED',

  // Accents — same brand, adjusted for light bg
  purple:       '#7C3AED',
  purpleLight:  '#6D28D9',
  purpleDim:    'rgba(124,58,237,0.12)',
  teal:         '#0F9688',
  tealLight:    '#14B8A6',
  tealDim:      'rgba(15,150,136,0.12)',
  orange:       '#D97706',
  orangeDim:    'rgba(217,119,6,0.15)',

  // Status
  success:      '#059669',
  successDim:   'rgba(5,150,105,0.15)',
  error:        '#DC2626',
  errorDim:     'rgba(220,38,38,0.12)',
  warning:      '#EA580C',

  // Text
  textPrimary:  '#0D0D1A',
  textSecondary:'#5A5A78',
  textMuted:    '#9898B4',
  textAccent:   '#0F9688',
  textPurple:   '#6D28D9',
  textError:    '#DC2626',

  // Toggle
  toggleOn:     '#6D28D9',
  toggleOff:    '#DCDCEE',

  // Bottom nav
  navBg:        'rgba(255,255,255,0.92)',
  navActive:    '#7C3AED',
  navInactive:  '#9898B4',
};

export type ColorScheme = typeof DarkColors;
