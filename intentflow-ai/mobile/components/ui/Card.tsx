import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  selected?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function Card({ children, style, onPress, selected = false }: CardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const cardStyle = [
    styles.card,
    { backgroundColor: theme.card, borderColor: theme.border },
    selected && { borderColor: theme.accent, backgroundColor: 'rgba(59,130,246,0.10)', boxShadow: '0px 4px 12px rgba(59,130,246,0.3)', elevation: 6 },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedTouchableOpacity
        onPress={onPress}
        onPressIn={() => (scale.value = withTiming(0.98, { duration: 150 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
        activeOpacity={0.9}
        style={[cardStyle, animatedStyle]}
      >
        {children}
      </AnimatedTouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
});