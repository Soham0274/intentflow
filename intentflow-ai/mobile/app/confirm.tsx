import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function ConfirmReminderScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1,   useNativeDriver: true, damping: 12, stiffness: 120 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Bar */}
      <View style={cfStyles.topBar}>
        <View style={{ width: 40 }} />
        <StatusPill variant="actionReady" />
        <View style={[cfStyles.avatar, { backgroundColor: colors.teal }]}>
          <Text style={[typography.bodyBold, { color: '#FFF' }]}>A</Text>
        </View>
      </View>

      <View style={cfStyles.body}>
        {/* Check Icon */}
        <Animated.View style={[cfStyles.checkWrap, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={[cfStyles.checkBox, { backgroundColor: colors.teal + '25', borderColor: colors.teal + '50' }]}>
            <Ionicons name="checkmark" size={28} color={colors.teal} />
          </View>
        </Animated.View>

        <Text style={[typography.headingMD, { color: colors.textPrimary, textAlign: 'center', marginTop: 16 }]}>
          Confirm Reminder?
        </Text>
        <Text style={[typography.bodyMD, { color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 28 }]}>
          Intent successfully extracted
        </Text>

        {/* Summary Card */}
        <View style={[cfStyles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={cfStyles.idRow}>
            <Text style={[typography.statusSM, { color: colors.textMuted }]}>Reminder For</Text>
            <Text style={[typography.statusSM, { color: colors.teal }]}>ID: INT-8821</Text>
          </View>
          <View style={cfStyles.summaryRow}>
            <View style={[cfStyles.rowIconBox, { backgroundColor: colors.bgCardAlt }]}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>A</Text>
            </View>
            <Text style={[typography.headingSM, { color: colors.textPrimary, marginLeft: 14 }]}>Arjun</Text>
          </View>

          <View style={[cfStyles.divider, { backgroundColor: colors.border }]} />

          <Text style={[typography.labelMD, { color: colors.textMuted, marginBottom: 8 }]}>Action</Text>
          <View style={cfStyles.summaryRow}>
            <View style={[cfStyles.rowIconBox, { backgroundColor: colors.purpleDim }]}>
              <Ionicons name="arrow-down" size={16} color={colors.purple} />
            </View>
            <Text style={[typography.headingSM, { color: colors.textPrimary, marginLeft: 14 }]}>Follow up</Text>
          </View>

          <View style={[cfStyles.divider, { backgroundColor: colors.border }]} />

          <Text style={[typography.labelMD, { color: colors.textMuted, marginBottom: 8 }]}>Trigger</Text>
          <View style={cfStyles.summaryRow}>
            <View style={[cfStyles.rowIconBox, { backgroundColor: colors.orangeDim }]}>
              <Ionicons name="time" size={16} color={colors.orange} />
            </View>
            <Text style={[typography.headingSM, { color: colors.textPrimary, marginLeft: 14 }]}>Today, 3:00 PM</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={cfStyles.actions}>
        <TouchableOpacity
          style={[cfStyles.confirmBtn]}
          activeOpacity={0.88}
          onPress={() => router.push('/')}
        >
          <LinearGradient
            colors={[colors.purpleLight, colors.purple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={cfStyles.gradBtn}
          >
            <Text style={[typography.bodyBold, { color: '#FFF', fontSize: 16 }]}>Confirm Action</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[cfStyles.editBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onPress={() => router.push('/review')}
          activeOpacity={0.85}
        >
          <Text style={[typography.bodyBold, { color: colors.textPrimary, fontSize: 15 }]}>Edit Details</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const cfStyles = StyleSheet.create({
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
  avatar:      { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body:        { flex: 1, paddingHorizontal: 24, paddingTop: 24, alignItems: 'center' },
  checkWrap:   { alignItems: 'center' },
  checkBox:    { width: 72, height: 72, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 20, marginTop: 8 },
  idRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rowIconBox:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  divider:     { height: 1, marginVertical: 12 },
  actions:     { paddingHorizontal: 24, paddingBottom: 40, gap: 12 },
  confirmBtn:  { borderRadius: 18, overflow: 'hidden' },
  gradBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  editBtn:     { borderRadius: 18, borderWidth: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
});
