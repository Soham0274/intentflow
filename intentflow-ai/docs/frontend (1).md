# IntentFlow AI — React Native Frontend Implementation Guide

> **8-Screen Dark/Light Theme Implementation with ThemeContext**
> Stack: React Native (Expo), React Navigation v6, Reanimated 2, SVG

---

## Table of Contents

1. [Project Setup & Dependencies](#0-project-setup--dependencies)
2. [ThemeContext & Global Tokens](#1-themecontext--global-design-tokens)
3. [Reusable Shared Components](#2-reusable-shared-components)
4. [Screen 1 — Voice Listening / Main Interface](#3-screen-1--voice-listening--main-interface)
5. [Screen 2 — Profile & Preferences](#4-screen-2--profile--preferences)
6. [Screen 3 — Connection Error / System Offline](#5-screen-3--connection-error--system-offline)
7. [Screen 4 — Edit Reminder](#6-screen-4--edit-reminder)
8. [Screen 5 — Confirm Reminder](#7-screen-5--confirm-reminder)
9. [Screen 6 — Ambiguity Resolution](#8-screen-6--ambiguity-resolution)
10. [Screen 7 — Alerts & Notification Settings](#9-screen-7--alerts--notification-settings)
11. [Screen 8 — Collections / Home Dashboard](#10-screen-8--collections--home-dashboard)
12. [Navigation Setup](#11-navigation-setup)
13. [File Structure](#12-file-structure)

---

## 0. Project Setup & Dependencies

```bash
npx create-expo-app IntentFlowAI --template blank-typescript
cd IntentFlowAI

# Core navigation
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Animations
npx expo install react-native-reanimated react-native-gesture-handler

# SVG & Icons
npx expo install react-native-svg
npm install @expo/vector-icons

# Linear gradients
npx expo install expo-linear-gradient

# Blur effects
npx expo install expo-blur

# Haptics
npx expo install expo-haptics

# Async storage
npx expo install @react-native-async-storage/async-storage
```

### `babel.config.js` — Enable Reanimated
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

---

## 1. ThemeContext & Global Design Tokens

### `src/theme/colors.ts`

```typescript
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
```

---

### `src/theme/typography.ts`

```typescript
// Uses Expo Google Fonts — add to app.json and install:
// npx expo install @expo-google-fonts/syne @expo-google-fonts/dm-sans

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
```

---

### `src/theme/ThemeContext.tsx`

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, ColorScheme } from './colors';
import { Typography } from './typography';

type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  mode:      ThemeMode;
  colors:    ColorScheme;
  typography: typeof Typography;
  toggleTheme: () => void;
  isDark:    boolean;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    AsyncStorage.setItem('themeMode', next);
  };

  return (
    <ThemeContext.Provider value={{
      mode,
      colors:     mode === 'dark' ? DarkColors : LightColors,
      typography: Typography,
      toggleTheme,
      isDark:     mode === 'dark',
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

---

## 2. Reusable Shared Components

### `src/components/StatusPill.tsx`

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type PillVariant = 'online' | 'offline' | 'analyzing' | 'actionReady' | 'listening';

interface StatusPillProps {
  variant: PillVariant;
  label?:  string;
}

const PILL_CONFIG: Record<PillVariant, { dot: string; bg: string; text: string; label: string }> = {
  online:      { dot: '#10B981', bg: 'rgba(16,185,129,0.15)',  text: '#10B981', label: 'System Online'    },
  offline:     { dot: '#EF4444', bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', label: 'SYSTEM OFFLINE'   },
  analyzing:   { dot: '#14B8A6', bg: 'rgba(20,184,166,0.15)',  text: '#14B8A6', label: 'System Analyzing' },
  actionReady: { dot: '#10B981', bg: 'rgba(16,185,129,0.15)',  text: '#10B981', label: 'Action Ready'     },
  listening:   { dot: '#14B8A6', bg: 'rgba(20,184,166,0.12)',  text: '#14B8A6', label: 'Listening'        },
};

export const StatusPill: React.FC<StatusPillProps> = ({ variant, label }) => {
  const cfg = PILL_CONFIG[variant];
  const { typography } = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg, borderColor: `${cfg.dot}30` }]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[typography.statusSM, { color: cfg.text }]}>
        {label ?? cfg.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 12,
    paddingVertical:    6,
    borderRadius:   20,
    borderWidth:    1,
    gap: 6,
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: 4,
  },
});
```

---

### `src/components/BottomNavBar.tsx`

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const NAV_ITEMS = [
  { name: 'Home',        icon: 'home-outline',     activeIcon: 'home',        route: 'Collections'   },
  { name: 'Collections', icon: 'grid-outline',     activeIcon: 'grid',        route: 'Collections'   },
  { name: 'Add',         icon: 'add',              activeIcon: 'add',         route: 'VoiceListening'},
  { name: 'Calendar',   icon: 'calendar-outline',  activeIcon: 'calendar',    route: 'EditReminder'  },
  { name: 'Profile',    icon: 'person-outline',    activeIcon: 'person',      route: 'Profile'       },
] as const;

export const BottomNavBar: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();

  return (
    <BlurView
      intensity={isDark ? 60 : 80}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.blurWrapper, { borderTopColor: colors.border }]}
    >
      <View style={styles.row}>
        {NAV_ITEMS.map((item, idx) => {
          const isCenter = idx === 2;
          const isActive = route.name === item.route;

          if (isCenter) {
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.fab, { backgroundColor: colors.purple }]}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={28} color="#FFF" />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={22}
                color={isActive ? colors.navActive : colors.navInactive}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurWrapper: {
    position:       'absolute',
    bottom:         0,
    left:           0,
    right:          0,
    borderTopWidth: 1,
    paddingBottom:  Platform.OS === 'ios' ? 20 : 8,
    paddingTop:     10,
  },
  row: {
    flexDirection:  'row',
    justifyContent: 'space-around',
    alignItems:     'center',
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  fab: {
    width:        56,
    height:       56,
    borderRadius: 28,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom:   12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius:  12,
    elevation: 8,
  },
});
```

---

### `src/components/ConfidenceBadge.tsx`

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ConfidenceBadgeProps {
  value: number; // 0–100
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ value }) => {
  const { colors, typography } = useTheme();
  const color = value >= 85 ? colors.teal : value >= 60 ? colors.orange : colors.error;

  return (
    <View style={[styles.badge, { backgroundColor: `${color}25`, borderColor: `${color}40` }]}>
      <Text style={[typography.statusSM, { color, fontSize: 9 }]}>{value}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical:   3,
    borderRadius:      10,
    borderWidth:       1,
  },
});
```

---

### `src/components/ThemedToggle.tsx`

```tsx
import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ThemedToggleProps {
  value:    boolean;
  onChange: (val: boolean) => void;
}

export const ThemedToggle: React.FC<ThemedToggleProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(value ? 20 : 2)).current;
  const bgAnim    = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: value ? 20 : 2, useNativeDriver: true, damping: 15 }),
      Animated.timing(bgAnim,    { toValue: value ? 1 : 0,  useNativeDriver: false, duration: 200 }),
    ]).start();
  }, [value]);

  const bgColor = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.toggleOff, colors.toggleOn],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(!value); }}
    >
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width:        48,
    height:       28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  thumb: {
    width:        22,
    height:       22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius:  3,
    elevation: 3,
  },
});
```

---

## 3. Screen 1 — Voice Listening / Main Interface

**File:** `src/screens/VoiceListeningScreen.tsx`

**Purpose:** Primary NLP input screen. Shows live voice transcription, entity parsing indicators with confidence scores, and the glowing mic button.

### Component Breakdown
- `TopBar` — hamburger menu + StatusPill + avatar
- `TranscriptDisplay` — large bold text fade-in per word
- `ParsingPanel` — scrollable card with Entity/Action/Trigger rows
- `WaveformVisualizer` — animated SVG bar chart
- `MicButton` — glowing purple pulsing FAB
- `VoiceModeBar` — bottom input bar (keyboard toggle)

```tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { BottomNavBar } from '../components/BottomNavBar';
import Svg, { Rect } from 'react-native-svg';

// ─── Waveform ──────────────────────────────────────────────────────────────
const WaveformVisualizer: React.FC<{ active: boolean }> = ({ active }) => {
  const { colors } = useTheme();
  const heights = [14, 22, 32, 18, 26, 36, 22, 16, 28, 20, 34, 18];
  const anims = useRef(heights.map(h => new Animated.Value(h))).current;

  useEffect(() => {
    if (!active) return;
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue:  Math.random() * 36 + 8,
            duration: 300 + i * 40,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue:  heights[i],
            duration: 300 + i * 40,
            useNativeDriver: false,
          }),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, [active]);

  return (
    <View style={styles.waveRow}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width:        4,
            height:       anim,
            borderRadius: 2,
            backgroundColor: i % 3 === 0 ? colors.purple : colors.teal,
            opacity:      0.6 + (i % 3) * 0.15,
            marginHorizontal: 2,
          }}
        />
      ))}
    </View>
  );
};

// ─── Parsing Row ───────────────────────────────────────────────────────────
interface ParseRowProps {
  label:  string;
  value:  string;
  confidence?: number;
  tag?:   string;
  tagColor?: string;
}

const ParseRow: React.FC<ParseRowProps> = ({ label, value, confidence, tag, tagColor }) => {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.parseRow}>
      <Text style={[typography.labelMD, { color: colors.textMuted, width: 72 }]}>{label}</Text>
      <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>{value}</Text>
      {confidence !== undefined && <ConfidenceBadge value={confidence} />}
      {tag && (
        <View style={[styles.tagBadge, { backgroundColor: tagColor ?? colors.purpleDim }]}>
          <Text style={[typography.statusSM, { color: tagColor ? '#FFF' : colors.purple, fontSize: 8 }]}>{tag}</Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────
export const VoiceListeningScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const [isListening, setIsListening] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const transcript = 'Remind me to follow up with Arjun after the ';
  const fadedPart  = '3pm call';

  // Mic pulse glow
  useEffect(() => {
    if (!isListening) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [isListening]);

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.menuBtn}>
          <Ionicons name="menu" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <StatusPill variant="online" />
        <View style={s.avatar}>
          <Text style={[typography.bodyBold, { color: '#FFF' }]}>A</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Listening Label */}
        <View style={s.listeningLabel}>
          <MaterialCommunityIcons name="microphone-outline" size={14} color={colors.teal} />
          <Text style={[typography.statusLG, { color: colors.teal, marginLeft: 6 }]}>Listening</Text>
        </View>

        {/* Transcript */}
        <Text style={[typography.headingLG, { color: colors.textPrimary, marginBottom: 4, lineHeight: 40 }]}>
          {transcript}
          <Text style={{ color: colors.textMuted }}>{fadedPart}</Text>
        </Text>

        {/* Parsing Panel */}
        <View style={s.parsingCard}>
          <View style={s.parsingHeader}>
            <Text style={[typography.statusSM, { color: colors.teal }]}>Parsing Intent...</Text>
          </View>
          <View style={s.divider} />
          <ParseRow label="Entity"   value="Arjun"     confidence={98} />
          <ParseRow label="Action"   value="Follow up" confidence={95} />
          <ParseRow label="Trigger"  value="After 15:00..." tag="calc" tagColor={colors.orange} />
        </View>

        <WaveformVisualizer active={isListening} />
      </ScrollView>

      {/* Bottom Voice Bar */}
      <View style={s.voiceBar}>
        <View style={s.voiceBarLeft}>
          <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Listening</Text>
          <Text style={[typography.statusSM, { color: colors.teal, marginTop: 2 }]}>Voice Mode Active</Text>
        </View>
        <TouchableOpacity style={s.kbBtn}>
          <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Pulsing Mic FAB */}
        <View style={s.micContainer}>
          <Animated.View style={[s.micGlow, { transform: [{ scale: pulseAnim }], backgroundColor: colors.purpleDim }]} />
          <TouchableOpacity
            style={[s.micBtn, { backgroundColor: colors.purple }]}
            onPress={() => setIsListening(p => !p)}
            activeOpacity={0.85}
          >
            <Ionicons name="mic" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <BottomNavBar />
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const makeStyles = (c: ReturnType<typeof import('../theme/colors').DarkColors extends infer T ? () => T : never>) =>
  StyleSheet.create({
    root:          { flex: 1, backgroundColor: c.bg },
    topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    menuBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center' },
    avatar:        { width: 40, height: 40, borderRadius: 20, backgroundColor: c.teal, alignItems: 'center', justifyContent: 'center' },
    body:          { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 160 },
    listeningLabel:{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    parsingCard:   { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginTop: 24 },
    parsingHeader: { marginBottom: 12 },
    divider:       { height: 1, backgroundColor: c.border, marginBottom: 12 },
    parseRow:      { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    tagBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    waveRow:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 32, height: 48 },
    voiceBar:      { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: c.bgCardAlt, borderRadius: 20, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    voiceBarLeft:  { flex: 1 },
    kbBtn:         { marginRight: 12 },
    micContainer:  { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 56, height: 56 },
    micGlow:       { position: 'absolute', width: 56, height: 56, borderRadius: 28 },
    micBtn:        { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
  });
```

---

## 4. Screen 2 — Profile & Preferences

**File:** `src/screens/ProfileScreen.tsx`

**Purpose:** User identity, voice settings, connected calendar/CRM integrations, recent intents history.

### Component Breakdown
- `ProfileHeader` — avatar circle with teal gradient ring, name, email
- `PreferencesSection` — labelled card group (Voice Sensitivity, Auto-Confirm)
- `ConnectedEcosystemSection` — integration rows with status badges
- `RecentIntentsSection` — horizontal scroll of past voice commands

```tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ThemedToggle } from '../components/ThemedToggle';
import { useNavigation } from '@react-navigation/native';

// Integration row
interface IntegrationRowProps {
  icon:    React.ReactNode;
  name:    string;
  sub:     string;
  status:  'connected' | 'disconnected';
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({ icon, name, sub, status }) => {
  const { colors, typography } = useTheme();
  return (
    <View style={[iStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[iStyles.iconBox, { backgroundColor: colors.bgCardAlt }]}>{icon}</View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={[typography.bodySM, { color: colors.textMuted }]}>{sub}</Text>
      </View>
      {status === 'connected' ? (
        <View style={[iStyles.activeBadge, { backgroundColor: colors.successDim }]}>
          <Text style={[typography.statusSM, { color: colors.success }]}>ACTIVE</Text>
        </View>
      ) : (
        <TouchableOpacity>
          <Text style={[typography.bodyBold, { color: colors.purple }]}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const iStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  iconBox:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────
export const ProfileScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const navigation = useNavigation();
  const [voiceSensitivity, setVoiceSensitivity] = useState(true);
  const [autoConfirm, setAutoConfirm]           = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={pStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={pStyles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[typography.headingSM, { color: colors.textPrimary }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar */}
        <View style={pStyles.avatarSection}>
          <View style={[pStyles.avatarRing, { borderColor: colors.teal }]}>
            <View style={[pStyles.avatarInner, { backgroundColor: colors.bgCard }]}>
              <Text style={[typography.headingMD, { color: colors.textPrimary }]}>A</Text>
            </View>
          </View>
          <Text style={[typography.headingSM, { color: colors.textPrimary, marginTop: 12 }]}>Arjun Mehta</Text>
          <Text style={[typography.bodyMD, { color: colors.textMuted, marginTop: 4 }]}>arjun.m@intentflow.ai</Text>
        </View>

        {/* Section Label */}
        <Text style={[typography.labelMD, { color: colors.textMuted, paddingHorizontal: 24, marginBottom: 8 }]}>
          Assistant Preferences
        </Text>

        {/* Preferences Card */}
        <View style={[pStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={pStyles.prefRow}>
            <View style={[pStyles.prefIcon, { backgroundColor: colors.purpleDim }]}>
              <MaterialCommunityIcons name="microphone" size={18} color={colors.purple} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Voice Sensitivity</Text>
            </View>
            <Text style={[typography.bodyMD, { color: colors.teal, marginRight: 10 }]}>High</Text>
            <ThemedToggle value={voiceSensitivity} onChange={setVoiceSensitivity} />
          </View>
          <View style={[pStyles.rowDivider, { backgroundColor: colors.border }]} />
          <View style={pStyles.prefRow}>
            <View style={[pStyles.prefIcon, { backgroundColor: colors.tealDim }]}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.teal} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Auto-Confirm Intent</Text>
            </View>
            <ThemedToggle value={autoConfirm} onChange={setAutoConfirm} />
          </View>
        </View>

        {/* Connected Ecosystem */}
        <Text style={[typography.labelMD, { color: colors.textMuted, paddingHorizontal: 24, marginTop: 24, marginBottom: 8 }]}>
          Connected Ecosystem
        </Text>

        <View style={[pStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <IntegrationRow
            icon={<Ionicons name="calendar" size={20} color="#4285F4" />}
            name="Google Calendar"
            sub="Primary workspace"
            status="connected"
          />
          <IntegrationRow
            icon={<Ionicons name="calendar-outline" size={20} color={colors.textMuted} />}
            name="Outlook Calendar"
            sub="Not connected"
            status="disconnected"
          />
        </View>

        {/* Recent Intents */}
        <View style={pStyles.recentHeader}>
          <Text style={[typography.labelMD, { color: colors.textMuted }]}>Recent Intents</Text>
          <TouchableOpacity>
            <Text style={[typography.bodyMD, { color: colors.purple }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={[pStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[typography.bodyMD, { color: colors.textSecondary }]}>
            "Follow up with Arjun after the 3pm call..."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const pStyles = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarRing:    { width: 90, height: 90, borderRadius: 45, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatarInner:   { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  card:          { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 4 },
  prefRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  prefIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowDivider:    { height: 1, marginVertical: 0 },
  recentHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 24, marginBottom: 8 },
});
```

---

## 5. Screen 3 — Connection Error / System Offline

**File:** `src/screens/ConnectionErrorScreen.tsx`

**Purpose:** Full-screen error state with red accent treatment, error code display, and reconnect CTA.

### Component Breakdown
- `ErrorHeader` — SYSTEM OFFLINE pill + menu icon
- `ErrorHero` — large CONNECTION LOST label + headline text
- `ErrorCodeCard` — protocol error + error code string
- `BottomBar` — "Service Unavailable" left + "Reconnect" button right

```tsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';

export const ConnectionErrorScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Subtle shake on mount to indicate error
  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  4, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  // Error tint overlay
  const bgGradientStart = colors.isDark ?? true ? '#1A0A0A' : '#FFF5F5';

  return (
    <SafeAreaView style={[eStyles.root, { backgroundColor: colors.bg }]}>
      {/* Subtle red gradient overlay */}
      <View style={[eStyles.redTint, { backgroundColor: colors.errorDim }]} pointerEvents="none" />

      {/* Top Bar */}
      <View style={eStyles.topBar}>
        <TouchableOpacity style={[eStyles.menuBtn, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="menu" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <StatusPill variant="offline" />
        <View style={[eStyles.avatar, { backgroundColor: colors.bgCard }]}>
          <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>A</Text>
        </View>
      </View>

      {/* Error Content */}
      <View style={eStyles.body}>
        {/* CONNECTION LOST label */}
        <View style={eStyles.errorLabel}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={[typography.statusLG, { color: colors.error, marginLeft: 8 }]}>Connection Lost</Text>
        </View>

        {/* Headline */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Text style={[typography.headingLG, { color: colors.textPrimary, marginTop: 16, marginBottom: 0 }]}>
            Unable to reach the processing engine.{' '}
            <Text style={{ color: colors.textMuted }}>
              Check your network connection and try again.
            </Text>
          </Text>
        </Animated.View>

        {/* Error Code Card */}
        <View style={[eStyles.errorCard, { backgroundColor: colors.bgCard, borderColor: colors.errorDim }]}>
          <View style={eStyles.errorCardRow}>
            <View style={[eStyles.triangleIcon, { borderBottomColor: colors.error }]} />
            <View>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Protocol Error 408</Text>
              <Text style={[typography.statusSM, { color: colors.textMuted, marginTop: 2 }]}>
                TIMED_OUT_WAITING_FOR_RESPONSE
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Bar */}
      <View style={[eStyles.bottomBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border }]}>
        <View>
          <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>Service Unavailable</Text>
          <Text style={[typography.statusSM, { color: colors.error, marginTop: 2 }]}>Sync Interrupted</Text>
        </View>
        <TouchableOpacity
          style={[eStyles.reconnectBtn, { backgroundColor: colors.error }]}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={[typography.bodyBold, { color: '#FFF' }]}>Reconnect</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const eStyles = StyleSheet.create({
  root:          { flex: 1 },
  redTint:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06 },
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  menuBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatar:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body:          { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  errorLabel:    { flexDirection: 'row', alignItems: 'center' },
  errorCard:     { marginTop: 32, borderRadius: 16, borderWidth: 1, padding: 18 },
  errorCardRow:  { flexDirection: 'row', alignItems: 'center' },
  triangleIcon:  { width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginRight: 14 },
  bottomBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  reconnectBtn:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16 },
});
```

---

## 6. Screen 4 — Edit Reminder

**File:** `src/screens/EditReminderScreen.tsx`

**Purpose:** HITL refinement screen. User reviews and edits the NLP-extracted task fields before confirmation.

### Component Breakdown
- `EditHeader` — back button, "INTENT CONFIRMED" + subtitle, Done button
- `SectionTitle` — "Review Details" with subtitle
- `FieldCard` — labelled input rows (Contact, Action Type, Trigger Time, Notes)
- `EntityRow` — avatar + name + change icon for contact field
- `CommandBar` — bottom input + mic + send FAB

```tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';

// Field row wrapper
const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const { colors, typography } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[typography.labelMD, { color: colors.textMuted, marginBottom: 8 }]}>{label}</Text>
      {children}
    </View>
  );
};

export const EditReminderScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const navigation = useNavigation();
  const [notes, setNotes] = useState(
    'Discuss the Q3 roadmap updates and verify the budget allocation for the marketing sprint.'
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={edStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[edStyles.backBtn, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[typography.statusSM, { color: colors.teal }]}>Intent Confirmed</Text>
          <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: 2 }]}>Edit Reminder</Text>
        </View>
        <TouchableOpacity style={[edStyles.doneBtn, { backgroundColor: colors.purple }]}>
          <Text style={[typography.bodyBold, { color: '#FFF' }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={edStyles.body} showsVerticalScrollIndicator={false}>
        <Text style={[typography.headingMD, { color: colors.textPrimary, marginBottom: 4 }]}>Review Details</Text>
        <Text style={[typography.bodyMD, { color: colors.textSecondary, marginBottom: 28 }]}>
          Voice intent parsed successfully. Refine if needed.
        </Text>

        {/* Contact */}
        <FieldGroup label="Contact / Entity">
          <View style={[edStyles.fieldCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[edStyles.contactAvatar, { backgroundColor: colors.tealDim }]}>
              <Text style={[typography.bodyBold, { color: colors.teal }]}>A</Text>
            </View>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1, marginLeft: 12 }]}>Arjun</Text>
            <Ionicons name="person-add-outline" size={18} color={colors.textMuted} />
          </View>
        </FieldGroup>

        {/* Action Type */}
        <FieldGroup label="Action Type">
          <View style={[edStyles.fieldCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="pencil-outline" size={18} color={colors.purple} style={{ marginRight: 12 }} />
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Follow up</Text>
          </View>
        </FieldGroup>

        {/* Trigger Time */}
        <FieldGroup label="Trigger Time">
          <View style={[edStyles.fieldCard, { backgroundColor: colors.bgCard, borderColor: colors.teal + '50' }]}>
            <View style={[edStyles.clockIcon, { borderColor: colors.teal }]}>
              <Ionicons name="time-outline" size={16} color={colors.teal} />
            </View>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginLeft: 12 }]}>
              Today, 15:15 (After 3pm call)
            </Text>
          </View>
        </FieldGroup>

        {/* Notes */}
        <FieldGroup label="Additional Notes">
          <View style={[edStyles.notesCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[typography.bodyMD, { color: colors.textPrimary, lineHeight: 22 }]}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </FieldGroup>
      </ScrollView>

      {/* Command Bar */}
      <View style={[edStyles.commandBar, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
        <View style={[edStyles.dotDeco, { backgroundColor: colors.purple }]} />
        <TextInput
          placeholder="Type a command o..."
          placeholderTextColor={colors.textMuted}
          style={[typography.bodyMD, { color: colors.textPrimary, flex: 1 }]}
        />
        <Ionicons name="mic-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
        <TouchableOpacity style={[edStyles.sendBtn, { backgroundColor: colors.purple }]}>
          <Ionicons name="arrow-up" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const edStyles = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  doneBtn:       { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  body:          { paddingHorizontal: 24, paddingBottom: 100 },
  fieldCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14 },
  contactAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  clockIcon:     { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  notesCard:     { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 90 },
  commandBar:    { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  dotDeco:       { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  sendBtn:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
```

---

## 7. Screen 5 — Confirm Reminder

**File:** `src/screens/ConfirmReminderScreen.tsx`

**Purpose:** Final HITL confirmation gate. Displays a structured summary card with Confirm/Edit options.

### Component Breakdown
- `ActionReadyHeader` — pill + avatar
- `CheckIcon` — rounded teal checkmark box with subtle glow
- `SummaryCard` — labeled Reminder For / Action / Trigger rows with icons
- `ConfirmButton` — full-width purple gradient CTA
- `EditDetailsButton` — secondary ghost button

```tsx
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export const ConfirmReminderScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<any>();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1,   useNativeDriver: true, damping: 12, stiffness: 120 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Bar */}
      <View style={cfStyles.topBar}>
        <View style={{ width: 40 }} />
        <StatusPill variant="actionReady" />
        <View style={[cfStyles.avatar, { backgroundColor: colors.teal }]}>
          <Text style={[typography.bodyBold, { color: '#FFF' }]}>A</Text>
        </View>
      </View>

      <View style={cfStyles.body}>
        {/* Check Icon */}
        <Animated.View style={[cfStyles.checkWrap, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={[cfStyles.checkBox, { backgroundColor: colors.teal + '25', borderColor: colors.teal + '50' }]}>
            <Ionicons name="checkmark" size={28} color={colors.teal} />
          </View>
        </Animated.View>

        <Text style={[typography.headingMD, { color: colors.textPrimary, textAlign: 'center', marginTop: 16 }]}>
          Confirm Reminder?
        </Text>
        <Text style={[typography.bodyMD, { color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 28 }]}>
          Intent successfully extracted
        </Text>

        {/* Summary Card */}
        <View style={[cfStyles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={cfStyles.idRow}>
            <Text style={[typography.statusSM, { color: colors.textMuted }]}>Reminder For</Text>
            <Text style={[typography.statusSM, { color: colors.teal }]}>ID: INT-8821</Text>
          </View>
          <View style={cfStyles.summaryRow}>
            <View style={[cfStyles.rowIconBox, { backgroundColor: colors.bgCardAlt }]}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>A</Text>
            </View>
            <Text style={[typography.headingSM, { color: colors.textPrimary, marginLeft: 14 }]}>Arjun</Text>
          </View>

          <View style={[cfStyles.divider, { backgroundColor: colors.border }]} />

          <Text style={[typography.labelMD, { color: colors.textMuted, marginBottom: 8 }]}>Action</Text>
          <View style={cfStyles.summaryRow}>
            <View style={[cfStyles.rowIconBox, { backgroundColor: colors.purpleDim }]}>
              <Ionicons name="arrow-down" size={16} color={colors.purple} />
            </View>
            <Text style={[typography.headingSM, { color: colors.textPrimary, marginLeft: 14 }]}>Follow up</Text>
          </View>

          <View style={[cfStyles.divider, { backgroundColor: colors.border }]} />

          <Text style={[typography.labelMD, { color: colors.textMuted, marginBottom: 8 }]}>Trigger</Text>
          <View style={cfStyles.summaryRow}>
            <View style={[cfStyles.rowIconBox, { backgroundColor: colors.orangeDim }]}>
              <Ionicons name="time" size={16} color={colors.orange} />
            </View>
            <Text style={[typography.headingSM, { color: colors.textPrimary, marginLeft: 14 }]}>Today, 3:00 PM</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={cfStyles.actions}>
        <TouchableOpacity
          style={[cfStyles.confirmBtn]}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Collections')}
        >
          <LinearGradient
            colors={[colors.purpleLight, colors.purple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={cfStyles.gradBtn}
          >
            <Text style={[typography.bodyBold, { color: '#FFF', fontSize: 16 }]}>Confirm Action</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[cfStyles.editBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => navigation.navigate('EditReminder')}
          activeOpacity={0.85}
        >
          <Text style={[typography.bodyBold, { color: colors.textPrimary, fontSize: 15 }]}>Edit Details</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const cfStyles = StyleSheet.create({
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
  avatar:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body:        { flex: 1, paddingHorizontal: 24, paddingTop: 24, alignItems: 'center' },
  checkWrap:   { alignItems: 'center' },
  checkBox:    { width: 72, height: 72, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 20, marginTop: 8 },
  idRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rowIconBox:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider:     { height: 1, marginVertical: 12 },
  actions:     { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  confirmBtn:  { borderRadius: 18, overflow: 'hidden' },
  gradBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  editBtn:     { borderRadius: 18, borderWidth: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
});
```

---

## 8. Screen 6 — Ambiguity Resolution

**File:** `src/screens/AmbiguityScreen.tsx`

**Purpose:** When NLP detects multiple possible intents, presents ranked options with confidence badges for user selection.

### Component Breakdown
- `AmbiguityHeader` — X dismiss + System Analyzing pill
- `QuestionHeadline` — large text with highlighted entity in teal/quotes
- `ActionCard` — selectable card with icon, title, description, trigger/app tags, confidence badge
- `WaitingBar` — bottom bar with mic input

```tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { useNavigation } from '@react-navigation/native';

interface ActionOption {
  id:          string;
  icon:        keyof typeof Ionicons.glyphMap;
  iconBg:      string;
  iconColor:   string;
  title:       string;
  description: string;
  confidence:  number;
  trigger?:    string;
  app?:        string;
}

const ACTION_OPTIONS: ActionOption[] = [
  {
    id: 'crm',
    icon: 'people-outline',
    iconBg: '#7C3AED25',
    iconColor: '#9D6EFB',
    title: 'CRM Follow-up',
    description: 'Schedule a reminder in Salesforce to call Arjun Singh regarding the Q4 proposal.',
    confidence: 92,
    trigger: '15:00',
    app: 'Salesforce',
  },
  {
    id: 'slack',
    icon: 'chatbubbles-outline',
    iconBg: '#14B8A620',
    iconColor: '#14B8A6',
    title: 'Slack Message',
    description: 'Send a Slack message to Arjun about the follow-up.',
    confidence: 64,
  },
];

export const AmbiguityScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => navigation.navigate('ConfirmReminder'), 300);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Bar */}
      <View style={amStyles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[amStyles.closeBtn, { backgroundColor: colors.bgCard }]}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <StatusPill variant="analyzing" />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={amStyles.body} showsVerticalScrollIndicator={false}>
        {/* Label */}
        <Text style={[typography.statusSM, { color: colors.purple, marginBottom: 12 }]}>Ambiguity Detected</Text>

        {/* Question */}
        <Text style={[typography.headingLG, { color: colors.textPrimary, marginBottom: 8 }]}>
          Which action should I take for{' '}
          <Text style={{ color: colors.teal }}>"Arjun"</Text>?
        </Text>
        <Text style={[typography.bodyMD, { color: colors.textSecondary, marginBottom: 28 }]}>
          I found multiple potential tasks related to your request.
        </Text>

        {/* Action Cards */}
        {ACTION_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          const isFirst    = opt.id === 'crm';
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => handleSelect(opt.id)}
              activeOpacity={0.85}
              style={[
                amStyles.actionCard,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: isSelected ? colors.purple : isFirst ? colors.purple + '60' : colors.border,
                  borderWidth: isSelected || isFirst ? 1.5 : 1,
                  marginBottom: 14,
                },
              ]}
            >
              <View style={amStyles.cardTopRow}>
                <View style={[amStyles.cardIcon, { backgroundColor: opt.iconBg }]}>
                  <Ionicons name={opt.icon} size={20} color={opt.iconColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.bodyBold, { color: isFirst ? colors.purpleLight : colors.textPrimary, fontSize: 16 }]}>
                    {opt.title}
                  </Text>
                </View>
                <ConfidenceBadge value={opt.confidence} />
              </View>

              <Text style={[typography.bodyMD, { color: colors.textSecondary, marginTop: 10, marginBottom: 14 }]}>
                {opt.description}
              </Text>

              {(opt.trigger || opt.app) && (
                <View style={amStyles.tagRow}>
                  {opt.trigger && (
                    <View style={[amStyles.tag, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
                      <Text style={[typography.statusSM, { color: colors.textSecondary }]}>Trigger: {opt.trigger}</Text>
                    </View>
                  )}
                  {opt.app && (
                    <View style={[amStyles.tag, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
                      <Text style={[typography.statusSM, { color: colors.textSecondary }]}>App: {opt.app}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Waiting Bar */}
      <View style={[amStyles.waitingBar, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
        <Text style={[typography.bodyMD, { color: colors.textMuted, flex: 1 }]}>Waiting for selection...</Text>
        <Ionicons name="arrow-back" size={18} color={colors.textMuted} style={{ marginRight: 16 }} />
        <TouchableOpacity style={[amStyles.micSmall, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const amStyles = StyleSheet.create({
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  closeBtn:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  body:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  actionCard: { borderRadius: 18, padding: 16 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  waitingBar: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  micSmall:   { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
```

---

## 9. Screen 7 — Alerts & Notification Settings

**File:** `src/screens/AlertsScreen.tsx`

**Purpose:** Configure AI-driven smart nudges, delivery rules (quiet hours, frequency, weekend mode).

### Component Breakdown
- `AlertsHeader` — back button + title
- `SmartNudgesCard` — featured card with icon, description, toggle
- `DeliveryRulesSection` — labelled group
- `QuietHoursRow` — inline time pickers (10:00 PM → 7:00 AM)
- `FrequencyRow` — value + arrow navigation
- `WeekendModeRow` — toggle with subtitle

```tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ThemedToggle } from '../components/ThemedToggle';
import { useNavigation } from '@react-navigation/native';

const TimeChip: React.FC<{ time: string }> = ({ time }) => {
  const { colors, typography } = useTheme();
  return (
    <TouchableOpacity style={[alStyles.timeChip, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
      <Text style={[typography.bodyBold, { color: colors.purple, fontSize: 16 }]}>{time}</Text>
    </TouchableOpacity>
  );
};

export const AlertsScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const navigation = useNavigation();
  const [smartNudges,  setSmartNudges]  = useState(true);
  const [quietHours,   setQuietHours]   = useState(true);
  const [weekendMode,  setWeekendMode]  = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={alStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[alStyles.backBtn, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[typography.headingSM, { color: colors.textPrimary }]}>Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={alStyles.body} showsVerticalScrollIndicator={false}>
        {/* Smart Nudges Feature Card */}
        <View style={[alStyles.nudgesCard, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
          <View style={alStyles.nudgesTop}>
            <View style={[alStyles.nudgesIcon, { backgroundColor: colors.purpleDim }]}>
              <MaterialCommunityIcons name="auto-fix" size={22} color={colors.purple} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, fontSize: 17 }]}>Smart Nudges</Text>
              <Text style={[typography.bodyMD, { color: colors.textMuted }]}>AI-Optimized Timing</Text>
            </View>
            <ThemedToggle value={smartNudges} onChange={setSmartNudges} />
          </View>
          <Text style={[typography.bodyMD, { color: colors.textSecondary, marginTop: 14, lineHeight: 22 }]}>
            IntentFlow automatically analyzes your daily routines and energy levels to find the perfect moment to deliver notifications.
          </Text>
        </View>

        {/* Delivery Rules */}
        <Text style={[typography.labelMD, { color: colors.textMuted, marginTop: 28, marginBottom: 12 }]}>
          Delivery Rules
        </Text>

        <View style={[alStyles.rulesCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Quiet Hours */}
          <View style={alStyles.ruleRow}>
            <Ionicons name="moon-outline" size={20} color={colors.textSecondary} style={{ marginRight: 14 }} />
            <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>Quiet Hours</Text>
            <ThemedToggle value={quietHours} onChange={setQuietHours} />
          </View>
          {quietHours && (
            <View style={alStyles.timeRow}>
              <TimeChip time="10:00 PM" />
              <Text style={[typography.bodyMD, { color: colors.textMuted, marginHorizontal: 8 }]}>to</Text>
              <TimeChip time="7:00 AM" />
            </View>
          )}

          <View style={[alStyles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Frequency */}
          <TouchableOpacity style={alStyles.ruleRow} activeOpacity={0.7}>
            <Ionicons name="layers-outline" size={20} color={colors.textSecondary} style={{ marginRight: 14 }} />
            <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>Frequency</Text>
            <Text style={[typography.bodyMD, { color: colors.textSecondary, marginRight: 6 }]}>Bundled</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[alStyles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Weekend Mode */}
          <View style={alStyles.ruleRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Weekend Mode</Text>
              <Text style={[typography.bodySM, { color: colors.textMuted }]}>Pause non-urgent tasks</Text>
            </View>
            <ThemedToggle value={weekendMode} onChange={setWeekendMode} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const alStyles = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  body:       { paddingHorizontal: 20, paddingBottom: 60 },
  nudgesCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  nudgesTop:  { flexDirection: 'row', alignItems: 'center' },
  nudgesIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rulesCard:  { borderRadius: 18, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 16 },
  ruleRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  timeRow:    { flexDirection: 'row', alignItems: 'center', paddingBottom: 14, paddingLeft: 34 },
  timeChip:   { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  rowDivider: { height: 1 },
});
```

---

## 10. Screen 8 — Collections / Home Dashboard

**File:** `src/screens/CollectionsScreen.tsx`

**Purpose:** Main dashboard. Browse task collections by Life Area with a swipeable card carousel, search, and Smart Nudges preview strip.

### Component Breakdown
- `DashboardHeader` — status bar, title "Collections", notification bell
- `SearchBar` — search input + filter icon
- `LifeAreasLabel` + `Edit` link
- `LifeAreaCard` — large gradient card with icon, task count badge, title, subtitle
- `SmartNudgesBanner` — bottom floating banner with toggle
- `BottomNavBar` — tabbar

```tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, TextInput, Dimensions, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ThemedToggle } from '../components/ThemedToggle';
import { BottomNavBar } from '../components/BottomNavBar';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.72;

interface LifeAreaData {
  id:         string;
  icon:       keyof typeof Ionicons.glyphMap;
  title:      string;
  subtitle:   string;
  taskCount:  number;
  gradient:   [string, string];
}

const LIFE_AREAS: LifeAreaData[] = [
  { id: 'home',    icon: 'home',         title: 'Home',    subtitle: 'Chores & upkeep',     taskCount: 12, gradient: ['#4338CA', '#6D28D9'] },
  { id: 'work',    icon: 'briefcase',    title: 'Work',    subtitle: 'Projects & tasks',     taskCount: 28, gradient: ['#7C3AED', '#9D6EFB'] },
  { id: 'health',  icon: 'fitness',      title: 'Health',  subtitle: 'Fitness & wellness',  taskCount:  7, gradient: ['#0F9688', '#14B8A6'] },
  { id: 'finance', icon: 'cash-outline', title: 'Finance', subtitle: 'Bills & budgeting',   taskCount:  5, gradient: ['#D97706', '#F59E0B'] },
];

export const CollectionsScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const [nudgesOn, setNudgesOn] = useState(true);
  const [searchQ, setSearchQ]  = useState('');

  const renderCard = ({ item }: { item: LifeAreaData }) => (
    <TouchableOpacity activeOpacity={0.88} style={[coStyles.card, { width: CARD_W }]}>
      <LinearGradient colors={item.gradient} style={coStyles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Icon + Task Badge Row */}
        <View style={coStyles.cardTopRow}>
          <View style={coStyles.cardIconBox}>
            <Ionicons name={item.icon} size={22} color="#FFF" />
          </View>
          <View style={[coStyles.taskBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={[typography.statusSM, { color: '#FFF' }]}>{item.taskCount} Tasks</Text>
          </View>
        </View>

        {/* Title at bottom */}
        <View style={coStyles.cardBottom}>
          <Text style={[typography.headingMD, { color: '#FFF' }]}>{item.title}</Text>
          <Text style={[typography.bodyMD, { color: 'rgba(255,255,255,0.75)' }]}>{item.subtitle}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={coStyles.header}>
        <Text style={[typography.headingLG, { color: colors.textPrimary }]}>Collections</Text>
        <TouchableOpacity style={[coStyles.bellBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          <View style={[coStyles.bellDot, { backgroundColor: colors.purple }]} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[coStyles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder="Search tasks, categories..."
          placeholderTextColor={colors.textMuted}
          style={[typography.bodyMD, { flex: 1, color: colors.textPrimary }]}
        />
        <TouchableOpacity style={[coStyles.filterBtn, { backgroundColor: colors.bgCardAlt }]}>
          <MaterialCommunityIcons name="tune-variant" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Life Areas Header */}
        <View style={coStyles.sectionHeader}>
          <Text style={[typography.headingSM, { color: colors.textPrimary }]}>Life Areas</Text>
          <TouchableOpacity>
            <Text style={[typography.bodyBold, { color: colors.purple }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Card Scroll */}
        <FlatList
          data={LIFE_AREAS}
          horizontal
          keyExtractor={item => item.id}
          renderItem={renderCard}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
          snapToInterval={CARD_W + 14}
          decelerationRate="fast"
          style={{ marginBottom: 24 }}
        />
      </ScrollView>

      {/* Smart Nudges Banner (floating above nav) */}
      <View style={[coStyles.nudgesBanner, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
        <View style={[coStyles.nudgesIconBox, { backgroundColor: colors.purpleDim }]}>
          <MaterialCommunityIcons name="auto-fix" size={16} color={colors.purple} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Smart Nudges</Text>
          <Text style={[typography.bodySM, { color: colors.textMuted }]}>AI determines best time to...</Text>
        </View>
        <ThemedToggle value={nudgesOn} onChange={setNudgesOn} />
      </View>

      <BottomNavBar />
    </SafeAreaView>
  );
};

const coStyles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  bellBtn:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bellDot:      { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  searchBar:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20 },
  filterBtn:    { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  card:         { height: SCREEN_W * 0.85, borderRadius: 24, overflow: 'hidden' },
  cardGradient: { flex: 1, padding: 20, justifyContent: 'space-between' },
  cardTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIconBox:  { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  taskBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  cardBottom:   { gap: 4 },
  nudgesBanner: { position: 'absolute', bottom: 72, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 12 },
  nudgesIconBox:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
```

---

## 11. Navigation Setup

### `src/navigation/AppNavigator.tsx`

```tsx
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';

import { VoiceListeningScreen }   from '../screens/VoiceListeningScreen';
import { ProfileScreen }           from '../screens/ProfileScreen';
import { ConnectionErrorScreen }   from '../screens/ConnectionErrorScreen';
import { EditReminderScreen }      from '../screens/EditReminderScreen';
import { ConfirmReminderScreen }   from '../screens/ConfirmReminderScreen';
import { AmbiguityScreen }         from '../screens/AmbiguityScreen';
import { AlertsScreen }            from '../screens/AlertsScreen';
import { CollectionsScreen }       from '../screens/CollectionsScreen';

export type RootStackParamList = {
  Collections:     undefined;
  VoiceListening:  undefined;
  Profile:         undefined;
  ConnectionError: undefined;
  EditReminder:    undefined;
  ConfirmReminder: undefined;
  Ambiguity:       undefined;
  Alerts:          undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card:       colors.bgCard,
      text:       colors.textPrimary,
      border:     colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Collections"
        screenOptions={{
          headerShown:       false,
          gestureEnabled:    true,
          cardStyle:         { backgroundColor: colors.bg },
          cardOverlayEnabled: true,
          presentation:      'card',
        }}
      >
        <Stack.Screen name="Collections"     component={CollectionsScreen}      />
        <Stack.Screen name="VoiceListening"  component={VoiceListeningScreen}   />
        <Stack.Screen name="Profile"         component={ProfileScreen}           />
        <Stack.Screen name="ConnectionError" component={ConnectionErrorScreen}  />
        <Stack.Screen name="EditReminder"    component={EditReminderScreen}      />
        <Stack.Screen name="ConfirmReminder" component={ConfirmReminderScreen}  />
        <Stack.Screen name="Ambiguity"       component={AmbiguityScreen}        />
        <Stack.Screen name="Alerts"          component={AlertsScreen}           />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

---

### `App.tsx`

```tsx
import React from 'react';
import { useFonts, Syne_600SemiBold, Syne_700Bold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ActivityIndicator, View } from 'react-native';

export default function App() {
  const [fontsLoaded] = useFonts({
    Syne_600SemiBold,
    Syne_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D1A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

---

## 12. File Structure

```
IntentFlowAI/
├── App.tsx
├── babel.config.js
├── app.json
├── src/
│   ├── theme/
│   │   ├── colors.ts           ← DarkColors + LightColors token maps
│   │   ├── typography.ts       ← Syne + DM Sans scale
│   │   └── ThemeContext.tsx    ← useTheme() hook + ThemeProvider
│   │
│   ├── components/
│   │   ├── StatusPill.tsx      ← Reusable pill (online/offline/analyzing/ready)
│   │   ├── BottomNavBar.tsx    ← BlurView nav with FAB center
│   │   ├── ConfidenceBadge.tsx ← Color-coded % badge
│   │   └── ThemedToggle.tsx    ← Animated toggle with haptics
│   │
│   ├── screens/
│   │   ├── VoiceListeningScreen.tsx   ← Screen 1
│   │   ├── ProfileScreen.tsx          ← Screen 2
│   │   ├── ConnectionErrorScreen.tsx  ← Screen 3
│   │   ├── EditReminderScreen.tsx     ← Screen 4
│   │   ├── ConfirmReminderScreen.tsx  ← Screen 5
│   │   ├── AmbiguityScreen.tsx        ← Screen 6
│   │   ├── AlertsScreen.tsx           ← Screen 7
│   │   └── CollectionsScreen.tsx      ← Screen 8
│   │
│   └── navigation/
│       └── AppNavigator.tsx    ← Stack navigator + typed param list
│
└── assets/
    └── fonts/                  ← (Expo Google Fonts handles these automatically)
```

---

## Color Reference Table — Dark ↔ Light

| Token           | Dark Mode    | Light Mode   | Usage                        |
|-----------------|-------------|--------------|------------------------------|
| `bg`            | `#0D0D1A`   | `#F4F4FB`    | Screen background            |
| `bgCard`        | `#13131F`   | `#FFFFFF`    | Card surface                 |
| `bgCardAlt`     | `#1A1A2E`   | `#EFEFFA`    | Elevated / secondary cards   |
| `border`        | `#2A2A3D`   | `#DCDCEE`    | Card/input borders           |
| `purple`        | `#7C3AED`   | `#7C3AED`    | Primary brand accent         |
| `purpleLight`   | `#9D6EFB`   | `#6D28D9`    | Headings, highlights         |
| `teal`          | `#14B8A6`   | `#0F9688`    | Secondary accent, status     |
| `success`       | `#10B981`   | `#059669`    | Active/online states         |
| `error`         | `#EF4444`   | `#DC2626`    | Error states                 |
| `orange`        | `#F59E0B`   | `#D97706`    | Warning / calc tags          |
| `textPrimary`   | `#FFFFFF`   | `#0D0D1A`    | Main text                    |
| `textSecondary` | `#8B8BA7`   | `#5A5A78`    | Secondary text               |
| `textMuted`     | `#4B4B6A`   | `#9898B4`    | Labels, captions             |
| `toggleOn`      | `#7C3AED`   | `#6D28D9`    | Active toggle                |
| `navBg`         | `rgba(13,13,26,0.90)` | `rgba(255,255,255,0.92)` | Bottom nav blur |

---

> **Integration Note for IntentFlow Backend:**  
> Each screen that fires an action (`ConfirmReminderScreen`, `EditReminderScreen`) should call your Railway-hosted Express API at `/api/tasks/hitl-confirm` and `/api/intents` endpoints. The `intent_id` (e.g., `INT-8821`) maps directly to your Supabase `intents` table PK. Pass `status: 'confirmed' | 'edited'` and the updated task payload in the request body.
```
