import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolateColor } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface ToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export function Toggle({ value, onValueChange }: ToggleProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const translation = useSharedValue(value ? 24 : 0);

  useEffect(() => {
    translation.value = withSpring(value ? 24 : 0, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => {
    const bg = value ? theme.teal : theme.input;
    return {
      backgroundColor: bg,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translation.value }],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.track, trackStyle, { borderColor: theme.border }]}>
        <Animated.View style={[styles.thumb, thumbStyle, { backgroundColor: theme.surface }]} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    boxShadow: '0px 2px 2px rgba(0,0,0,0.2)',
    elevation: 2,
  },
});