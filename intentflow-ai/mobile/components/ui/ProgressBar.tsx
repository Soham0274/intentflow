import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0–100
  color?: string;
  height?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  color = Colors.brandBlue,
  height = 6,
  showLabel = true,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{clamped}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.pill,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    minWidth: 32,
    textAlign: 'right',
  },
});
