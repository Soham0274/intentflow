// IntentFlow AI — Typography System
// Display: Syne (700/800, tight tracking)
// Body: DM Sans (400/500)
// Mono: DM Sans fallback (until JetBrains Mono added)

export const Typography = {
  // Syne — headings (tight tracking -0.03em ≈ -0.5 letterSpacing at these sizes)
  headingXXL: { fontFamily: 'Syne_800ExtraBold', fontSize: 36, lineHeight: 42, letterSpacing: -1 },
  headingXL:  { fontFamily: 'Syne_800ExtraBold', fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  headingLG:  { fontFamily: 'Syne_700Bold',      fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  headingMD:  { fontFamily: 'Syne_700Bold',      fontSize: 22, lineHeight: 28, letterSpacing: -0.6 },
  headingSM:  { fontFamily: 'Syne_600SemiBold',  fontSize: 18, lineHeight: 24, letterSpacing: -0.4 },

  // DM Sans — body
  bodyLG:     { fontFamily: 'DMSans_400Regular',  fontSize: 16, lineHeight: 24 },
  bodyMD:     { fontFamily: 'DMSans_400Regular',  fontSize: 14, lineHeight: 20 },
  bodySM:     { fontFamily: 'DMSans_400Regular',  fontSize: 12, lineHeight: 16 },
  bodyBold:   { fontFamily: 'DMSans_700Bold',     fontSize: 14, lineHeight: 20 },
  bodySemiBold: { fontFamily: 'DMSans_500Medium', fontSize: 15, lineHeight: 22 },

  // Section labels — ALL CAPS, wide tracking
  labelMD:    { fontFamily: 'DMSans_500Medium',   fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  labelSM:    { fontFamily: 'DMSans_500Medium',   fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const },

  // Status pills
  statusLG:   { fontFamily: 'DMSans_700Bold',     fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase' as const },
  statusSM:   { fontFamily: 'DMSans_500Medium',   fontSize: 10, letterSpacing: 2,   textTransform: 'uppercase' as const },

  // Mono (fallback until JetBrains Mono)
  mono:       { fontFamily: 'DMSans_500Medium',   fontSize: 11, letterSpacing: 0.5 },
};
