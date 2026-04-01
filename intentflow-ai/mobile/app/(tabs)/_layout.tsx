import { BlurView } from "expo-blur";
import { Tabs, router, usePathname } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

function TabButton({
  name,
  icon,
  label,
  active,
}: {
  name: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={styles.tabBtn}
      onPress={() => router.push(`/(tabs)/${name}` as any)}
      activeOpacity={0.65}
    >
      <View style={[styles.iconWrap, active && { backgroundColor: colors.primary + "20" }]}>
        <Feather
          name={icon}
          size={20}
          color={active ? colors.primary : colors.mutedForeground}
        />
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: active ? colors.primary : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function GlassTabBar() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { triggerVoice } = useApp();

  const activeRoute = pathname.replace("/(tabs)/", "").replace(/\/$/, "") || "index";

  // Hide navbar completely on profile screen - show only profile content
  if (activeRoute === "profile") {
    return null;
  }

  const handleMic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeRoute !== "index") {
      router.navigate("/");
    }
    triggerVoice();
  };

  const bottomOffset = (insets.bottom || 16) + 12;

  return (
    <View
      style={[
        styles.floatOuter,
        {
          bottom: bottomOffset,
          shadowColor: colors.primary,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.micFabWrap}>
        <TouchableOpacity
          style={[styles.micFab, { shadowColor: colors.primary }]}
          onPress={handleMic}
          activeOpacity={0.82}
        >
          <View style={[styles.micInner, { backgroundColor: colors.primary }]}>
            <View style={[styles.micGlow, { backgroundColor: colors.primary }]} />
            <Feather name="mic" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.pill}>
        <BlurView
          intensity={Platform.OS === "web" ? 0 : 80}
          tint="dark"
          style={[StyleSheet.absoluteFill, styles.blurClip]}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.glassLayer,
            {
              backgroundColor:
                Platform.OS === "web"
                  ? colors.background + "F2"
                  : "rgba(16,17,26,0.62)",
            },
          ]}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.borderLayer,
            { borderColor: "rgba(255,255,255,0.10)" },
          ]}
        />

        <View style={styles.tabRow}>
          <TabButton
            name="index"
            icon="home"
            label="Home"
            active={activeRoute === "index"}
          />
          <TabButton
            name="collections"
            icon="grid"
            label="Areas"
            active={activeRoute === "collections"}
          />
          <View style={styles.micSpacer} />
          <TabButton
            name="hitl"
            icon="shield"
            label="Review"
            active={activeRoute === "hitl"}
          />
          <TabButton
            name="profile"
            icon="user"
            label="Profile"
            active={activeRoute === "profile"}
          />
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const activeRoute = pathname?.replace("/(tabs)/", "").replace(/\/$/, "") || "index";
  
  // Hide tab bar completely on profile screen
  const showTabBar = activeRoute !== "profile";

  return (
    <Tabs
      tabBar={showTabBar ? () => <GlassTabBar /> : () => null}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="collections" />
      <Tabs.Screen name="hitl" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="alerts" options={{ href: null }} />
      <Tabs.Screen name="confirm" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatOuter: {
    position: "absolute",
    left: 14,
    right: 14,
    overflow: "visible",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  micFabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -30,
    alignItems: "center",
    zIndex: 10,
    pointerEvents: "box-none",
  },
  micFab: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  micInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.22)",
  },
  micGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.35,
    transform: [{ scale: 1.4 }],
  },
  pill: {
    borderRadius: 26,
    overflow: "visible",
    height: 70,
  },
  blurClip: {
    borderRadius: 26,
    overflow: "hidden",
  },
  glassLayer: {
    borderRadius: 26,
  },
  borderLayer: {
    borderRadius: 26,
    borderWidth: 1,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 70,
    paddingHorizontal: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 36,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
  micSpacer: {
    width: 60,
  },
});
