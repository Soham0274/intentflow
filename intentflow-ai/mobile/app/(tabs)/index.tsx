import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { PhosphorIcon } from '@/components/PhosphorIcon';

const NUM_BARS = 7;

function WaveBar({ index, theme }: { index: number, theme: any }) {
  const scaleY = useSharedValue(0.3);

  useEffect(() => {
    // Staggered wave animation
    scaleY.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View style={[styles.bar, { backgroundColor: theme.accent }, animatedStyle]} />
  );
}

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar 
        status="online" 
        leftIcon={<PhosphorIcon name="user" size={24} color={theme.textPrimary} />} 
      />
      
      <View style={styles.content}>
        <View style={styles.waveContainer}>
          {Array.from({ length: NUM_BARS }).map((_, i) => (
            <WaveBar key={i} index={i} theme={theme} />
          ))}
        </View>
        <Text style={[styles.prompt, { color: theme.textSecondary }]}>How can I help you today?</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100, // Offset for bottom nav
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 120, // max height
    marginBottom: 48,
  },
  bar: {
    width: 12,
    height: 120,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  prompt: {
    fontFamily: Fonts.display,
    fontSize: 28,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});