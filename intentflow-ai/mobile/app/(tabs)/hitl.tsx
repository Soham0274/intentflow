import React, { useState, useEffect } from "react";
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
  withDelay,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { StatusBadge } from "@/components/StatusBadge";
import { AvatarButton } from "@/components/AvatarButton";
import { useApp } from "@/context/AppContext";

type HITLStage = "parse-error" | "manual-edit" | "review" | "success";

interface ParsedField {
  label: string;
  value: string;
  status: "ambiguous" | "failed" | "none" | "ok";
  confidence: number;
  editValue: string;
}

const INITIAL_FIELDS: ParsedField[] = [
  {
    label: "Entity",
    value: '"Contact?"',
    status: "ambiguous",
    confidence: 38,
    editValue: "",
  },
  {
    label: "Action",
    value: "[Unrecognized]",
    status: "failed",
    confidence: 0,
    editValue: "",
  },
  {
    label: "Trigger",
    value: "None detected",
    status: "none",
    confidence: 0,
    editValue: "",
  },
];

function ConfidenceBar({
  value,
  delay = 0,
}: {
  value: number;
  delay?: number;
}) {
  const colors = useColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(value, { duration: 700 }));
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));

  const barColor =
    value >= 70
      ? colors.intentSuccess
      : value >= 40
      ? colors.intentWarning
      : colors.intentError;

  return (
    <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
      <Animated.View
        style={[styles.barFill, barStyle, { backgroundColor: barColor }]}
      />
    </View>
  );
}

function FieldStatusBadge({ status }: { status: ParsedField["status"] }) {
  const colors = useColors();
  const config = {
    ambiguous: { label: "Ambiguous", bg: colors.intentWarning + "22", text: colors.intentWarning },
    failed: { label: "Failed", bg: colors.intentError + "22", text: colors.intentError },
    none: { label: "—", bg: colors.muted, text: colors.mutedForeground },
    ok: { label: "Confirmed", bg: colors.intentSuccess + "22", text: colors.intentSuccess },
  }[status];

  return (
    <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusPillText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
}

interface EditFieldProps {
  field: ParsedField;
  index: number;
  onUpdate: (i: number, val: string) => void;
  isFocused: boolean;
  onFocus: () => void;
}

function EditField({ field, index, onUpdate, isFocused, onFocus }: EditFieldProps) {
  const colors = useColors();
  const suggestions: Record<string, string[]> = {
    Entity: ["Contact Name", "Team Member", "Marketing Team", "Dev Team"],
    Action: ["Follow up", "Send report", "Schedule call", "Review doc"],
    Trigger: ["Today, 3:00 PM", "Tomorrow, 9:00 AM", "This Friday", "In 2 hours"],
  };

  const fieldSuggestions = suggestions[field.label] ?? [];

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <View
        style={[
          styles.editField,
          {
            backgroundColor: colors.card,
            borderColor: isFocused ? colors.primary : colors.border,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        <View style={styles.editFieldHeader}>
          <Text style={[styles.editFieldLabel, { color: colors.mutedForeground }]}>
            {field.label.toUpperCase()}
          </Text>
          <FieldStatusBadge status={field.status} />
        </View>

        <View
          style={[
            styles.editInputRow,
            { backgroundColor: colors.input, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.editInput, { color: colors.foreground }]}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            placeholderTextColor={colors.mutedForeground}
            value={field.editValue}
            onChangeText={(v) => onUpdate(index, v)}
            onFocus={onFocus}
            autoCorrect={false}
          />
          {field.editValue.length > 0 && (
            <TouchableOpacity onPress={() => onUpdate(index, "")}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {isFocused && fieldSuggestions.length > 0 && (
          <Animated.View entering={FadeIn} style={styles.suggestionsRow}>
            {fieldSuggestions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  onUpdate(index, s);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.suggestionChip,
                  { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" },
                ]}
              >
                <Text style={[styles.suggestionText, { color: colors.primary }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {field.editValue.length === 0 && (
          <Text style={[styles.originalValue, { color: colors.mutedForeground }]}>
            AI parsed: {field.value}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function HITLScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userInitial, addTask } = useApp();

  const [stage, setStage] = useState<HITLStage>("parse-error");
  const [fields, setFields] = useState<ParsedField[]>(INITIAL_FIELDS);
  const [focusedField, setFocusedField] = useState<number | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const overallConfidence = Math.round(
    fields.reduce((a, f) => a + f.confidence, 0) / fields.length
  );

  const updateField = (i: number, val: string) => {
    setFields((prev) =>
      prev.map((f, idx) =>
        idx === i
          ? { ...f, editValue: val, status: val.length > 0 ? "ok" : f.status }
          : f
      )
    );
  };

  const handleRetryVoice = () => {
    setIsRetrying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      setIsRetrying(false);
      router.replace("/(tabs)/home");
    }, 1200);
  };

  const handleSwitchToText = () => {
    Haptics.selectionAsync();
    setStage("manual-edit");
  };

  const handleSubmitEdits = () => {
    const resolvedFields = fields.map((f) => ({
      ...f,
      value: f.editValue || f.value,
      status: f.editValue.length > 0 ? ("ok" as const) : f.status,
      confidence: f.editValue.length > 0 ? 100 : f.confidence,
    }));
    setFields(resolvedFields);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStage("review");
  };

  const handleFinalConfirm = () => {
    const entityField = fields.find((f) => f.label === "Entity");
    const actionField = fields.find((f) => f.label === "Action");
    const triggerField = fields.find((f) => f.label === "Trigger");

    addTask({
      id: `INT-${Date.now().toString().slice(-4)}`,
      entity: entityField?.editValue || entityField?.value || "Unknown",
      action: actionField?.editValue || actionField?.value || "Follow up",
      trigger: triggerField?.editValue || triggerField?.value || "ASAP",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });

    setStage("success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => router.replace("/(tabs)/home"), 1400);
  };

  return (
    <GradientBackground
      style={
        stage === "parse-error"
          ? { backgroundColor: "#110A0A" }
          : undefined
      }
    >
      {stage === "parse-error" && (
        <View
          style={[
            styles.errorGlow,
            { backgroundColor: colors.intentError + "12" },
          ]}
        />
      )}

      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity
          onPress={() => {
            if (stage === "manual-edit" || stage === "review") {
              setStage("parse-error");
            } else {
              router.back();
            }
          }}
          style={[
            styles.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>

        <StatusBadge
          status={
            stage === "parse-error"
              ? "error"
              : stage === "review" || stage === "success"
              ? "success"
              : "warning"
          }
          text={
            stage === "parse-error"
              ? "Low Confidence"
              : stage === "manual-edit"
              ? "Manual Review"
              : stage === "review"
              ? "Ready to Confirm"
              : "Confirmed"
          }
        />
        <AvatarButton
          initial={userInitial}
          onPress={() => router.push("/(tabs)/profile")}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: bottomPad + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Parse Error State */}
          {stage === "parse-error" && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
              <View style={styles.errorTag}>
                <Feather name="alert-circle" size={14} color={colors.intentError} />
                <Text style={[styles.errorCode, { color: colors.intentError }]}>
                  PARSE ERROR 0x402
                </Text>
              </View>

              <Text style={[styles.mainTitle, { color: colors.foreground }]}>
                I couldn't quite catch that. Could you clarify?
              </Text>

              <View
                style={[
                  styles.analysisCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.intentError + "40",
                  },
                ]}
              >
                <View style={styles.analysisHeader}>
                  <Text
                    style={[styles.analysisLabel, { color: colors.mutedForeground }]}
                  >
                    RESULTING ANALYSIS
                  </Text>
                  <View style={styles.confidenceRow}>
                    <Text
                      style={[styles.confidenceNum, { color: colors.intentError }]}
                    >
                      {overallConfidence}%
                    </Text>
                    <ConfidenceBar value={overallConfidence} />
                  </View>
                </View>

                {fields.map((field, i) => (
                  <Animated.View
                    key={field.label}
                    entering={FadeInDown.delay(i * 100 + 200)}
                    style={[
                      styles.analysisRow,
                      i > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.analysisRowLabel,
                        { color: colors.mutedForeground, opacity: 0.7 },
                      ]}
                    >
                      {field.label}
                    </Text>
                    <View style={styles.analysisRowRight}>
                      <Text
                        style={[
                          styles.analysisRowValue,
                          {
                            color:
                              field.status === "failed" || field.status === "none"
                                ? colors.mutedForeground
                                : colors.foreground,
                          },
                        ]}
                      >
                        {field.value}
                      </Text>
                      <FieldStatusBadge status={field.status} />
                    </View>
                  </Animated.View>
                ))}
              </View>

              <Animated.View
                entering={FadeInDown.delay(500)}
                style={styles.actionsCol}
              >
                <TouchableOpacity
                  style={[
                    styles.retryBtn,
                    {
                      backgroundColor: isRetrying
                        ? colors.card
                        : colors.foreground,
                    },
                  ]}
                  onPress={handleRetryVoice}
                  activeOpacity={0.85}
                  disabled={isRetrying}
                >
                  <Feather
                    name="mic"
                    size={18}
                    color={isRetrying ? colors.mutedForeground : colors.background}
                  />
                  <Text
                    style={[
                      styles.retryBtnText,
                      {
                        color: isRetrying
                          ? colors.mutedForeground
                          : colors.background,
                      },
                    ]}
                  >
                    {isRetrying ? "Listening..." : "Retry Voice Input"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.textModeBtn,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={handleSwitchToText}
                  activeOpacity={0.85}
                >
                  <Feather name="edit-3" size={16} color={colors.foreground} />
                  <Text style={[styles.textModeBtnText, { color: colors.foreground }]}>
                    Switch to Text Mode
                  </Text>
                </TouchableOpacity>

                <View
                  style={[styles.hintBox, { backgroundColor: colors.muted }]}
                >
                  <Feather name="info" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                    HITL mode activated — your input will be reviewed and corrected manually before the action is created.
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>
          )}

          {/* Manual Edit State */}
          {stage === "manual-edit" && (
            <Animated.View
              entering={SlideInRight.springify()}
              exiting={SlideOutLeft}
              style={styles.content}
            >
              <View style={styles.editHeader}>
                <View
                  style={[
                    styles.editHeaderIcon,
                    { backgroundColor: colors.intentWarning + "18" },
                  ]}
                >
                  <Feather name="edit-2" size={18} color={colors.intentWarning} />
                </View>
                <View style={styles.editHeaderText}>
                  <Text style={[styles.editTitle, { color: colors.foreground }]}>
                    Manual Correction
                  </Text>
                  <Text
                    style={[styles.editSubtitle, { color: colors.mutedForeground }]}
                  >
                    Fix what the AI missed — fill in the fields below
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.progressRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {fields.map((f, i) => (
                  <View key={f.label} style={styles.progressItem}>
                    <View
                      style={[
                        styles.progressDot,
                        {
                          backgroundColor:
                            f.editValue.length > 0
                              ? colors.intentSuccess
                              : colors.muted,
                          borderColor:
                            f.editValue.length > 0
                              ? colors.intentSuccess
                              : colors.border,
                        },
                      ]}
                    >
                      {f.editValue.length > 0 && (
                        <Feather name="check" size={10} color="#fff" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.progressLabel,
                        {
                          color:
                            f.editValue.length > 0
                              ? colors.intentSuccess
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.fieldsCol}>
                {fields.map((field, i) => (
                  <EditField
                    key={field.label}
                    field={field}
                    index={i}
                    onUpdate={updateField}
                    isFocused={focusedField === i}
                    onFocus={() => setFocusedField(i)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity:
                      fields.every((f) => f.editValue.length > 0) ? 1 : 0.5,
                  },
                ]}
                onPress={handleSubmitEdits}
                disabled={!fields.every((f) => f.editValue.length > 0)}
                activeOpacity={0.85}
              >
                <Text style={[styles.submitBtnText, { color: "#fff" }]}>
                  Review Intent
                </Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>

              <Text style={[styles.allRequired, { color: colors.mutedForeground }]}>
                All fields required to proceed
              </Text>
            </Animated.View>
          )}

          {/* Review State */}
          {stage === "review" && (
            <Animated.View
              entering={SlideInRight.springify()}
              exiting={SlideOutLeft}
              style={styles.content}
            >
              <Animated.View entering={FadeIn} style={styles.reviewIconRow}>
                <View
                  style={[
                    styles.reviewIcon,
                    { backgroundColor: colors.intentSuccess + "18" },
                  ]}
                >
                  <Feather name="check-circle" size={32} color={colors.intentSuccess} />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100)} style={styles.reviewTitleArea}>
                <Text style={[styles.reviewTitle, { color: colors.foreground }]}>
                  Ready to set this reminder?
                </Text>
                <Text
                  style={[styles.reviewSubtitle, { color: colors.mutedForeground }]}
                >
                  Everything looks correct based on your input.
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(200)}
                style={[
                  styles.reviewCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {fields.map((field, i) => (
                  <View
                    key={field.label}
                    style={[
                      styles.reviewRow,
                      i > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reviewRowLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {field.label.toUpperCase()}
                    </Text>
                    <View style={styles.reviewRowValue}>
                      <Text
                        style={[styles.reviewValue, { color: colors.foreground }]}
                      >
                        {field.editValue || field.value}
                      </Text>
                      <View
                        style={[
                          styles.confirmedBadge,
                          { backgroundColor: colors.intentSuccess + "18" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.confirmedBadgeText,
                            { color: colors.intentSuccess },
                          ]}
                        >
                          CONFIRMED
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(320)}
                style={[
                  styles.syncNote,
                  {
                    backgroundColor: colors.intentSuccess + "10",
                    borderColor: colors.intentSuccess + "30",
                  },
                ]}
              >
                <View
                  style={[
                    styles.syncDot,
                    { backgroundColor: colors.intentSuccess },
                  ]}
                />
                <Text
                  style={[styles.syncText, { color: colors.mutedForeground }]}
                >
                  Human-verified intent. This task bypasses auto-confirmation and is logged as HITL-reviewed.
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(400)}
                style={styles.reviewActions}
              >
                <TouchableOpacity
                  style={[
                    styles.confirmFinalBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleFinalConfirm}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.confirmFinalText, { color: "#fff" }]}
                  >
                    Confirm Task
                  </Text>
                  <Feather name="check" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.editAgainBtn,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => setStage("manual-edit")}
                  activeOpacity={0.85}
                >
                  <Feather name="edit-2" size={14} color={colors.foreground} />
                  <Text
                    style={[styles.editAgainText, { color: colors.foreground }]}
                  >
                    Edit Details
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStage("parse-error")}>
                  <Text
                    style={[styles.cancelLink, { color: colors.mutedForeground }]}
                  >
                    CANCEL REQUEST
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}

          {/* Success */}
          {stage === "success" && (
            <Animated.View
              entering={FadeIn.springify()}
              style={[styles.content, styles.successContent]}
            >
              <View
                style={[
                  styles.successIcon,
                  { backgroundColor: colors.intentSuccess + "18" },
                ]}
              >
                <Feather name="check-circle" size={48} color={colors.intentSuccess} />
              </View>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>
                Task Created
              </Text>
              <Text
                style={[styles.successSub, { color: colors.mutedForeground }]}
              >
                HITL review complete — redirecting...
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  errorGlow: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexGrow: 1,
  },
  content: { gap: 20 },
  errorTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  errorCode: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  analysisCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  analysisHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  analysisLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confidenceNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    width: 44,
  },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  analysisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  analysisRowLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    width: 64,
  },
  analysisRowRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
  analysisRowValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  actionsCol: { gap: 12 },
  retryBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  retryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  textModeBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  textModeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    padding: 13,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  editHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  editHeaderText: { flex: 1 },
  editTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  editSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 19,
  },
  progressRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    justifyContent: "space-around",
  },
  progressItem: {
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  fieldsCol: { gap: 12 },
  editField: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  editFieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editFieldLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
  },
  editInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    padding: 0,
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  originalValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  submitBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  allRequired: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: -8,
  },
  reviewIconRow: { alignItems: "center" },
  reviewIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewTitleArea: { alignItems: "center", gap: 6 },
  reviewTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  reviewSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  reviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  reviewRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reviewRowLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  reviewRowValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  reviewValue: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  confirmedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  confirmedBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.7,
  },
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
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  reviewActions: {
    gap: 12,
    alignItems: "center",
  },
  confirmFinalBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  confirmFinalText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  editAgainBtn: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editAgainText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cancelLink: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 4,
  },
  successContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 16,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
