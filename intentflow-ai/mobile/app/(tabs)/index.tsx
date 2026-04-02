import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
import { processVoice } from "@/services/api";
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
  const { userInitial, tasks, lifeAreas, voiceTrigger, refreshTasks, isLoading } = useApp();
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [visibleChars, setVisibleChars] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [confidence, setConfidence] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshTasks();
    setIsRefreshing(false);
  }, [refreshTasks]);

  const startListening = async () => {
    if (parseState !== "idle") {
      resetState();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log("[Voice] Starting recording...");
    setParseState("listening");
    setTranscript("");
    setExtractedTasks([]);
    
    try {
      const success = await voiceRecorder.startRecording();
      console.log("[Voice] Recording started:", success);
      // Track recording start time
      (window as any).recordingStartTime = Date.now();
      if (!success) {
        console.error("[Voice] Failed to start recording");
        setTranscript("Microphone permission denied. Please enable mic access.");
        setParseState("error");
        return;
      }
    } catch (err) {
      console.error("[Voice] Error starting recording:", err);
      setTranscript("Error accessing microphone.");
      setParseState("error");
    }
  };

  const stopListening = async () => {
    console.log("[Voice] Stopping recording...");
    setParseState("parsing");
    
    // Add minimum recording time check
    const recordingDuration = Date.now() - (window as any).recordingStartTime;
    console.log("[Voice] Recording duration:", recordingDuration, "ms");
    
    if (recordingDuration < 1000) {
      console.warn("[Voice] Recording too short, need at least 1 second");
      setTranscript("Hold the button longer to record your voice.");
      setParseState("error");
      return;
    }
    
    let uri: string | null = null;
    try {
      uri = await voiceRecorder.stopRecording();
      console.log("[Voice] Got audio URI:", uri);
    } catch (err) {
      console.error("[Voice] Error stopping recording:", err);
      setTranscript("Error recording audio.");
      setParseState("error");
      return;
    }
    
    if (!uri) {
      console.error("[Voice] No audio URI returned");
      setTranscript("No audio recorded.");
      setParseState("error");
      return;
    }
    
    try {
      console.log("[Voice] Sending to NLP API...");
      const response = await processVoice(uri);
      console.log("[Voice] NLP response:", response);
      
      if (response.success) {
        const transcriptText = response.transcript || response.text || "";
        console.log("[Voice] Transcript:", transcriptText);
        setTranscript(transcriptText);
        
        if (response.tasks && response.tasks.length > 0) {
          console.log("[Voice] Extracted tasks:", response.tasks);
          setExtractedTasks(response.tasks);
          setConfidence(response.tasks[0].confidence_score || 85);
        } else {
          console.log("[Voice] No tasks extracted");
        }
        
        setParseState("done");
      } else {
        console.error("[Voice] API returned error:", response.message);
        setTranscript("Sorry, I couldn't understand that. Try speaking more clearly.");
        setParseState("error");
      }
      
      voiceRecorder.cleanup(uri);
    } catch (error: any) {
      console.error("[Voice] Voice processing error:", error);
      console.error("[Voice] Error details:", error.response?.data || error.message);
      setTranscript(`Error: ${error.message || "Could not process voice"}`);
      setParseState("error");
      voiceRecorder.cleanup(uri);
    }
  };

  const animateRows = () => {
    setVisibleRows(0);
    let r = 0;
    const iv = setInterval(() => {
      r++;
      setVisibleRows(r);
      if (r >= 3) {
        clearInterval(iv);
      }
    }, 350);
  };

  const resetState = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setParseState("idle");
    setVisibleChars(0);
    setVisibleRows(0);
    setTranscript("");
    setExtractedTasks([]);
    setConfidence(0);
  };

  // Helper to generate parse steps from extracted tasks
  const getParseSteps = () => {
    if (extractedTasks.length === 0) return [];
    const task = extractedTasks[0];
    return [
      { label: "Action", value: task.title || "Unknown", conf: confidence },
      { label: "Priority", value: task.priority || "medium", conf: confidence - 5 },
      { label: "Category", value: task.category || "general", note: task.due_date ? `Due: ${task.due_date}` : undefined },
    ];
  };

  useEffect(() => {
    if (voiceTrigger > 0) {
      if (parseState === "listening") {
        stopListening();
      } else {
        startListening();
      }
    }
  }, [voiceTrigger]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Calculate task stats
  const activeTaskCount = tasks.filter((t) => t.status === "confirmed").length;
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
            status={
              parseState === "idle" ? "ready"
              : parseState === "listening" ? "warning"
              : parseState === "parsing" ? "pending"
              : parseState === "done" ? "success"
              : "error"
            }
            text={
              parseState === "idle" ? "System Online"
              : parseState === "listening" ? "Listening"
              : parseState === "parsing" ? "Parsing Intent"
              : parseState === "done" ? "Action Ready"
              : "Error"
            }
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
        {parseState === "idle" && (
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

            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Life Areas</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/collections")}>
                  <Text style={[styles.sectionLink, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.areasRow}
              >
                {lifeAreas.length > 0 ? (
                  lifeAreas.map((area, i) => (
                    <LifeAreaTile key={area.id} area={area} index={i} />
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    No life areas yet. Create a task to get started!
                  </Text>
                )}
              </ScrollView>
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
                    <View style={[styles.taskDot, { backgroundColor: colors.intentSuccess }]} />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskEntity, { color: colors.foreground }]}>
                        {t.action} · {t.entity}
                      </Text>
                      <Text style={[styles.taskTrigger, { color: colors.mutedForeground }]}>
                        {t.trigger}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: colors.intentSuccess + "18" }]}>
                      <Text style={[styles.statusPillText, { color: colors.intentSuccess }]}>
                        {t.status}
                      </Text>
                    </View>
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
              onPress={startListening}
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
              onPress={() => router.push("/test-voice")}
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
        )}

        {(parseState === "listening" || parseState === "parsing" || parseState === "done") && (
          <Animated.View entering={FadeIn} style={styles.listenContent}>
            {parseState === "listening" && (
              <View style={styles.listeningLabel}>
                <Feather name="mic" size={13} color={colors.voiceActive} />
                <Text style={[styles.listenTag, { color: colors.voiceActive }]}>LISTENING</Text>
              </View>
            )}
            {(parseState === "parsing" || parseState === "done") && (
              <View style={styles.listeningLabel}>
                <Text style={[styles.listenTag, { color: colors.mutedForeground }]}>
                  PARSING INTENT...
                </Text>
              </View>
            )}

            <Text style={[styles.transcriptText, { color: colors.foreground }]}>
              {transcript || (parseState === "listening" ? "Listening..." : "")}
            </Text>

            {(parseState === "parsing" || parseState === "done") && extractedTasks.length > 0 && (
              <View style={[styles.parseBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {getParseSteps().map((step, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeIn.delay(i * 100)}
                    style={[
                      styles.parseRow,
                      i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.parseLabel, { color: colors.mutedForeground }]}>
                      {step.label}
                    </Text>
                    <View style={styles.parseRight}>
                      <Text style={[styles.parseValue, { color: colors.foreground }]}>
                        {step.value}
                      </Text>
                      {step.conf && <ConfidenceBadge conf={step.conf} />}
                      {step.note && (
                        <View style={[styles.noteBadge, { backgroundColor: colors.intentWarning + "22" }]}>
                          <Text style={[styles.noteText, { color: colors.intentWarning }]}>
                            {step.note}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            {parseState === "done" && (
              <Animated.View entering={FadeIn.delay(200)} style={styles.confirmActions}>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/confirm")}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.confirmText, { color: colors.primaryForeground }]}>
                    Confirm Action
                  </Text>
                  <Feather name="chevron-right" size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={resetState}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.editText, { color: colors.foreground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.hitlBtn, { borderColor: colors.intentWarning + "50" }]}
                  onPress={() => router.push("/hitl")}
                  activeOpacity={0.8}
                >
                  <Feather name="shield" size={13} color={colors.intentWarning} />
                  <Text style={[styles.hitlBtnText, { color: colors.intentWarning }]}>
                    Low confidence? Request human review
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        )}
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
    borderWidth: 1,
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
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
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
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  areasRow: {
    gap: 10,
    paddingRight: 4,
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
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  areaTileCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.72)",
  },
  recentCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  recentHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
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
    fontFamily: "Inter_600SemiBold",
  },
  taskTrigger: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  micHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
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
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
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
    fontFamily: "Inter_600SemiBold",
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
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  transcriptText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  parseBox: {
    borderRadius: 16,
    borderWidth: 1,
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
    fontFamily: "Inter_500Medium",
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
    fontFamily: "Inter_600SemiBold",
  },
  confBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  noteBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noteText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
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
    fontFamily: "Inter_700Bold",
  },
  editBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  hitlBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  hitlBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});