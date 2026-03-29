import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { Priority } from '@/types/index';

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
}

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: Colors.danger },
  high: { label: 'High', color: Colors.warning },
  medium: { label: 'Medium', color: Colors.brandBlue },
  low: { label: 'Low', color: Colors.success },
};

export default function PriorityBadge({ priority, showLabel = true }: PriorityBadgeProps) {
  const { label, color } = PRIORITY_META[priority];

  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {showLabel && (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
