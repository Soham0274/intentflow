import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';

interface AvatarProps {
  initials: string;
  size?: number;
  gradient?: boolean;
  style?: ViewStyle;
}

export function Avatar({ initials, size = 48, gradient = true, style }: AvatarProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  
  const displayLetters = initials?.slice(0, 2).toUpperCase() || 'IF';
  const fontSize = size * 0.35;

  if (gradient) {
    return (
      <View style={[styles.wrapper, style]}>
        <LinearGradient
          colors={[theme.teal, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientOuter, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}
        >
          <View style={[styles.innerCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.card }]}>
            <Text style={[styles.letter, { fontSize, color: theme.text }]}>{displayLetters}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.darkCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.letter, { fontSize, color: theme.text }]}>{displayLetters}</Text>
      </View>
    </View>
  );
}

// Alias for compatibility with existing code
export const AvatarWithColor = Avatar;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  letter: {
    fontFamily: Fonts.bold,
  },
  gradientOuter: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
