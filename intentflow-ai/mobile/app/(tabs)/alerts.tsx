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
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { useApp } from "@/context/AppContext";

function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
      {text}
    </Text>
  );
}

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { smartNudges, setSmartNudges, quietHours, setQuietHours } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <GradientBackground>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Alerts</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(60)} style={[styles.nudgeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.nudgeHeader}>
            <View style={[styles.nudgeIconBox, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="zap" size={18} color={colors.primary} />
            </View>
            <View style={styles.nudgeInfo}>
              <Text style={[styles.nudgeName, { color: colors.foreground }]}>Smart Nudges</Text>
              <Text style={[styles.nudgeSub, { color: colors.mutedForeground }]}>AI-Optimized Timing</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSmartNudges(!smartNudges)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.togglePill,
                  { backgroundColor: smartNudges ? colors.primary : colors.muted },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: smartNudges ? 20 : 2 }] },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={[styles.nudgeDesc, { color: colors.mutedForeground }]}>
            IntentFlow automatically analyzes your daily routines and energy levels to find the perfect moment to deliver notifications.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120)}>
          <SectionLabel text="DELIVERY RULES" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160)} style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.quietRow}>
            <View style={[styles.ruleIconBox, { backgroundColor: colors.muted }]}>
              <Feather name="moon" size={16} color={colors.foreground} />
            </View>
            <Text style={[styles.ruleLabel, { color: colors.foreground }]}>Quiet Hours</Text>
            <TouchableOpacity
              onPress={() => setQuietHours(!quietHours)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.togglePill,
                  { backgroundColor: quietHours ? colors.primary : colors.muted },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: quietHours ? 20 : 2 }] },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          {quietHours && (
            <View style={styles.timeRow}>
              <View style={[styles.timeBlock, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.timeText, { color: colors.primary }]}>10:00{"\n"}PM</Text>
              </View>
              <Text style={[styles.toText, { color: colors.mutedForeground }]}>to</Text>
              <View style={[styles.timeBlock, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.timeText, { color: colors.foreground }]}>7:00{"\n"}AM</Text>
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.ruleRow} activeOpacity={0.7}>
            <View style={[styles.ruleIconBox, { backgroundColor: colors.muted }]}>
              <Feather name="layers" size={16} color={colors.foreground} />
            </View>
            <Text style={[styles.ruleLabel, { color: colors.foreground }]}>Frequency</Text>
            <View style={styles.ruleRight}>
              <Text style={[styles.ruleValue, { color: colors.mutedForeground }]}>Bundled</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.ruleRow}>
            <View style={[styles.ruleIconBox, { backgroundColor: colors.muted }]}>
              <Feather name="calendar" size={16} color={colors.foreground} />
            </View>
            <View style={styles.ruleMeta}>
              <Text style={[styles.ruleLabel, { color: colors.foreground }]}>Weekend Mode</Text>
              <Text style={[styles.ruleSub, { color: colors.mutedForeground }]}>Pause non-urgent tasks</Text>
            </View>
            <View style={[styles.togglePill, { backgroundColor: colors.muted }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: 2 }] }]} />
            </View>
          </View>
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
    gap: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: -10,
  },
  nudgeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  nudgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nudgeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nudgeInfo: {
    flex: 1,
  },
  nudgeName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  nudgeSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  nudgeDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rulesCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  quietRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  timeBlock: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  timeText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 20,
  },
  toText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  ruleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  ruleMeta: {
    flex: 1,
  },
  ruleSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  ruleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ruleValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
