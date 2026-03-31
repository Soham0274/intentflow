export const Typography = {
  // Syne — headings
  headingXL:  { fontFamily: 'Syne_700Bold',   fontSize: 36, lineHeight: 42 },
  headingLG:  { fontFamily: 'Syne_700Bold',   fontSize: 28, lineHeight: 34 },
  headingMD:  { fontFamily: 'Syne_700Bold',   fontSize: 22, lineHeight: 28 },
  headingSM:  { fontFamily: 'Syne_600SemiBold',fontSize: 18, lineHeight: 24 },

  // DM Sans — body
  bodyLG:     { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 24 },
  bodyMD:     { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 },
  bodySM:     { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16 },
  bodyBold:   { fontFamily: 'DMSans_700Bold',    fontSize: 14, lineHeight: 20 },

  // Status labels — capslock monospace feel
  statusLG:   { fontFamily: 'DMSans_700Bold',    fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase' as const },
  statusSM:   { fontFamily: 'DMSans_500Medium',  fontSize: 10, letterSpacing: 2,   textTransform: 'uppercase' as const },
  labelMD:    { fontFamily: 'DMSans_500Medium',  fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const },
};
