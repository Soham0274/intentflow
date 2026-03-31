import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ThemedToggle } from '../components/ThemedToggle';
import { useRouter } from 'expo-router';

// Integration row
interface IntegrationRowProps {
  icon:    React.ReactNode;
  name:    string;
  sub:     string;
  status:  'connected' | 'disconnected';
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({ icon, name, sub, status }) => {
  const { colors, typography } = useTheme();
  return (
    <View style={[iStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[iStyles.iconBox, { backgroundColor: colors.bgCardAlt }]}>{icon}</View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={[typography.bodySM, { color: colors.textMuted }]}>{sub}</Text>
      </View>
      {status === 'connected' ? (
        <View style={[iStyles.activeBadge, { backgroundColor: colors.successDim }]}>
          <Text style={[typography.statusSM, { color: colors.success }]}>ACTIVE</Text>
        </View>
      ) : (
        <TouchableOpacity>
          <Text style={[typography.bodyBold, { color: colors.purple }]}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const iStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  iconBox:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const [voiceSensitivity, setVoiceSensitivity] = useState(true);
  const [autoConfirm, setAutoConfirm]           = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={pStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={pStyles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[typography.headingSM, { color: colors.textPrimary }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar */}
        <View style={pStyles.avatarSection}>
          <View style={[pStyles.avatarRing, { borderColor: colors.teal }]}>
            <View style={[pStyles.avatarInner, { backgroundColor: colors.bgCard }]}>
              <Text style={[typography.headingMD, { color: colors.textPrimary }]}>A</Text>
            </View>
          </View>
          <Text style={[typography.headingSM, { color: colors.textPrimary, marginTop: 12 }]}>Arjun Mehta</Text>
          <Text style={[typography.bodyMD, { color: colors.textMuted, marginTop: 4 }]}>arjun.m@intentflow.ai</Text>
        </View>

        {/* Section Label */}
        <Text style={[typography.labelMD, { color: colors.textMuted, paddingHorizontal: 24, marginBottom: 8 }]}>
          Assistant Preferences
        </Text>

        {/* Preferences Card */}
        <View style={[pStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={pStyles.prefRow}>
            <View style={[pStyles.prefIcon, { backgroundColor: colors.purpleDim }]}>
              <MaterialCommunityIcons name="microphone" size={18} color={colors.purple} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Voice Sensitivity</Text>
            </View>
            <Text style={[typography.bodyMD, { color: colors.teal, marginRight: 10 }]}>High</Text>
            <ThemedToggle value={voiceSensitivity} onChange={setVoiceSensitivity} />
          </View>
          <View style={[pStyles.rowDivider, { backgroundColor: colors.border }]} />
          <View style={pStyles.prefRow}>
            <View style={[pStyles.prefIcon, { backgroundColor: colors.tealDim }]}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.teal} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Auto-Confirm Intent</Text>
            </View>
            <ThemedToggle value={autoConfirm} onChange={setAutoConfirm} />
          </View>
        </View>

        {/* Connected Ecosystem */}
        <Text style={[typography.labelMD, { color: colors.textMuted, paddingHorizontal: 24, marginTop: 24, marginBottom: 8 }]}>
          Connected Ecosystem
        </Text>

        <View style={[pStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <IntegrationRow
            icon={<Ionicons name="calendar" size={20} color="#4285F4" />}
            name="Google Calendar"
            sub="Primary workspace"
            status="connected"
          />
          <IntegrationRow
            icon={<Ionicons name="calendar-outline" size={20} color={colors.textMuted} />}
            name="Outlook Calendar"
            sub="Not connected"
            status="disconnected"
          />
        </View>

        {/* Recent Intents */}
        <View style={pStyles.recentHeader}>
          <Text style={[typography.labelMD, { color: colors.textMuted }]}>Recent Intents</Text>
          <TouchableOpacity>
            <Text style={[typography.bodyMD, { color: colors.purple }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={[pStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[typography.bodyMD, { color: colors.textSecondary }]}>
            "Follow up with Arjun after the 3pm call..."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const pStyles = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarRing:    { width: 90, height: 90, borderRadius: 45, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatarInner:   { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  card:          { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 4 },
  prefRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  prefIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowDivider:    { height: 1, marginVertical: 0 },
  recentHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 24, marginBottom: 8 },
});
