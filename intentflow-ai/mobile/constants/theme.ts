export const Colors = {
  // Dark Theme (Source of Truth)
  bgBase: '#08090E',
  bgSurface: '#111318',
  bgCard: '#171A23',
  bgCardAlt: '#1D2030',
  bgInput: '#1A1D28',
  border: 'rgba(255,255,255,0.07)',
  borderActive: 'rgba(255,255,255,0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#6B7080',
  textMuted: '#3D4258',
  accent: '#7C6FFF',
  accent2: '#5A4FE8',
  teal: '#00E5C9',
  tealDim: 'rgba(0,229,201,0.15)',
  red: '#FF4455',
  redDim: 'rgba(255,68,85,0.12)',
  green: '#00C896',
  amber: '#F5A623',
  pillBg: 'rgba(255,255,255,0.06)',
  pillBorder: 'rgba(255,255,255,0.10)',
  
  // Legacy compatibility
  background: '#08090E',
  surface: '#111318',
  elevated: '#171A23',
  white: '#FFFFFF',
  brandBlue: '#7C6FFF',
  violet: '#7C6FFF',
  success: '#00C896',
  warning: '#F5A623',
  danger: '#FF4455',
  
  priority: {
    urgent: '#FF4455',
    high: '#F5A623',
    medium: '#7C6FFF',
    low: '#00E5C9',
  },
} as const;

export const LightColors = {
  bgBase: '#F0F1F7',
  bgSurface: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardAlt: '#F4F5FA',
  bgInput: '#EAEBF4',
  border: 'rgba(0,0,0,0.07)',
  textPrimary: '#0D0F1A',
  textSecondary: '#6B7080',
  accent: '#6C5FEF',
  teal: '#00A89A',
  red: '#E83548',
};

export const Fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  extraBold: 'DMSans_800ExtraBold',
  display: 'Syne_600SemiBold',
  displayBold: 'Syne_700Bold',
  displayExtra: 'Syne_800ExtraBold',
  mono: 'DMSans_400Regular', // fallback
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
  pill: 9999,
} as const;

export const Shadow = {
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: '#7C6FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const GradientColors = {
  brand: ['#7C6FFF', '#5A4FE8'] as string[],
  teal: ['#00E5C9', '#00A89A'] as string[],
  success: ['#00C896', '#059669'] as string[],
  danger: ['#FF4455', '#DC2626'] as string[],
  avatar: ['#00E5C9', '#7C6FFF'] as string[],
  focus: ['#1E3A5F', '#1E1B4B'] as string[],
};

export const Animation = {
  slideUp: {
    duration: 300,
    translateY: 12,
  },
  fadeIn: {
    duration: 200,
  },
  pulseMic: {
    duration: 1500,
  },
  blinkDot: {
    duration: 1000,
  },
  barWave: {
    duration: 600,
  },
  checkPop: {
    duration: 400,
    scale: [0.5, 1.1, 1],
  },
};