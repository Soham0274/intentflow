import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../theme/ThemeContext";
import { useApp } from "@/context/AppContext";
import { processVoice, processNLP, createTask } from "@/services/api";
import { voiceRecorder } from "@/services/voiceRecorder";
import { Fonts, Radius } from "@/constants/theme";

// ─── Types ────────────────────────────────────────────────────────
type Screen = "voice" | "text";

interface Entity {
  label: string;
  value: string;
  icon: string;
}

interface ActionCategory {
  id: string;
  label: string;
  icon: string;
}

// ─── Constants ────────────────────────────────────────────────────
const ACTION_CATEGORIES: ActionCategory[] = [
  { id: "shopping",  label: "Shopping", icon: "🛒" },
  { id: "work",      label: "Work",     icon: "💼" },
  { id: "home",      label: "Home",     icon: "🏠" },
  { id: "health",    label: "Health",   icon: "❤️" },
  { id: "social",    label: "Social",   icon: "👥" },
  { id: "finance",   label: "Finance",  icon: "💳" },
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"] as const;
type Priority = (typeof PRIORITY_OPTIONS)[number];

const PRIORITY_COLORS: Record<Priority, string> = {
  Low:    "#22c55e",
  Medium: "#7c6fe0",
  High:   "#ef4444",
};

const STATUS_OPTIONS = ["Pending", "Active"] as const;
type TaskStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_COLORS: Record<TaskStatus, string> = {
  Pending: "#eab308",
  Active:  "#7c6fe0",
};

// ─── Sub-components ───────────────────────────────────────────────

/** Animated frequency bars */
function Waveform({ active }: { active: boolean }) {
  const NUM = 24;
  const bars = Array.from({ length: NUM }).map(() => useSharedValue(8));

  useEffect(() => {
    if (active) {
      bars.forEach((bar, i) => {
        bar.value = withRepeat(
          withSequence(
            withTiming(20 + Math.random() * 40, { duration: 400 + (i % 5) * 80 }),
            withTiming(8, { duration: 400 + (i % 5) * 80 })
          ),
          -1,
          true
        );
      });
    } else {
      bars.forEach((bar) => {
        bar.value = withTiming(8);
      });
    }
  }, [active]);

  return (
    <View style={S.waveRow}>
      {bars.map((bar, i) => {
        const style = useAnimatedStyle(() => ({
          height: bar.value,
          backgroundColor: i % 3 === 0 ? "#7c6fe0" : i % 3 === 1 ? "#a78bfa" : "#4c3fa0",
        }));
        return <Animated.View key={i} style={[S.waveBar, style]} />;
      })}
    </View>
  );
}

/** Confidence progress bar */
function ConfidenceBar({ value }: { value: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(value, { duration: 1000 });
  }, [value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={S.confRow}>
      <Text style={S.confLabel}>CONFIDENCE</Text>
      <View style={S.confTrack}>
        <Animated.View style={[S.confFill, fillStyle]} />
      </View>
      <Text style={S.confValue}>{value}%</Text>
    </View>
  );
}

/** Pill-shaped entity tag */
function EntityTag({ entity }: { entity: Entity }) {
  return (
    <View style={S.entityTag}>
      <Text style={S.entityIcon}>{entity.icon}</Text>
      <Text style={S.entityLabel}>{entity.label}: </Text>
      <Text style={S.entityValue}>{entity.value}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function IntentCreationScreen() {
  const { colors } = useTheme();
  const { autoConfirm, refreshTasks } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>("voice");

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [confidence, setConfidence] = useState(0);

  // Text Form State
  const [nlpInput, setNlpInput] = useState("");
  const [subject, setSubject] = useState("");
  const [actionType, setActionType] = useState("work");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("Active");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ─── Voice Logic ────────────────────────────────────────────────

  const startRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTranscript("");
    setEntities([]);
    setConfidence(0);
    
    const success = await voiceRecorder.startRecording();
    if (success) setIsRecording(true);
  };

  const stopRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);
    setIsProcessing(true);
    
    const uri = await voiceRecorder.stopRecording();
    if (uri) {
      try {
        const res = await processVoice(uri);
        if (res.success) {
          const data = res.data;
          setTranscript(data.transcript || data.text || "");
          setConfidence(data.tasks?.[0]?.confidence_score || 85);
          
          if (data.tasks?.[0]) {
            const t = data.tasks[0];
            const newEntities: Entity[] = [
              { label: "ACTION", value: t.title.toUpperCase(), icon: "📋" },
            ];
            if (t.category) newEntities.push({ label: "CATEGORY", value: t.category.toUpperCase(), icon: "🏷️" });
            if (t.due_date) newEntities.push({ label: "TIME", value: t.due_date.toUpperCase(), icon: "🕒" });
            setEntities(newEntities);
            
            // Auto-populate text form for easy editing
            setSubject(t.title);
            setNlpInput(data.transcript || "");
            setActionType(t.category?.toLowerCase() || "work");
            setPriority(t.priority === "high" ? "High" : t.priority === "medium" ? "Medium" : "Low");
            if (t.due_date) {
              if (t.due_date.includes("T")) {
                 setDate(t.due_date.split("T")[0]);
                 const parsedTime = t.due_date.split("T")[1].substring(0, 5);
                 setTime(parsedTime === "00:00" ? "" : parsedTime);
              } else if (t.due_date.includes(" ")) {
                 setDate(t.due_date.split(' ')[0]);
                 setTime(t.due_date.split(' ').slice(1).join(' '));
              } else {
                 setDate(t.due_date);
              }
            }
            
            if (autoConfirm) {
              await createTask({
                title: t.title,
                category: t.category?.toLowerCase() || "work",
                priority: t.priority === "high" ? "high" : t.priority === "medium" ? "medium" : "low",
                status: "active",
                due_date: t.due_date || null
              });
              await refreshTasks();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace("/(tabs)/intents");
              return;
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
        voiceRecorder.cleanup(uri);
      }
    } else {
      setIsProcessing(false);
    }
  };

  // ─── Text Logic ─────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!nlpInput.trim()) return;
    setIsProcessing(true);
    try {
      const res = await processNLP(nlpInput);
      if (res.success && res.data?.tasks?.[0]) {
        const t = res.data.tasks[0];
        setSubject(t.title);
        setActionType(t.category?.toLowerCase() || "work");
        setPriority(t.priority === "high" ? "High" : t.priority === "medium" ? "Medium" : "Low");
        if (t.due_date) setDate(t.due_date);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!subject.trim()) return;
    setIsSaving(true);
    try {
      let finalDueDate = null;
      if (date) {
        let cleanTime = time.trim() || '09:00';
        // Simple standardization for format
        if (cleanTime.length === 4 && cleanTime.includes(':')) cleanTime = '0' + cleanTime;
        finalDueDate = `${date}T${cleanTime}:00`;
      }

      const taskData = {
        title: subject,
        category: actionType,
        priority: priority.toLowerCase(),
        status: taskStatus === "Active" ? "active" : "pending",
        due_date: finalDueDate,
      };
      await createTask(taskData);
      await refreshTasks();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/intents");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // ─── Render Helpers ─────────────────────────────────────────────

  const renderVoiceScreen = () => (
    <View style={S.screenContent}>
      {/* Waveform */}
      <View style={S.voiceWaveSection}>
        <Waveform active={isRecording} />
      </View>

      {/* Transcript */}
      <View style={S.transcriptBox}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={S.voiceTranscriptText}>
            {transcript || (isRecording ? "Listening..." : "Tap the mic to speak...")}
            {isRecording && <View style={S.voiceCursor} />}
          </Text>
        </ScrollView>
      </View>

      {/* Entities */}
      <View style={S.entitiesWrap}>
        {entities.map((e, i) => <EntityTag key={i} entity={e} />)}
        {isProcessing && <EntityTag entity={{ label: "ACTION", value: "PARSING...", icon: "⚙️" }} />}
      </View>

      {/* Confidence */}
      {confidence > 0 && (
        <View style={S.confSection}>
          <ConfidenceBar value={confidence} />
        </View>
      )}

      {/* Bottom Controls */}
      <View style={S.bottomBar}>
        <TouchableOpacity style={S.bottomIconBtn} onPress={() => setScreen("text")}>
          <MaterialCommunityIcons name="keyboard-outline" size={24} color="#7c7c99" />
        </TouchableOpacity>
        
        <Text style={S.statusText}>
          {isProcessing ? "Analyzing intent..." : isRecording ? "Recording audio..." : "Intent ready"}
        </Text>

        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[
            S.mainMicBtn,
            {
              backgroundColor: isRecording ? "#FF4D4D" : "#7c6fe0",
            }
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MaterialCommunityIcons name={isRecording ? "stop" : "microphone"} size={28} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTextScreen = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={S.screenContent}
    >
      <ScrollView
        style={S.scrollArea}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={S.sectionLabel}>Natural Language Input</Text>
        <View style={S.nlpInputWrap}>
          <TextInput
            multiline
            numberOfLines={3}
            value={nlpInput}
            onChangeText={setNlpInput}
            onBlur={handleExtract}
            placeholder="Type your intent here... (e.g. 'Project meeting tomorrow at 2pm')"
            placeholderTextColor="#555"
            style={S.nlpInput}
          />
          <TouchableOpacity onPress={handleExtract} style={S.sparkleIcon}>
            <Text style={{ fontSize: 18 }}>✨</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.structHeader}>Structured Intelligence</Text>

        {/* Subject */}
        <View style={S.fieldGroup}>
          <Text style={S.fieldLabel}>Subject</Text>
          <View style={S.pillRow}>
            <View style={[S.activePill, { backgroundColor: colors.primary }]}>
               <Text style={S.activePillText}>{subject || "Untitled Task"}</Text>
            </View>
            <TouchableOpacity style={S.addPill}>
              <Text style={{ color: "#7c7c99", fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Edit subject..."
            placeholderTextColor="#555"
            style={S.darkInput}
          />
        </View>

        {/* Action Type */}
        <View style={S.fieldGroup}>
          <Text style={S.fieldLabel}>Action Type</Text>
          <View style={S.catRow}>
            {ACTION_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActionType(cat.id)}
                style={[
                  S.catBtn,
                  {
                    backgroundColor: actionType === cat.id ? "#2a2a3e" : "#13131f",
                    borderColor: actionType === cat.id ? colors.primary : "#2a2a3e",
                  }
                ]}
              >
                <Text>{cat.icon} </Text>
                <Text style={{ color: actionType === cat.id ? "#fff" : "#7c7c99", fontWeight: "600", fontSize: 12 }}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date & Time */}
        <View style={S.row}>
           <View style={{ flex: 1 }}>
              <Text style={S.fieldLabel}>Date</Text>
              <View style={S.iconInputWrap}>
                <Feather name="calendar" size={14} color="#7c7c99" />
                <TextInput value={date} onChangeText={setDate} style={S.iconInput} placeholder="YYYY-MM-DD" placeholderTextColor="#555" />
              </View>
           </View>
           <View style={{ flex: 1 }}>
              <Text style={S.fieldLabel}>Time</Text>
              <View style={S.iconInputWrap}>
                <Feather name="clock" size={14} color="#7c7c99" />
                <TextInput value={time} onChangeText={setTime} style={S.iconInput} placeholder="14:00" placeholderTextColor="#555" />
              </View>
           </View>
        </View>

        {/* Location */}
        <View style={S.fieldGroup}>
          <Text style={S.fieldLabel}>Location</Text>
          <TextInput value={location} onChangeText={setLocation} style={S.darkInput} placeholder="Enter location..." placeholderTextColor="#555" />
        </View>

        {/* Priority */}
        <View style={S.fieldGroup}>
          <Text style={S.fieldLabel}>Priority</Text>
          <View style={S.prioRow}>
            {PRIORITY_OPTIONS.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  S.prioBtn,
                  {
                    backgroundColor: priority === p ? PRIORITY_COLORS[p] : "#13131f",
                    borderColor: priority === p ? PRIORITY_COLORS[p] : "#2a2a3e",
                  }
                ]}
              >
                <Text style={{ color: priority === p ? "#fff" : "#7c7c99", fontWeight: "700", fontSize: 11 }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status */}
        <View style={S.fieldGroup}>
          <Text style={S.fieldLabel}>Initial Status</Text>
          <View style={S.prioRow}>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setTaskStatus(s)}
                style={[
                  S.prioBtn,
                  {
                    backgroundColor: taskStatus === s ? STATUS_COLORS[s] : "#13131f",
                    borderColor: taskStatus === s ? STATUS_COLORS[s] : "#2a2a3e",
                  }
                ]}
              >
                <Text style={{ color: taskStatus === s ? "#fff" : "#7c7c99", fontWeight: "700", fontSize: 11 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
            "Active" intents appear immediately in your homepage dashboard.
          </Text>
        </View>

        {/* Tags */}
        <View style={S.fieldGroup}>
          <Text style={S.fieldLabel}>Tags</Text>
          <View style={S.tagsWrap}>
            {tags.map(tag => (
              <View key={tag} style={S.tagChip}>
                <Text style={S.tagText}>#{tag}</Text>
                <TouchableOpacity onPress={() => setTags(tags.filter(t => t !== tag))}>
                   <Feather name="x" size={12} color="#a78bfa" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            style={S.darkInput}
            placeholder="Add tag and press enter..."
            placeholderTextColor="#555"
          />
        </View>
      </ScrollView>

      {/* Text Screen Bottom Bar */}
      <View style={[S.bottomBar, { gap: 12 }]}>
        <TouchableOpacity style={S.dictateBtn} onPress={() => setScreen("voice")}>
           <MaterialCommunityIcons name="microphone" size={20} color="#a78bfa" />
           <Text style={S.dictateBtnText}>Dictate</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[S.saveActionBtn, { backgroundColor: colors.primary }]} onPress={handleConfirmSave}>
           {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={S.saveActionBtnText}>✦ Save Intent</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const handleConfirmSave = () => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
     handleSave();
  };

  return (
    <SafeAreaView style={S.container}>
      {/* Background Orbs */}
      <View style={S.orb1} />
      <View style={S.orb2} />

      {/* Custom Header Tab Bar */}
      <View style={[S.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={S.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#7c7c99" />
        </TouchableOpacity>

        <View style={S.tabBar}>
          {(["voice", "text"] as Screen[]).map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setScreen(s)}
              style={[
                S.tabBtn,
                screen === s && { backgroundColor: colors.primary }
              ]}
            >
              <Text style={[S.tabText, screen === s && { color: "#fff" }]}>
                {s === "voice" ? "🎤 Voice" : "✏️ Text"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ width: 44 }} />
      </View>

      {/* Screen Content */}
      <View style={{ flex: 1 }}>
        {screen === "voice" ? renderVoiceScreen() : renderTextScreen()}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e18",
  },
  orb1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(124,111,224,0.12)",
  },
  orb2: {
    position: "absolute",
    bottom: 50,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(167,139,250,0.08)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#13131f",
    borderRadius: 25,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1e1e2e",
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 0.5,
  },
  screenContent: {
    flex: 1,
  },
  voiceWaveSection: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 8,
  },
  transcriptBox: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  voiceTranscriptText: {
    fontSize: 28,
    color: "#e0dff5",
    fontFamily: Fonts.medium,
    lineHeight: 38,
  },
  voiceCursor: {
    width: 3,
    height: 28,
    backgroundColor: "#7c6fe0",
    marginLeft: 4,
  },
  entitiesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 20,
  },
  confSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  confRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  confLabel: {
    fontSize: 9,
    color: "#555",
    fontFamily: Fonts.bold,
    letterSpacing: 1.2,
  },
  confTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#1e1e2e",
    borderRadius: 2,
    overflow: "hidden",
  },
  confFill: {
    height: "100%",
    backgroundColor: "#7c6fe0",
  },
  confValue: {
    fontSize: 10,
    color: "#a78bfa",
    fontFamily: Fonts.bold,
  },
  entityTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,111,224,0.15)",
    borderWidth: 1,
    borderColor: "rgba(124,111,224,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  entityIcon: { fontSize: 14, marginRight: 4 },
  entityLabel: { fontSize: 10, color: "#7c7c99", fontFamily: Fonts.bold },
  entityValue: { fontSize: 10, color: "#a78bfa", fontFamily: Fonts.bold },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: "#1a1a2e",
  },
  bottomIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    flex: 1,
    color: "#555",
    fontSize: 13,
    marginLeft: 12,
    fontFamily: Fonts.regular,
  },
  mainMicBtn: {
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c6fe0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 10,
    color: "#555",
    fontFamily: Fonts.bold,
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  nlpInputWrap: {
    backgroundColor: "#13131f",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    borderRadius: 15,
    padding: 12,
    marginBottom: 20,
  },
  nlpInput: {
    color: "#e0dff5",
    fontSize: 15,
    fontFamily: Fonts.regular,
    textAlignVertical: "top",
    minHeight: 80,
  },
  sparkleIcon: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  structHeader: {
    fontSize: 18,
    fontFamily: Fonts.displayBold,
    color: "#e0dff5",
    marginBottom: 15,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#7c7c99",
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  activePill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activePillText: {
    color: "#fff",
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  addPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    alignItems: "center",
    justifyContent: "center",
  },
  darkInput: {
    backgroundColor: "#13131f",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    borderRadius: 12,
    padding: 12,
    color: "#e0dff5",
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  catRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  iconInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#13131f",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
  },
  iconInput: {
    flex: 1,
    color: "#e0dff5",
    fontSize: 13,
    marginLeft: 8,
    fontFamily: Fonts.regular,
  },
  prioRow: {
    flexDirection: "row",
    gap: 8,
  },
  prioBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,111,224,0.15)",
    borderWidth: 1,
    borderColor: "rgba(124,111,224,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  tagText: {
    fontSize: 12,
    color: "#a78bfa",
    fontFamily: Fonts.bold,
    marginRight: 6,
  },
  dictateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    borderRadius: 12,
    height: 50,
    gap: 8,
  },
  dictateBtnText: {
    color: "#a78bfa",
    fontWeight: "700",
    fontSize: 14,
  },
  saveActionBtn: {
    flex: 1.5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    height: 50,
    shadowColor: "#7c6fe0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  saveActionBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
