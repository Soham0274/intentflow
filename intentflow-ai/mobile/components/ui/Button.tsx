import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

interface ButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function GradientButton({ label, onPress, style, icon }: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.97, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      style={[styles.container, style, animatedStyle]}
    >
      <LinearGradient
        colors={[theme.accent, theme.accent2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {icon}
        <Text style={[styles.label, { color: '#FFF' }]}>{label}</Text>
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
}

export function OutlineButton({ label, onPress, style, icon }: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.97, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      style={[
        styles.container,
        { backgroundColor: theme.cardAlt, borderColor: theme.borderActive, borderWidth: 1, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
        style,
        animatedStyle,
      ]}
    >
      {icon}
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    shadowColor: 'rgba(124, 111, 255, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  gradient: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    marginLeft: 8,
  },
});
