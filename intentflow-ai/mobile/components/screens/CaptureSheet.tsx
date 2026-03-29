import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import BottomSheet from '@/components/ui/BottomSheet';
import GradientButton from '@/components/ui/GradientButton';
import OutlineButton from '@/components/ui/OutlineButton';
import GhostButton from '@/components/ui/GhostButton';
import ConfidenceGauge from '@/components/ui/ConfidenceGauge';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { CaptureStep, AIExtraction, Priority, Category } from '@/types/index';
import { useStore } from '@/store/useStore';

interface CaptureSheetProps {
  visible: boolean;
  onClose: () => void;
}

const MOCK_EXTRACTION: AIExtraction = {
  title: 'Call John about contract renewal',
  date: 'Tomorrow, Mar 19',
  time: '3:00 PM',
  priority: 'high',
  category: 'Work',
  people: ['John'],
  confidence: 88,
  fields: [
    { label: 'Title', value: 'Call John about contract renewal', icon: '📋', confidence: 95 },
    { label: 'Date', value: 'Tomorrow, Mar 19', icon: '📅', confidence: 90 },
    { label: 'Time', value: '3:00 PM', icon: '⏰', confidence: 85 },
    { label: 'Priority', value: 'High', icon: '⚡', confidence: 78 },
    { label: 'Category', value: 'Work', icon: '🏷', confidence: 92 },
    { label: 'People', value: 'John', icon: '👤', confidence: 70 },
  ],
};

// ── Waveform bars ────────────────────────────────────────────────────────────
function WaveformBars() {
  const bars = [
    useRef(new Animated.Value(14)).current,
    useRef(new Animated.Value(28)).current,
    useRef(new Animated.Value(18)).current,
    useRef(new Animated.Value(36)).current,
    useRef(new Animated.Value(22)).current,
  ];
  const targets = [38, 52, 26, 48, 32];

  useEffect(() => {
    const anims = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: targets[i],
            duration: 280 + i * 60,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 14,
            duration: 280 + i * 60,
            useNativeDriver: false,
          }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={wavStyles.row}>
      {bars.map((h, i) => (
        <Animated.View
          key={i}
          style={[wavStyles.bar, { height: h, opacity: 0.85 + i * 0.03 }]}
        />
      ))}
    </View>
  );
}

const wavStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bar: { width: 5, backgroundColor: Colors.brandBlue, borderRadius: 3 },
});

// ── Shimmer skeleton ─────────────────────────────────────────────────────────
function ShimmerBlock({ widthPct = 80, height = 16 }: { widthPct?: number; height?: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ width: `${widthPct}%` as `${number}%`, height, borderRadius: 6, overflow: 'hidden' }}>
      <Animated.View
        style={{ flex: 1, backgroundColor: Colors.elevated, opacity: anim }}
      />
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CaptureSheet({ visible, onClose }: CaptureSheetProps) {
  const [step, setStep] = useState<CaptureStep>('input');
  const [inputText, setInputText] = useState('');
  const [extraction, setExtraction] = useState<AIExtraction | null>(null);
  const { addTask, showToast } = useStore();
  const spinAnim = useRef(new Animated.Value(0)).current;

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleClose = useCallback(() => {
    setStep('input');
    setInputText('');
    setExtraction(null);
    onClose();
  }, [onClose]);

  const getIconForField = (key: string) => {
    const icons: Record<string, string> = {
      title: '📋', due_date: '📅', due_time: '⏰',
      priority: '⚡', category: '🏷', people: '👤'
    };
    return icons[key] || '✨';
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setStep('processing');
    spinAnim.setValue(0);
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    );
    spinLoop.start();

    try {
      // Use localhost by default (Works for iOS Simulator/Web). 
      // Note: If using Android Emulator, you may need to use 10.0.2.2 instead.
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      
      const res = await fetch(`${API_URL}/api/nlp/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputText }),
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Failed to extract intent');
      
      const { data, confidence } = result;

      // Convert backend data into UI AIExtraction presentation format
      const dynamicFields = Object.entries(data).filter(([k,v]) => v !== null && v !== '').map(([key, value]) => ({
        label: key.replace('_', ' '),
        value: Array.isArray(value) ? value.join(', ') : String(value),
        icon: getIconForField(key),
        confidence: Math.min(confidence + Math.floor(Math.random() * 10), 100) // Dummy item confidence for UI shine
      }));

      const finalExtraction: AIExtraction = {
        title: data.title,
        date: data.due_date,
        time: data.due_time,
        priority: data.priority,
        category: data.category,
        people: data.people,
        confidence: confidence,
        fields: dynamicFields
      };

      setExtraction(finalExtraction);
      setStep('preview');
    } catch (error: any) {
      console.error('NLP Error:', error);
      showToast('error', error.message || 'AI Extraction failed.');
      setStep('input');
    } finally {
      spinLoop.stop();
      spinAnim.setValue(0);
    }
  };

  const handleRecord = () => {
    if (step === 'recording') {
      setInputText('Call John tomorrow at 3pm about contract renewal');
      setStep('input');
    } else {
      setStep('recording');
    }
  };

  const handleConfirm = async () => {
    if (!extraction) return;
    await addTask({
      title: extraction.title,
      priority: extraction.priority as Priority,
      category: extraction.category as Category,
      dueDate: extraction.date,
      dueTime: extraction.time,
      people: extraction.people,
      status: 'active',
      subtasks: [],
    });
    // showToast is natively handled securely by the store upon completion!
    handleClose();
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} snapHeight={0.65}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Task</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ── INPUT STATE ── */}
      {step === 'input' && (
        <View style={styles.body}>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              placeholder="What do you need to do?"
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            {!inputText && (
              <Text style={styles.hint}>Try: "Call John tomorrow at 3pm"</Text>
            )}
            <View style={styles.textAreaBottom}>
              <Text style={styles.charCount}>{inputText.length}/500</Text>
              <TouchableOpacity onPress={handleRecord} style={styles.micBtn}>
                <Text style={styles.micIcon}>🎙</Text>
              </TouchableOpacity>
            </View>
          </View>
          <GradientButton
            label="Analyse with AI →"
            onPress={handleSubmit}
            disabled={!inputText.trim()}
            style={styles.submitBtn}
          />
        </View>
      )}

      {/* ── RECORDING STATE ── */}
      {step === 'recording' && (
        <View style={styles.centeredBody}>
          <WaveformBars />
          <Text style={styles.listeningText}>Listening...</Text>
          <TouchableOpacity onPress={handleRecord} style={styles.stopBtn}>
            <Text style={styles.stopText}>■ Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── PROCESSING STATE ── */}
      {step === 'processing' && (
        <View style={styles.centeredBody}>
          <Animated.View style={{ transform: [{ rotate: spin }], marginBottom: 20 }}>
            <View style={styles.spinArc}>
              <View style={styles.spinDot} />
            </View>
          </Animated.View>
          <Text style={styles.processingText}>AI is reading your intent...</Text>
          <View style={styles.skeletons}>
          <ShimmerBlock widthPct={80} height={20} />
            <ShimmerBlock widthPct={60} />
            <ShimmerBlock widthPct={70} />
            <ShimmerBlock widthPct={50} />
          </View>
        </View>
      )}

      {/* ── PREVIEW STATE ── */}
      {step === 'preview' && extraction && (
        <View style={styles.body}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>AI Interpretation</Text>
            <ConfidenceGauge percentage={extraction.confidence} />
          </View>

          <View style={styles.fieldsList}>
            {extraction.fields.map((field, i) => {
              const lowConf = field.confidence < 75;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.fieldRow, lowConf && styles.fieldRowLow]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fieldIcon}>{field.icon}</Text>
                  <View style={styles.fieldInfo}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={[styles.fieldValue, lowConf && { color: Colors.warning }]}>
                      {field.value}
                    </Text>
                  </View>
                  <Text style={styles.editHint}>tap to edit</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <GradientButton label="✓ Confirm" onPress={handleConfirm} height={52} />
            <OutlineButton
              label="✎ Edit"
              onPress={() => setStep('input')}
              height={48}
              style={styles.actionGap}
            />
            <GhostButton
              label="✗ Discard"
              onPress={handleClose}
              style={styles.actionGap}
            />
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.elevated,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  body: {
    padding: Spacing.sm,
  },
  textAreaWrapper: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    minHeight: 120,
  },
  textArea: {
    fontFamily: Fonts.regular,
    fontSize: 17,
    color: Colors.textPrimary,
    minHeight: 72,
    lineHeight: 24,
  },
  hint: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.elevated,
    marginTop: 4,
  },
  textAreaBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  charCount: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brandBlue + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: { fontSize: 18 },
  submitBtn: { marginTop: 4 },

  // Centered (recording/processing)
  centeredBody: {
    padding: Spacing.sm,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  listeningText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.brandBlue,
  },
  stopBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stopText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Processing
  spinArc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: Colors.elevated,
    borderTopColor: Colors.brandBlue,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 2,
  },
  spinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandBlue,
  },
  processingText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  skeletons: {
    width: '100%',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 12,
  },

  // Preview
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  fieldsList: {
    gap: 2,
    marginBottom: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.elevated,
  },
  fieldRowLow: {
    borderLeftColor: Colors.warning,
    backgroundColor: Colors.warning + '09',
  },
  fieldIcon: { fontSize: 18 },
  fieldInfo: { flex: 1 },
  fieldLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  editHint: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  actionGap: {
    marginTop: 0,
  },
});
