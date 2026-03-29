import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  style?: ViewStyle;
}

export default function StatCard({
  label,
  value,
  valueColor = Colors.textPrimary,
  style,
}: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.elevated,
    ...Shadow.card,
  },
  value: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    marginBottom: 4,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
