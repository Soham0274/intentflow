import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { supabase } from '@/services/supabase';
import { signInWithGoogle } from '@/services/googleAuth';

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";

type Mode = "signin" | "create";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const slideAnim = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  const switchMode = (m: Mode) => {
    Haptics.selectionAsync();
    slideAnim.value = withTiming(m === "signin" ? 0 : 1, { duration: 200 });
    setMode(m);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleAuth = async () => {
    if (!email || !password || (mode === "create" && (!firstName || !lastName))) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (mode === "create") {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { first_name: firstName, last_name: lastName } }
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setSuccessMsg("Check your email for confirmation.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Navigation will be handled by AuthContext in _layout.tsx
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const { error, session } = await signInWithGoogle();
      
      if (error) {
        console.error('[Login] Google sign-in error:', error);
        setErrorMsg(error.message || 'Google login failed');
      } else if (session) {
        console.log('[Login] Google sign-in successful');
        // Navigation is handled by AuthContext in _layout.tsx
      }
    } catch (err: any) {
      console.error('[Login] Unexpected error during Google sign-in:', err);
      setErrorMsg(err?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 40, paddingBottom: bottomPad + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="zap" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.logoText, { color: colors.foreground }]}>
              IntentFlow
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {mode === "signin" ? "Access your AI workspace" : "Join the AI revolution"}
            </Text>

            <View style={[styles.tabRow, { backgroundColor: colors.secondary }]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  mode === "signin" && {
                    backgroundColor: colors.foreground,
                  },
                ]}
                onPress={() => switchMode("signin")}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        mode === "signin"
                          ? colors.background
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  mode === "create" && {
                    backgroundColor: colors.foreground,
                  },
                ]}
                onPress={() => switchMode("create")}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        mode === "create"
                          ? colors.background
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "create" && (
              <View style={styles.nameRow}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border, flex: 1, marginRight: 8 }]}>
                  <Feather name="user" size={17} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="First Name"
                    placeholderTextColor={colors.mutedForeground}
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border, flex: 1 }]}>
                  <Feather name="user" size={17} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Last Name"
                    placeholderTextColor={colors.mutedForeground}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            )}

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="mail" size={17} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Email address"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="lock" size={17} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {errorMsg ? <Text style={[styles.errorText, { color: colors.intentError }]}>{errorMsg}</Text> : null}
            {successMsg ? <Text style={[styles.successText, { color: colors.intentSuccess }]}>{successMsg}</Text> : null}

            {mode === "signin" && (
              <TouchableOpacity style={styles.forgot} onPress={() => {}}>
                <Text style={[styles.forgotText, { color: colors.mutedForeground }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.launchBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.launchText, { color: colors.foreground }]}>
                {loading ? "Processing..." : mode === "signin" ? "Launch Session" : "Create Account"}
              </Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={[styles.orLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.orText, { color: colors.mutedForeground }]}>OR</Text>
              <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[
                styles.googleBtn,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={[styles.googleText, { color: colors.foreground }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
    justifyContent: "center",
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  nameRow: {
    flexDirection: "row",
    gap: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 8,
  },
  successText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 8,
  },
  forgot: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  launchBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  launchText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 2,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  googleBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleG: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#4285F4",
  },
  googleText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
