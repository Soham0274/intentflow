import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { BottomNavBar } from '../components/BottomNavBar';
import { useRouter } from 'expo-router';

// ─── Waveform ──────────────────────────────────────────────────────────────
const WaveformVisualizer: React.FC<{ active: boolean }> = ({ active }) => {
  const { colors } = useTheme();
  const heights = [14, 22, 32, 18, 26, 36, 22, 16, 28, 20, 34, 18];
  const anims = useRef(heights.map(h => new Animated.Value(h))).current;

  useEffect(() => {
    if (!active) return;
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue:  Math.random() * 36 + 8,
            duration: 300 + i * 40,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue:  heights[i],
            duration: 300 + i * 40,
            useNativeDriver: false,
          }),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, [active]);

  return (
    <View style={styles.waveRow}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width:        4,
            height:       anim,
            borderRadius: 2,
            backgroundColor: i % 3 === 0 ? colors.purple : colors.teal,
            opacity:      0.6 + (i % 3) * 0.15,
            marginHorizontal: 2,
          }}
        />
      ))}
    </View>
  );
};

// ─── Parsing Row ───────────────────────────────────────────────────────────
interface ParseRowProps {
  label:  string;
  value:  string;
  confidence?: number;
  tag?:   string;
  tagColor?: string;
}

const ParseRow: React.FC<ParseRowProps> = ({ label, value, confidence, tag, tagColor }) => {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.parseRow}>
      <Text style={[typography.labelMD, { color: colors.textMuted, width: 72 }]}>{label}</Text>
      <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>{value}</Text>
      {confidence !== undefined && <ConfidenceBadge value={confidence} />}
      {tag && (
        <View style={[styles.tagBadge, { backgroundColor: tagColor ?? colors.purpleDim }]}>
          <Text style={[typography.statusSM, { color: tagColor ? '#FFF' : colors.purple, fontSize: 8 }]}>{tag}</Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function VoiceListeningScreen() {
  const { colors, typography } = useTheme();
  const [isListening, setIsListening] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const transcript = 'Remind me to follow up with Arjun after the ';
  const fadedPart  = '3pm call';

  // Mic pulse glow
  useEffect(() => {
    if (!isListening) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [isListening]);

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.root}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.menuBtn}>
          <Ionicons name="menu" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <StatusPill variant="online" />
        <View style={s.avatar}>
          <Text style={[typography.bodyBold, { color: '#FFF' }]}>A</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Listening Label */}
        <View style={s.listeningLabel}>
          <MaterialCommunityIcons name="microphone-outline" size={14} color={colors.teal} />
          <Text style={[typography.statusLG, { color: colors.teal, marginLeft: 6 }]}>Listening</Text>
        </View>

        {/* Transcript */}
        <Text style={[typography.headingLG, { color: colors.textPrimary, marginBottom: 4, lineHeight: 40 }]}>
          {transcript}
          <Text style={{ color: colors.textMuted }}>{fadedPart}</Text>
        </Text>

        {/* Parsing Panel */}
        <View style={s.parsingCard}>
          <View style={s.parsingHeader}>
            <Text style={[typography.statusSM, { color: colors.teal }]}>Parsing Intent...</Text>
          </View>
          <View style={s.divider} />
          <ParseRow label="Entity"   value="Arjun"     confidence={98} />
          <ParseRow label="Action"   value="Follow up" confidence={95} />
          <ParseRow label="Trigger"  value="After 15:00..." tag="calc" tagColor={colors.orange} />
        </View>

        <WaveformVisualizer active={isListening} />
      </ScrollView>

      {/* Bottom Voice Bar */}
      <View style={s.voiceBar}>
        <View style={s.voiceBarLeft}>
          <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Listening</Text>
          <Text style={[typography.statusSM, { color: colors.teal, marginTop: 2 }]}>Voice Mode Active</Text>
        </View>
        <TouchableOpacity style={s.kbBtn}>
          <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Pulsing Mic FAB */}
        <View style={s.micContainer}>
          <Animated.View style={[s.micGlow, { transform: [{ scale: pulseAnim }], backgroundColor: colors.purpleDim }]} />
          <TouchableOpacity
            style={[s.micBtn, { backgroundColor: colors.purple }]}
            onPress={() => {
              setIsListening(p => !p);
              // Navigate to review screen representing HITL Review when stopped
              router.push('/review');
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="mic" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <BottomNavBar />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  waveRow:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 32, height: 48 },
  parseRow:      { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  tagBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});

const makeStyles = (c: ReturnType<typeof import('../theme/colors').DarkColors extends infer T ? () => T : never>) =>
  StyleSheet.create({
    root:          { flex: 1, backgroundColor: c.bg },
    topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    menuBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: c.bgCard, alignItems: 'center', justifyContent: 'center' },
    avatar:        { width: 40, height: 40, borderRadius: 20, backgroundColor: c.teal, alignItems: 'center', justifyContent: 'center' },
    body:          { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 160 },
    listeningLabel:{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    parsingCard:   { backgroundColor: c.bgCard, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginTop: 24 },
    parsingHeader: { marginBottom: 12 },
    divider:       { height: 1, backgroundColor: c.border, marginBottom: 12 },
    voiceBar:      { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: c.bgCardAlt, borderRadius: 20, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    voiceBarLeft:  { flex: 1 },
    kbBtn:         { marginRight: 12 },
    micContainer:  { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 56, height: 56 },
    micGlow:       { position: 'absolute', width: 56, height: 56, borderRadius: 28 },
    micBtn:        { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
  });
