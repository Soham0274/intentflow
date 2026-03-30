import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

interface AvatarGroupProps {
  initials: string[];
  size?: number;
  max?: number;
}

export function AvatarGroup({ initials, size = 28, max = 3 }: AvatarGroupProps) {
  const visible = initials.slice(0, max);
  const extra = initials.length - max;
  const colors = [Colors.brandBlue, Colors.violet, Colors.success, Colors.warning];

  return (
    <View style={styles.group}>
      {visible.map((init, i) => (
        <View
          key={i}
          style={[
            styles.groupItem,
            {
              marginLeft: i === 0 ? 0 : -size * 0.35,
              zIndex: visible.length - i,
            },
          ]}
        >
          <Avatar initials={init} size={size} color={colors[i % colors.length]} />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.extraCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.35,
            },
          ]}
        >
          <Text style={[styles.extraText, { fontSize: size * 0.3 }]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

interface AvatarProps {
  initials: string;
  size?: number;
  color?: string;
  showOnlineDot?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  initials,
  size = 40,
  color = Colors.brandBlue,
  showOnlineDot = false,
  style,
}: AvatarProps) {
  const fontSize = size * 0.36;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + '33',
            borderColor: color + '66',
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize, color }]}>
          {initials.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      {showOnlineDot && (
        <View
          style={[
            styles.onlineDot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  initials: {
    fontFamily: Fonts.bold,
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {},
  extraCircle: {
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extraText: {
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
});