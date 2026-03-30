import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { PhosphorIcon } from '@/components/PhosphorIcon';
import { router } from 'expo-router';

export default function ConfirmScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
    
    // Auto redirect after 3s
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar status="ready" />
      
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { backgroundColor: theme.tealDim }, popStyle]}>
          <PhosphorIcon name="check" size={48} color={theme.teal} />
        </Animated.View>
        
        <Text style={[styles.title, { color: theme.textPrimary }]}>Nodes Updated</Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>Tasks synced correctly.</Text>
        
        <View style={[styles.refBadge, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
          <Text style={[styles.refText, { color: theme.textPrimary }]}>#INT-8492</Text>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    marginBottom: 8,
  },
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    marginBottom: 40,
  },
  refBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  refText: {
    fontFamily: Fonts.mono, // Using regular as fallback
    fontSize: 14,
  },
});
