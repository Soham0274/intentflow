import React, { useState } from "react";
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
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { StatusBadge } from "@/components/StatusBadge";
import { AvatarButton } from "@/components/AvatarButton";
import { IntentCard } from "@/components/IntentCard";
import { useApp } from "@/context/AppContext";

export default function ConfirmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userInitial, addTask } = useApp();
  const [confirmed, setConfirmed] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTask({
      id: "INT-8821",
      entity: "Contact",
      action: "Follow up",
      trigger: "Today, 3:00 PM",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
    setConfirmed(true);
    setTimeout(() => router.back(), 1200);
  };

  return (
    <GradientBackground>
      <View
        style={[styles.header, { paddingTop: topPad + 10, paddingHorizontal: 20 }]}
      >
        <TouchableOpacity
          style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <Feather name="menu" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <StatusBadge text="Action Ready" status="success" />
        <AvatarButton initial={userInitial} onPress={() => router.push("/(tabs)/profile")} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: bottomPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn} style={styles.successIcon}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: colors.intentSuccess + "18" },
            ]}
          >
            <Feather name="check" size={30} color={colors.intentSuccess} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100)} style={styles.titleArea}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Confirm Reminder?
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Intent successfully extracted
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.cardArea}>
          <IntentCard
            task={{
              id: "INT-8821",
              entity: "Contact",
              action: "Follow up",
              trigger: "Today, 3:00 PM",
              status: "pending",
              createdAt: new Date().toISOString(),
            }}
            onConfirm={handleConfirm}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280)}>
          <View
            style={[
              styles.syncNote,
              {
                backgroundColor: colors.intentSuccess + "10",
                borderColor: colors.intentSuccess + "30",
              },
            ]}
          >
            <View
              style={[styles.syncDot, { backgroundColor: colors.intentSuccess }]}
            />
            <Text style={[styles.syncText, { color: colors.mutedForeground }]}>
              Synced with your "External Sales" project. Contact details have been linked.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360)} style={styles.actions}>
          {!confirmed ? (
            <>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <Text style={[styles.confirmText, { color: colors.primaryForeground }]}>
                  Confirm Task
                </Text>
                <Feather name="check" size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Feather name="edit-2" size={14} color={colors.foreground} />
                <Text style={[styles.editText, { color: colors.foreground }]}>Edit Details</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Animated.View
              entering={FadeIn}
              style={[styles.successBanner, { backgroundColor: colors.intentSuccess + "18" }]}
            >
              <Feather name="check-circle" size={24} color={colors.intentSuccess} />
              <Text style={[styles.successText, { color: colors.intentSuccess }]}>
                Task confirmed!
              </Text>
            </Animated.View>
          )}

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.cancelLink, { color: colors.mutedForeground }]}>
              CANCEL REQUEST
            </Text>
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
    paddingBottom: 8,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
    flexGrow: 1,
  },
  successIcon: {
    alignItems: "center",
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  titleArea: {
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  cardArea: {},
  syncNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
    flexShrink: 0,
  },
  syncText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    flex: 1,
  },
  actions: {
    gap: 12,
    alignItems: "center",
  },
  confirmBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  editBtn: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  successBanner: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  successText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  cancelLink: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 4,
  },
});
