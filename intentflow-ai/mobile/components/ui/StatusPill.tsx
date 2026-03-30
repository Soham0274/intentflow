import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';

export function StatusPill({ status, label }: { status: 'online' | 'analyzing' | 'offline', label?: string }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (status === 'offline') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [status]);

  const dotStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const getStatusColor = () => {
    switch (status) {
      case 'online': return theme.teal;
      case 'analyzing': return theme.accent;
      case 'offline': return theme.red;
    }
  };

  const statusLabel = label || (status === 'online' ? 'System Online' : status === 'analyzing' ? 'Analyzing...' : 'System Offline');

  return (
    <View style={[styles.pill, { backgroundColor: theme.pillBg, borderColor: theme.pillBorder }]}>
      <Animated.View style={[styles.dot, dotStyle, { backgroundColor: getStatusColor() }]} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>{statusLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  text: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
});