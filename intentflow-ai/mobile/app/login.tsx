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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing, Shadow } from '@/constants/theme';
import InputField from '@/components/ui/InputField';
import { supabase } from '@/services/supabase';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (isSignUp && (!firstName || !lastName)) {
      setErrorMsg('Please enter your first and last name.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });
        if (error) throw error;
        
        // If Supabase has email confirmations enabled, no session is granted upon sign up.
        if (data.user && !data.session) {
          setSuccessMsg('Success! Check your email for the confirmation link to sign in.');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      // AuthContext will automatically redirect to home on successful session acquisition
    } catch (e: any) {
      setErrorMsg(e.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'intentflow://auth/callback',
        },
      });
      if (error) throw error;
      // Note: for mobile OAuth, the actual deep link handles the session swap.
      // Assuming mock success for local demo if deep links aren't connected yet:
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 1000);
    } catch (error) {
       console.error('Google Sign In Error', error);
       setErrorMsg('Google login failed.');
    } finally {
       setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Decorative gradient background touches */}
      <View style={styles.blurCircleTop} />
      
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Access your AI workspace</Text>
            </View>

            {/* Pill Toggle Container */}
            <View style={styles.pillContainer}>
              <TouchableOpacity 
                style={[styles.pillBtn, !isSignUp && styles.pillActive]}
                onPress={() => {
                  setIsSignUp(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, !isSignUp && styles.pillTextActive]}>Sign In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.pillBtn, isSignUp && styles.pillActive]}
                onPress={() => {
                  setIsSignUp(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, isSignUp && styles.pillTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs Container */}
            <View style={styles.formArea}>
              {isSignUp && (
                <View style={styles.row}>
                  <InputField
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    icon={<Feather name="user" size={18} color="#666" />}
                    style={{ flex: 1, marginRight: 8, marginBottom: 12 }}
                  />
                  <InputField
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    icon={<Feather name="user" size={18} color="#666" />}
                    style={{ flex: 1, marginBottom: 12 }}
                  />
                </View>
              )}
              
              <InputField
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon={<Feather name="mail" size={18} color="#666" />}
                style={styles.inputGap}
              />
              
              <InputField
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon={<Feather name="lock" size={18} color="#666" />}
              />

              {/* Status Messages */}
              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
              {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

              {/* Forgot Password */}
              {!isSignUp && (
                <TouchableOpacity style={styles.forgotRow}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {/* Primary Launch Action */}
              <TouchableOpacity 
                style={[styles.launchBtn, (loading) && styles.launchDisabled]}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.launchText}>
                  {loading ? 'Working...' : isSignUp ? 'Create Workspace' : 'Launch Session'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Outer Link */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={styles.googleBtn}
              activeOpacity={0.85}
            >
              <View style={styles.googleLogoContainer}>
                <Text style={styles.googleIconLetter}>G</Text>
              </View>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Deep dark backdrop
    justifyContent: 'center',
  },
  blurCircleTop: {
    position: 'absolute',
    top: -150,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#2A1A3A',
    opacity: 0.3,
  },
  scroll: {
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#161618',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#262628',
    marginHorizontal: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 10,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#999',
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0E',
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E1E1F',
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  pillActive: {
    backgroundColor: '#2A2A2C',
  },
  pillText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#888',
  },
  pillTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  formArea: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
  inputGap: { 
    marginBottom: 12 
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 6,
  },
  forgotText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#888',
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#ef4444',
    marginTop: 10,
  },
  successText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#10b981',
    marginTop: 10,
  },
  launchBtn: {
    backgroundColor: '#303033',
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#404044',
  },
  launchDisabled: {
    opacity: 0.6,
  },
  launchText: {
    fontFamily: Fonts.bold,
    color: Colors.white,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#262628',
  },
  dividerText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#555',
    letterSpacing: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#303033',
    height: 52,
    borderRadius: Radius.lg,
    gap: 12,
  },
  googleLogoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconLetter: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.white,
  },
  googleText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#DDD',
  },
});
