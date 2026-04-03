import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/store/AuthContext";

function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{text}</Text>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { voiceSensitivity, setVoiceSensitivity, autoConfirm, setAutoConfirm, logout, tasks } = useApp();
  const { signOut, user } = useAuth();

  // Get real user data from AuthContext/Supabase
  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogout = async () => {
    try {
      // Sign out from Supabase via AuthContext
      const { error } = await signOut();
      if (error) {
        console.error('[Profile] Sign out error:', error);
      }
      
      // Also clear local app state
      logout();
      
      // Navigate to login screen
      router.replace("/login");
    } catch (err) {
      console.error('[Profile] Logout failed:', err);
    }
  };

  return (
    <GradientBackground>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn} style={styles.avatarArea}>
          <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={[styles.avatarDot, { backgroundColor: colors.intentSuccess }]} />
          </View>
          <Text style={[styles.userName, { color: colors.foreground }]}>{userName}</Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{userEmail}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80)}>
          <SectionLabel text="ASSISTANT PREFERENCES" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120)} style={[styles.prefsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.prefRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.prefIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="mic" size={16} color={colors.primary} />
            </View>
            <View style={styles.prefInfo}>
              <Text style={[styles.prefLabel, { color: colors.foreground }]}>Voice Sensitivity</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const cycle: ("Low" | "Medium" | "High")[] = ["Low", "Medium", "High"];
                const next = cycle[(cycle.indexOf(voiceSensitivity) + 1) % cycle.length];
                setVoiceSensitivity(next);
              }}
              style={[styles.sensBtn, { backgroundColor: colors.primary + "18" }]}
            >
              <Text style={[styles.sensText, { color: colors.primary }]}>{voiceSensitivity}</Text>
            </TouchableOpacity>
            <View style={[styles.togglePill, { backgroundColor: colors.primary }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: 20 }] }]} />
            </View>
          </View>

          <View style={styles.prefRow}>
            <View style={[styles.prefIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="message-square" size={16} color={colors.primary} />
            </View>
            <View style={styles.prefInfo}>
              <Text style={[styles.prefLabel, { color: colors.foreground }]}>Auto-Confirm Intent</Text>
            </View>
            <TouchableOpacity
              onPress={() => setAutoConfirm(!autoConfirm)}
              activeOpacity={0.8}
            >
              <View style={[styles.togglePill, { backgroundColor: autoConfirm ? colors.primary : colors.muted }]}>
                <View
                  style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: autoConfirm ? 20 : 2 }] },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180)}>
          <SectionLabel text="CONNECTED ECOSYSTEM" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220)} style={[styles.ecoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.ecoRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.ecoIcon, { backgroundColor: "#4285F4" + "18" }]}>
              <Text style={[styles.ecoLetter, { color: "#4285F4" }]}>G</Text>
            </View>
            <View style={styles.ecoInfo}>
              <Text style={[styles.ecoName, { color: colors.foreground }]}>Google Calendar</Text>
              <Text style={[styles.ecoSub, { color: colors.mutedForeground }]}>Primary workspace</Text>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: colors.intentSuccess + "18" }]}>
              <Text style={[styles.activeBadgeText, { color: colors.intentSuccess }]}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.ecoRow}>
            <View style={[styles.ecoIcon, { backgroundColor: colors.muted }]}>
              <Feather name="calendar" size={16} color={colors.mutedForeground} />
            </View>
            <View style={styles.ecoInfo}>
              <Text style={[styles.ecoName, { color: colors.foreground }]}>Outlook Calendar</Text>
              <Text style={[styles.ecoSub, { color: colors.mutedForeground }]}>Not connected</Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.connectText, { color: colors.primary }]}>Connect</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280)}>
          <View style={styles.recentsHeader}>
            <SectionLabel text="RECENT INTENTS" />
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320)} style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {tasks.slice(0, 2).map((task, i) => (
            <View
              key={task.id}
              style={[
                styles.recentRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.recentText, { color: colors.mutedForeground }]}>
                "{task.action} with {task.entity}"
              </Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380)}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.destructive + "40" }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={16} color={colors.destructive} />
            <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  avatarArea: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  avatarDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#0D0E14",
  },
  userName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  userEmail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  prefsCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  prefInfo: {
    flex: 1,
  },
  prefLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sensBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  sensText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  togglePill: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    boxShadow: '0px 1px 2px rgba(0,0,0,0.2)',
    elevation: 2,
  },
  ecoCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  ecoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  ecoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ecoLetter: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  ecoInfo: {
    flex: 1,
  },
  ecoName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  ecoSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  connectText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  recentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  recentCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  recentRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  logoutBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
