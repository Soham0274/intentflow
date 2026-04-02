import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ThemedToggle } from '../components/ThemedToggle';
import { useRouter } from 'expo-router';

const TimeChip: React.FC<{ time: string }> = ({ time }) => {
  const { colors, typography } = useTheme();
  return (
    <TouchableOpacity style={[alStyles.timeChip, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
      <Text style={[typography.bodyBold, { color: colors.purple, fontSize: 16 }]}>{time}</Text>
    </TouchableOpacity>
  );
};

export default function AlertsScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const [smartNudges,  setSmartNudges]  = useState(true);
  const [quietHours,   setQuietHours]   = useState(true);
  const [weekendMode,  setWeekendMode]  = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={alStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[alStyles.backBtn, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[typography.headingSM, { color: colors.textPrimary }]}>Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={alStyles.body} showsVerticalScrollIndicator={false}>
        {/* Smart Nudges Feature Card */}
        <View style={[alStyles.nudgesCard, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
          <View style={alStyles.nudgesTop}>
            <View style={[alStyles.nudgesIcon, { backgroundColor: colors.purple + '20' }]}>
              <MaterialCommunityIcons name="auto-fix" size={22} color={colors.purple} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary, fontSize: 17 }]}>Smart Nudges</Text>
              <Text style={[typography.bodyMD, { color: colors.textMuted }]}>AI-Optimized Timing</Text>
            </View>
            <ThemedToggle value={smartNudges} onChange={setSmartNudges} />
          </View>
          <Text style={[typography.bodyMD, { color: colors.textSecondary, marginTop: 14, lineHeight: 22 }]}>
            IntentFlow automatically analyzes your daily routines and energy levels to find the perfect moment to deliver notifications.
          </Text>
        </View>

        {/* Delivery Rules */}
        <Text style={[typography.labelMD, { color: colors.textMuted, marginTop: 28, marginBottom: 12 }]}>
          Delivery Rules
        </Text>

        <View style={[alStyles.rulesCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Quiet Hours */}
          <View style={alStyles.ruleRow}>
            <Ionicons name="moon-outline" size={20} color={colors.textSecondary} style={{ marginRight: 14 }} />
            <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>Quiet Hours</Text>
            <ThemedToggle value={quietHours} onChange={setQuietHours} />
          </View>
          {quietHours && (
            <View style={alStyles.timeRow}>
              <TimeChip time="10:00 PM" />
              <Text style={[typography.bodyMD, { color: colors.textMuted, marginHorizontal: 8 }]}>to</Text>
              <TimeChip time="7:00 AM" />
            </View>
          )}

          <View style={[alStyles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Frequency */}
          <TouchableOpacity style={alStyles.ruleRow} activeOpacity={0.7}>
            <Ionicons name="layers-outline" size={20} color={colors.textSecondary} style={{ marginRight: 14 }} />
            <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1 }]}>Frequency</Text>
            <Text style={[typography.bodyMD, { color: colors.textSecondary, marginRight: 6 }]}>Bundled</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[alStyles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Weekend Mode */}
          <View style={alStyles.ruleRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Weekend Mode</Text>
              <Text style={[typography.bodySM, { color: colors.textMuted }]}>Pause non-urgent tasks</Text>
            </View>
            <ThemedToggle value={weekendMode} onChange={setWeekendMode} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const alStyles = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  body:       { paddingHorizontal: 20, paddingBottom: 60 },
  nudgesCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  nudgesTop:  { flexDirection: 'row', alignItems: 'center' },
  nudgesIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rulesCard:  { borderRadius: 18, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 16 },
  ruleRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  timeRow:    { flexDirection: 'row', alignItems: 'center', paddingBottom: 14, paddingLeft: 34 },
  timeChip:   { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  rowDivider: { height: 1 },
});
