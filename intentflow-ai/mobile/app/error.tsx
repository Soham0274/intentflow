import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, ScrollView, Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';

const AnalysisRow = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
  <View style={styles.analysisRow}>
    <View style={styles.analysisInfo}>
       <Text style={styles.analysisLabel}>{label}</Text>
       <Text style={[styles.analysisPercent, { color }]}>{percentage}%</Text>
    </View>
    <View style={styles.barBg}>
       <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  </View>
);

export default function ConnectionErrorScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: '#0A0B0F' }]}>
      <View style={styles.redTint} pointerEvents="none" />

      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.menuBtn, { backgroundColor: '#1E2130' }]}>
          <Feather name="menu" size={20} color="#A0A8C0" />
        </TouchableOpacity>
        <StatusPill variant="lowConfidence" label="LOW CONFIDENCE" />
        <View style={styles.avatar} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.errorLabel}>
           <Text style={styles.badgeText}>⚠ PARSE ERROR 0X402</Text>
        </View>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Text style={styles.title}>
            Unable to reach the processing engine.{' '}
            <Text style={{ color: '#5A6280' }}>
              Check your network connection and try again.
            </Text>
          </Text>
        </Animated.View>

        <View style={styles.analysisCard}>
           <Text style={styles.cardHeader}>NLP ANALYSIS</Text>
           <AnalysisRow label="Transcription" percentage={94} color="#00C896" />
           <View style={styles.rowDivider} />
           <AnalysisRow label="Intent Extraction" percentage={38} color="#FF4D4D" />
           <View style={styles.rowDivider} />
           <AnalysisRow label="Entity Resolution" percentage={52} color="#FF8C42" />
        </View>

        <View style={styles.stateContainer}>
           <View style={styles.stateRow}>
              <View style={[styles.stateBadge, { backgroundColor: 'rgba(255,140,66,0.1)' }]}>
                 <Text style={[styles.stateText, { color: '#FF8C42' }]}>AMBIGUOUS</Text>
              </View>
              <View style={[styles.stateBadge, { backgroundColor: 'rgba(255,77,77,0.1)' }]}>
                 <Text style={[styles.stateText, { color: '#FF4D4D' }]}>[UNRECOGNIZED]</Text>
              </View>
           </View>
        </View>

        <View style={styles.actions}>
           <TouchableOpacity
             style={styles.retryBtn}
             onPress={() => router.push('/voice')}
             activeOpacity={0.8}
           >
              <Text style={styles.retryText}>Retry Voice Input</Text>
           </TouchableOpacity>

           <TouchableOpacity
             style={styles.textBtn}
             onPress={() => router.push('/voice')}
           >
              <Text style={styles.textModeBtnText}>Switch to Text Mode</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomStatus}>
         <View>
            <Text style={styles.statusLabel}>Service Unavailable</Text>
            <Text style={styles.statusSub}>Sync Interrupted</Text>
         </View>
         <TouchableOpacity style={styles.reconnectBtn}>
            <Feather name="refresh-cw" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.reconnectText}>Reconnect</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  redTint: { position: 'absolute', bottom: 0, left: 0, right: 0, top: '40%', opacity: 0.12, backgroundColor: 'rgba(255,60,60,0.15)', borderRadius: 200, transform: [{ scaleX: 1.5 }, { translateY: 200 }] },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44 },
  body: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 120 },
  errorLabel: { marginBottom: 16 },
  badgeText: { fontFamily: Fonts.bold, fontSize: 11, color: '#FF4D4D', letterSpacing: 1 },
  title: { fontFamily: Fonts.displayBold, fontSize: 28, color: '#FFFFFF', letterSpacing: -0.8, lineHeight: 34 },
  analysisCard: { backgroundColor: '#12141A', borderRadius: 24, padding: 24, marginTop: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { fontFamily: Fonts.medium, fontSize: 10, color: '#5A6280', letterSpacing: 1.5, marginBottom: 20 },
  analysisRow: { marginBottom: 16 },
  analysisInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  analysisLabel: { fontFamily: Fonts.medium, fontSize: 13, color: '#FFFFFF' },
  analysisPercent: { fontFamily: Fonts.bold, fontSize: 13 },
  barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  rowDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 16 },
  stateContainer: { marginTop: 24 },
  stateRow: { flexDirection: 'row', gap: 12 },
  stateBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  stateText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1 },
  actions: { marginTop: 48, gap: 12 },
  retryBtn: { backgroundColor: '#FFFFFF', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  retryText: { color: '#000', fontFamily: Fonts.bold, fontSize: 16 },
  textBtn: { backgroundColor: '#1C1F2E', paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  textModeBtnText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 15 },
  bottomStatus: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#12141A', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  statusLabel: { fontFamily: Fonts.bold, fontSize: 15, color: '#A0A8C0' },
  statusSub: { fontFamily: Fonts.bold, fontSize: 11, color: '#FF4D4D', marginTop: 2, letterSpacing: 0.5 },
  reconnectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF4D4D', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  reconnectText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 14 },
});
