export const Colors = {
  // Dark Theme (Source of Truth)
  bgBase: '#0A0B0F',
  bgSurface: '#0F1118',
  bgCard: '#12141A',
  bgCardAlt: '#1A1D26',
  bgInput: '#1C1F2E',
  border: 'rgba(255,255,255,0.06)',
  borderActive: 'rgba(255,255,255,0.14)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A8C0',
  textMuted: '#5A6280',
  accent: '#6C63FF',
  accent2: '#4A3FF7',
  teal: '#00C896',
  tealDim: 'rgba(0,200,150,0.15)',
  red: '#FF4D4D',
  redDim: 'rgba(255,77,77,0.15)',
  green: '#00C896',
  amber: '#FF8C42',
  pillBg: 'rgba(255,255,255,0.06)',
  pillBorder: 'rgba(255,255,255,0.10)',
  
  // Legacy compatibility and semantic aliases
  background: '#0A0B0F',
  surface: '#0F1118',
  elevated: '#1A1D26',
  white: '#FFFFFF',
  brandBlue: '#6C63FF',
  violet: '#6C63FF',
  success: '#00C896',
  warning: '#FF8C42',
  danger: '#FF4D4D',
  
  priority: {
    urgent: '#FF4D4D',
    high: '#FF8C42',
    medium: '#6C63FF',
    low: '#00C896',
  },
} as const;

export const LightColors = {
  ...Colors,
};

export const Fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  extraBold: 'DMSans_800ExtraBold',
  display: 'Syne_600SemiBold',
  displayBold: 'Syne_700Bold',
  displayExtra: 'Syne_800ExtraBold',
  mono: 'DMSans_500Medium', // fallback
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
    boxShadow: '0px 4px 12px rgba(0,0,0,0.3)',
    elevation: 8,
  },
  card: {
    boxShadow: '0px 2px 8px rgba(0,0,0,0.2)',
    elevation: 4,
  },
  glow: {
    boxShadow: '0px 0px 16px rgba(108,99,255,0.4)',
    elevation: 8,
  },
} as const;

export const GradientColors = {
  brand: ['#4A3FF7', '#6C63FF'] as string[],
  teal: ['#00C896', '#00A89A'] as string[],
  success: ['#00C896', '#059669'] as string[],
  danger: ['#FF4D4D', '#DC2626'] as string[],
  avatar: ['#00C896', '#6C63FF'] as string[],
  focus: ['#1A1D2E', '#12141A'] as string[],
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