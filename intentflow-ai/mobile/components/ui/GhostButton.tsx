import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

interface GhostButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  fontSize?: number;
  style?: ViewStyle;
}

export default function GhostButton({
  label,
  onPress,
  color = Colors.danger,
  fontSize = 15,
  style,
}: GhostButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.button, style]}
    >
      <Text style={[styles.label, { color, fontSize }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.medium,
    letterSpacing: 0.2,
  },
});
