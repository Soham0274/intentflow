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
