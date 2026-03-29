import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  height?: number;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function OutlineButton({
  label,
  onPress,
  height = 52,
  color = Colors.brandBlue,
  disabled = false,
  style,
}: OutlineButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        { height, borderColor: color, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
