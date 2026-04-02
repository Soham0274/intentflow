import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { useRouter } from 'expo-router';

interface ActionOption {
  id:          string;
  icon:        keyof typeof Ionicons.glyphMap;
  iconBg:      string;
  iconColor:   string;
  title:       string;
  description: string;
  confidence:  number;
  trigger?:    string;
  app?:        string;
}

const ACTION_OPTIONS: ActionOption[] = [
  {
    id: 'crm',
    icon: 'people-outline',
    iconBg: '#3B82F625',
    iconColor: '#60A5FA',
    title: 'CRM Follow-up',
    description: 'Schedule a reminder in Salesforce to call the client regarding the Q4 proposal.',
    confidence: 92,
    trigger: '15:00',
    app: 'Salesforce',
  },
  {
    id: 'slack',
    icon: 'chatbubbles-outline',
    iconBg: '#14B8A620',
    iconColor: '#14B8A6',
    title: 'Slack Message',
    description: 'Send a Slack message to the team about the follow-up.',
    confidence: 64,
  },
];

export default function AmbiguityScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => router.push('/confirm'), 300);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Top Bar */}
      <View style={amStyles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[amStyles.closeBtn, { backgroundColor: colors.bgCard }]}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <StatusPill variant="analyzing" />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={amStyles.body} showsVerticalScrollIndicator={false}>
        {/* Label */}
        <Text style={[typography.statusSM, { color: colors.purple, marginBottom: 12 }]}>Ambiguity Detected</Text>

        {/* Question */}
        <Text style={[typography.headingLG, { color: colors.textPrimary, marginBottom: 8 }]}>
          Which action should I take for{' '}
          <Text style={{ color: colors.teal }}>"contact"</Text>?
        </Text>
        <Text style={[typography.bodyMD, { color: colors.textSecondary, marginBottom: 28 }]}>
          I found multiple potential tasks related to your request.
        </Text>

        {/* Action Cards */}
        {ACTION_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          const isFirst    = opt.id === 'crm';
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => handleSelect(opt.id)}
              activeOpacity={0.85}
              style={[
                amStyles.actionCard,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: isSelected ? colors.purple : isFirst ? colors.purple + '60' : colors.border,
                  borderWidth: isSelected || isFirst ? 1.5 : 1,
                  marginBottom: 14,
                },
              ]}
            >
              <View style={amStyles.cardTopRow}>
                <View style={[amStyles.cardIcon, { backgroundColor: opt.iconBg }]}>
                  <Ionicons name={opt.icon} size={20} color={opt.iconColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.bodyBold, { color: isFirst ? colors.purple : colors.textPrimary, fontSize: 16 }]}>
                    {opt.title}
                  </Text>
                </View>
                <ConfidenceBadge value={opt.confidence} />
              </View>

              <Text style={[typography.bodyMD, { color: colors.textSecondary, marginTop: 10, marginBottom: 14 }]}>
                {opt.description}
              </Text>

              {(opt.trigger || opt.app) && (
                <View style={amStyles.tagRow}>
                  {opt.trigger && (
                    <View style={[amStyles.tag, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
                      <Text style={[typography.statusSM, { color: colors.textSecondary }]}>Trigger: {opt.trigger}</Text>
                    </View>
                  )}
                  {opt.app && (
                    <View style={[amStyles.tag, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
                      <Text style={[typography.statusSM, { color: colors.textSecondary }]}>App: {opt.app}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Waiting Bar */}
      <View style={[amStyles.waitingBar, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
        <Text style={[typography.bodyMD, { color: colors.textMuted, flex: 1 }]}>Waiting for selection...</Text>
        <Ionicons name="arrow-back" size={18} color={colors.textMuted} style={{ marginRight: 16 }} />
        <TouchableOpacity style={[amStyles.micSmall, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const amStyles = StyleSheet.create({
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  closeBtn:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  body:       { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  actionCard: { borderRadius: 18, padding: 16 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  waitingBar: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  micSmall:   { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
