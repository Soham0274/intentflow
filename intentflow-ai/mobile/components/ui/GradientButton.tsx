import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, GradientColors } from '@/constants/theme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  height?: number;
  gradient?: string[];
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function GradientButton({
  label,
  onPress,
  height = 56,
  gradient = GradientColors.brand,
  disabled = false,
  loading = false,
  style,
}: GradientButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.wrapper, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { height }]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
