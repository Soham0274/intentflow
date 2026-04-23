import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
  FadeInDown,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { StatusBadge } from "@/components/StatusBadge";
import { AvatarButton } from "@/components/AvatarButton";
import { useApp } from "@/context/AppContext";
import { processVoice, processNLP } from "@/services/api";
import { voiceRecorder } from "@/services/voiceRecorder";

type ParseState = "idle" | "listening" | "parsing" | "done" | "error";

const { width: SCREEN_W } = Dimensions.get("window");
const AREA_CARD_W = 140;

function ConfidenceBadge({ conf }: { conf: number }) {
  const colors = useColors();
  return (
    <View style={[styles.confBadge, { backgroundColor: colors.primary + "22" }]}>
      <Text style={[styles.confText, { color: colors.primary }]}>{conf}%</Text>
    </View>
  );
}

function LifeAreaTile({ area, index }: { area: any; index: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()} style={animStyle}>
      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.areaTile, { backgroundColor: area.color }]}
      >
        <View style={[styles.areaTileIcon, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <Feather name="layers" size={16} color="#fff" />
        </View>
        <Text style={styles.areaTileName}>{area.name}</Text>
        <Text style={styles.areaTileCount}>{area.taskCount} tasks</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userInitial, tasks, lifeAreas, refreshTasks, isLoading } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [textInput, setTextInput] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshTasks();
    setIsRefreshing(false);
  }, [refreshTasks]);

  const submitTextTask = async () => {
    if (!textInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await processNLP(textInput);
      if (response.success) {
        setTextInput("");
        await refreshTasks();
      }
    } catch (error: any) {
      console.error("[Voice] Text process error:", error);
    }
  };

  // Calculate task stats
  const activeTaskCount = tasks.filter((t) => t.status === "active").length;
  const pendingTaskCount = tasks.filter((t) => t.status === "pending").length;

  if (isLoading) {
    return (
      <GradientBackground>
        <View style={[styles.loadingContainer, { paddingTop: topPad + 100 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading your tasks...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={[styles.header, { paddingTop: topPad + 10, paddingHorizontal: 20 } as ViewStyle]}>
        <View style={styles.headerLeft}>
          <StatusBadge
            status="online"
            text="System Online"
          />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/alerts")}
          >
            <Feather name="bell" size={17} color={colors.foreground} />
            <View style={[styles.bellDot, { backgroundColor: colors.primary }]} />
          </TouchableOpacity>
          <AvatarButton initial={userInitial} onPress={() => router.push("/profile")} />
        </View>
      </View>
 
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: bottomPad + 110 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.idleContent}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              What would you like to{" "}
              <Text style={{ color: colors.primary }}>remember?</Text>
            </Text>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.foreground }]}>
                  {activeTaskCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.primary }]}>
                  {pendingTaskCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pending</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: colors.intentSuccess }]}>24/7</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
              </View>
            </View>

            <View style={styles.textInputBoxContainer}>
              <View style={[styles.textInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                 <Feather name="edit-3" size={16} color={colors.mutedForeground} style={styles.textInputIcon} />
                 <TextInput 
                   style={[styles.textInput, { color: colors.foreground }]}
                   placeholder="Type an intent... e.g. 'Remind me to call John'"
                   placeholderTextColor={colors.mutedForeground}
                   value={textInput}
                   onChangeText={setTextInput}
                   onSubmitEditing={submitTextTask}
                   returnKeyType="send"
                 />
                 {textInput.length > 0 && (
                   <TouchableOpacity onPress={submitTextTask} style={[styles.textInputSend, { backgroundColor: colors.primary }]}>
                      <Feather name="arrow-up" size={16} color="#FFF" />
                   </TouchableOpacity>
                 )}
              </View>
            </View>

            <View style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: colors.mutedForeground }]}>
                  RECENT INTENTS
                </Text>
              </View>
              {tasks.length > 0 ? (
                tasks.map((t, i) => (
                  <View
                    key={t.id}
                    style={[styles.taskRow, { borderTopColor: colors.border }]}
                  >
                    <View style={[styles.taskDot, { 
                      backgroundColor: (t.confidence_score !== undefined && t.confidence_score < 50) || t.status === 'pending' || t.status === 'review'
                        ? colors.intentWarning 
                        : colors.intentSuccess 
                    }]} />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskEntity, { color: colors.foreground }]}>
                        {t.action || t.title} · {t.entity || t.category}
                      </Text>
                      <Text style={[styles.taskTrigger, { color: colors.mutedForeground }]}>
                        {t.trigger || t.due_date || t.description}
                      </Text>
                    </View>
                    
                    {t.confidence_score !== undefined && t.confidence_score < 50 ? (
                      <TouchableOpacity 
                        style={[styles.statusPill, { backgroundColor: colors.intentWarning + "18" }]}
                        onPress={() => router.push({ pathname: '/review', params: { hitlId: t.id } })}
                      >
                        <Text style={[styles.statusPillText, { color: colors.intentWarning }]}>
                          Review ({t.confidence_score}%)
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.statusPill, { 
                        backgroundColor: t.status === 'pending' ? colors.intentWarning + "18" : colors.intentSuccess + "18" 
                      }]}>
                        <Text style={[styles.statusPillText, { 
                          color: t.status === 'pending' ? colors.intentWarning : colors.intentSuccess 
                        }]}>
                          {t.status === 'active' ? 'Active' : t.status === 'completed' ? 'Completed' : 'Pending'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    No tasks yet. Tap the mic to create your first task!
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.micHint, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/voice")}
              activeOpacity={0.8}
            >
              <View style={[styles.micHintIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="mic" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.micHintText, { color: colors.mutedForeground }]}>
                Tap the mic to capture a new intent...
              </Text>
            </TouchableOpacity>

            {/* Test Voice Recorder Button */}
            <TouchableOpacity
              style={[styles.testBtn, { backgroundColor: colors.intentWarning + "15", borderColor: colors.intentWarning + "30" }]}
              onPress={() => router.push("/voice")}
              activeOpacity={0.8}
            >
              <View style={[styles.testBtnIcon, { backgroundColor: colors.intentWarning + "20" }]}>
                <Feather name="activity" size={18} color={colors.intentWarning} />
              </View>
              <Text style={[styles.testBtnText, { color: colors.intentWarning }]}>
                Test Voice Recorder
              </Text>
              <Feather name="chevron-right" size={18} color={colors.intentWarning} />
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
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: "#0D0E14",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 1,
  },
  idleContent: {
    gap: 22,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: "Syne_800ExtraBold",
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Syne_800ExtraBold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Syne_800ExtraBold",
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  textInputBoxContainer: {
    paddingVertical: 8,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  textInputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    minHeight: 40,
  },
  textInputSend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  areaTile: {
    width: AREA_CARD_W,
    height: 130,
    borderRadius: 18,
    padding: 14,
    justifyContent: "space-between",
  },
  areaTileIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  areaTileName: {
    fontSize: 17,
    fontFamily: "Syne_800ExtraBold",
    color: "#fff",
  },
  areaTileCount: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: "rgba(255,255,255,0.72)",
  },
  recentCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  recentHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentTitle: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 1.2,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskInfo: { flex: 1 },
  taskEntity: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  taskTrigger: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    textTransform: "capitalize",
  },
  micHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  micHintIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  micHintText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    flex: 1,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 10,
  },
  testBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  testBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    flex: 1,
  },
  listenContent: {
    gap: 20,
    paddingTop: 24,
  },
  listeningLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listenTag: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    letterSpacing: 1.5,
  },
  transcriptText: {
    fontSize: 28,
    fontFamily: "Syne_800ExtraBold",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  parseBox: {
    borderRadius: 18,
    overflow: "hidden",
  },
  parseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  parseLabel: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    width: 70,
  },
  parseRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  parseValue: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  confBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confText: {
    fontSize: 11,
    fontFamily: "Syne_800ExtraBold",
  },
  noteBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noteText: {
    fontSize: 11,
    fontFamily: "Syne_800ExtraBold",
  },
  confirmActions: {
    gap: 12,
  },
  confirmBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: "Syne_800ExtraBold",
  },
  editBtn: {
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
  hitlBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  hitlBtnText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },
});