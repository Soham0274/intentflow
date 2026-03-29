import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing, Shadow, GradientColors } from '@/constants/theme';
import InputField from '@/components/ui/InputField';
import GradientButton from '@/components/ui/GradientButton';
import { supabase } from '@/services/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/' as any);
    }, 1200);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'intentflow://auth/callback',
        },
      });
      if (error) throw error;
      // In a real app we would wait for deep link callback, for MVP mock success
      setTimeout(() => {
        router.replace('/(tabs)/' as any);
      }, 1000);
    } catch (error) {
       console.error('Google Sign In Error', error);
    } finally {
       setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Decorative orb top-left */}
      <View style={styles.decorOrb} />
      <View style={styles.decorOrb2} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your workspace</Text>

            {/* Google Button */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={styles.googleBtn}
              activeOpacity={0.85}
            >
              <View style={styles.googleLogo}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Inputs */}
            <InputField
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.inputGap}
            />
            <InputField
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.inputGap}
            />

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In */}
            <GradientButton
              label="Sign In"
              onPress={handleSignIn}
              loading={loading}
              style={styles.signInBtn}
            />
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Don't have an account?{' '}
            <Text style={styles.footerLink}>Create one free</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  decorOrb: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.brandBlue,
    opacity: 0.08,
  },
  decorOrb2: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.violet,
    opacity: 0.1,
  },
  scroll: {
    paddingHorizontal: Spacing.sm,
    paddingTop: 16,
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.default,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    height: 54,
    borderRadius: Radius.md,
    gap: 10,
    marginBottom: 20,
    ...Shadow.card,
  },
  googleLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.white,
  },
  googleText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.background,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.elevated,
  },
  dividerText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  inputGap: { marginBottom: 12 },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.brandBlue,
  },
  signInBtn: {},
  footer: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  footerLink: {
    fontFamily: Fonts.semiBold,
    color: Colors.brandBlue,
  },
});
