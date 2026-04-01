import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, GradientColors, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    // Pulse orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
      {/* Background glow */}
      <View style={styles.bgGlow} />
      <View style={styles.bgGlowTeal} />

      <Animated.View style={[styles.topSection, { opacity: fadeAnim }]}>
        {/* App name */}
        <Text style={styles.appName}>IntentFlow AI</Text>
        <Text style={styles.tagline}>Build with Intent.{'\n'}Execute with Intelligence.</Text>

        {/* Animated orb */}
        <View style={styles.orbContainer}>
          {/* Glow halo */}
          <Animated.View
            style={[styles.orbGlow, { opacity: glowAnim, transform: [{ scale: pulseAnim }] }]}
          />
          {/* Core orb */}
          <Animated.View
            style={[styles.orbWrapper, { transform: [{ scale: pulseAnim }] }]}
          >
            <LinearGradient
              colors={GradientColors.brand as [string, string]}
              style={styles.orb}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          {/* Inner sparkle */}
          <View style={styles.orbInner} />
        </View>
      </Animated.View>

      {/* Bottom CTAs */}
      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => router.push('/login' as any)}
          activeOpacity={0.9}
          style={styles.ctaWrapper}
        >
          <LinearGradient
            colors={GradientColors.brand as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.signInLink}>
            Already have an account?{' '}
            <Text style={styles.signInLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const ORB_SIZE = 130;
const GLOW_SIZE = 200;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bgGlow: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.brandBlue,
    opacity: 0.08,
  },
  bgGlowTeal: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00E5C9',
    opacity: 0.04,
  },
  topSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontFamily: Fonts.bold,
    fontSize: 34,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 56,
  },
  orbContainer: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: Colors.violet,
    opacity: 0.4,
  },
  orbWrapper: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 16,
  },
  orb: {
    width: '100%',
    height: '100%',
  },
  orbInner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    top: GLOW_SIZE / 2 - 48,
    left: GLOW_SIZE / 2 - 24,
  },
  bottomSection: {
    width: '100%',
    gap: 16,
  },
  ctaWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  ctaButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  ctaText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  signInLink: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  signInLinkBold: {
    fontFamily: Fonts.bold,
    color: Colors.brandBlue,
  },
});
