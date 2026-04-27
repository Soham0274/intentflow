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
import { useAuth } from "@/store/AuthContext";

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
      onPress={() => {
        if (name === "index") {
          router.replace("/(tabs)/" as any);
        } else {
          router.push(`/(tabs)/${name}` as any);
        }
      }}
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

function TopRightMenu({ onProfilePress }: { onProfilePress: () => void }) {
  const colors = useColors();
  const { userInitial } = useApp();
  
  return (
    <TouchableOpacity
      onPress={onProfilePress}
      style={[styles.topRightMenu, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
    >
      <Text style={[styles.userInitial, { color: colors.primary }]}>
        {userInitial}
      </Text>
    </TouchableOpacity>
  );
}

function GlassTabBar() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { triggerVoice } = useApp();

  const activeRoute = pathname.split("/").pop() || "index";

  const handleMic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/voice");
  };

  const bottomOffset = (insets.bottom || 16) + 12;

  return (
    <View
      style={[
        styles.floatOuter,
        {
          bottom: bottomOffset,
          pointerEvents: 'box-none',
        },
      ]}
    >
      <View style={styles.micFabWrap}>
        <TouchableOpacity
          style={[styles.micFab]}
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
            name="intents"
            icon="list"
            label="Intents"
            active={activeRoute === "intents"}
          />
          <View style={styles.micSpacer} />
          <TabButton
            name="calendar"
            icon="calendar"
            label="Calendar"
            active={activeRoute === "calendar"}
          />
          <TabButton
            name="geolocation"
            icon="map-pin"
            label="Location"
            active={activeRoute === "geolocation"}
          />
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const activeRoute = pathname?.replace("/(tabs)/", "").replace(/\/$/, "") || "index";
  const { userInitial } = useApp();

  return (
    <Tabs
      tabBar={() => <GlassTabBar />}
      screenOptions={{ 
        headerShown: true,
        header: ({ navigation }) => (
          <View style={[styles.headerContainer, { paddingTop: 50 }]}>
            <TouchableOpacity
              onPress={() => navigation.navigate("profile")}
              style={[
                styles.headerProfileBtn,
                { backgroundColor: "#1a1a2e", borderColor: "rgba(124,111,224,0.3)" }
              ]}
            >
              <Text style={[styles.headerInitial, { color: "#7c6fe0" }]}>
                {userInitial}
              </Text>
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          headerShown: true,
          headerTitle: "",
        }}
      />
      <Tabs.Screen 
        name="calendar" 
        options={{ 
          headerShown: true,
          headerTitle: "",
        }}
      />
      <Tabs.Screen 
        name="intents" 
        options={{ 
          headerShown: true,
          headerTitle: "",
        }}
      />
      <Tabs.Screen 
        name="geolocation" 
        options={{ 
          headerShown: true,
          headerTitle: "",
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="alerts" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  headerProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 8px rgba(124,111,224,0.3)",
  },
  headerInitial: {
    fontSize: 16,
    fontFamily: "Syne_700Bold",
  },
  topRightMenu: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    borderWidth: 1,
    borderColor: "rgba(124,111,224,0.3)",
  },
  userInitial: {
    fontSize: 16,
    fontFamily: "Syne_700Bold",
  },
  floatOuter: {
    position: "absolute",
    left: 14,
    right: 14,
    overflow: "visible",
    boxShadow: '0px 8px 24px rgba(108,99,255,0.28)',
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
    boxShadow: '0px 6px 18px rgba(108,99,255,0.55)',
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
    fontFamily: "DMSans_500Medium",
    letterSpacing: 0.1,
  },
  micSpacer: {
    width: 60,
  },
});
