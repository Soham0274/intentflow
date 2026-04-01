import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");
const CARD_W = width - 48;

function LifeAreaCard({ area, index }: { area: any; index: number }) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={animStyle}
    >
      <TouchableOpacity
        onPress={() => {}}
        activeOpacity={0.9}
        style={[
          styles.areaCard,
          { backgroundColor: area.color, width: CARD_W },
        ]}
      >
        <View style={styles.areaTop}>
          <View style={[styles.areaIconBox, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
            <Feather name="home" size={22} color="#fff" />
          </View>
          <View style={[styles.taskCountBadge, { backgroundColor: colors.foreground + "14" }]}>
            <Text style={styles.taskCountText}>{area.taskCount} TASKS</Text>
          </View>
        </View>
        <View style={styles.areaBottom}>
          <Text style={styles.areaName}>{area.name}</Text>
          <Text style={styles.areaDesc}>{area.description}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CollectionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lifeAreas, tasks } = useApp();
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = lifeAreas.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <GradientBackground>
      <View style={{ paddingTop: topPad + 10, paddingHorizontal: 20 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Collections</Text>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/alerts")}
          >
            <Feather name="bell" size={18} color={colors.foreground} />
            <View style={[styles.bellDot, { backgroundColor: colors.primary }]} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search tasks, categories..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: colors.input }]}
          >
            <Feather name="sliders" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 100 },
        ]}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Life Areas</Text>
            <TouchableOpacity>
              <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
            snapToInterval={CARD_W + 12}
            decelerationRate="fast"
          >
            {filtered.map((area, i) => (
              <LifeAreaCard key={area.id} area={area} index={i} />
            ))}
          </ScrollView>
        </View>

        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Intents
          </Text>
          <View style={[styles.intentsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {tasks.map((task, i) => (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(i * 60).springify()}
                style={[
                  styles.intentRow,
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                ]}
              >
                <View style={[styles.intentIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="check-circle" size={16} color={colors.primary} />
                </View>
                <View style={styles.intentInfo}>
                  <Text style={[styles.intentAction, { color: colors.foreground }]}>
                    {task.action} · {task.entity}
                  </Text>
                  <Text style={[styles.intentTrigger, { color: colors.mutedForeground }]}>
                    {task.trigger} · {task.id}
                  </Text>
                </View>
                <View
                  style={[styles.intentStatus, { backgroundColor: colors.intentSuccess + "18" }]}
                >
                  <Text style={[styles.intentStatusText, { color: colors.intentSuccess }]}>
                    {task.status}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingTop: 12,
    gap: 24,
  },
  section: {},
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  editLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cardsRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  areaCard: {
    borderRadius: 22,
    height: 220,
    padding: 20,
    justifyContent: "space-between",
  },
  areaTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  areaIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  taskCountText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  areaBottom: {
    gap: 4,
  },
  areaName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  areaDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  intentsList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 12,
  },
  intentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  intentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  intentInfo: {
    flex: 1,
  },
  intentAction: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  intentTrigger: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  intentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intentStatusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
});
