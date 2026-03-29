import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing, Shadow } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { Avatar } from '@/components/ui/Avatar';
import GhostButton from '@/components/ui/GhostButton';

interface SettingRowProps {
  icon: string;
  iconBg: string;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
  badge?: { label: string; color: string };
}

function SettingRow({
  icon, iconBg, label, value, toggle, toggleValue, onToggle, onPress, isLast, badge,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={toggle ? 1 : 0.7}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.color + '22', borderColor: badge.color + '55' }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        )}
        {value && !toggle && (
          <Text style={styles.rowValue}>{value}</Text>
        )}
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: Colors.elevated, true: Colors.brandBlue }}
            thumbColor={Colors.white}
          />
        ) : (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useStore();
  const [reminders, setReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar initials={user.avatar} size={64} color={Colors.brandBlue} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <SettingGroup title="Notifications">
          <SettingRow
            icon="🔔"
            iconBg={Colors.brandBlue + '33'}
            label="Reminders"
            toggle
            toggleValue={reminders}
            onToggle={setReminders}
          />
          <SettingRow
            icon="🌙"
            iconBg={Colors.violet + '33'}
            label="Quiet Hours"
            value="10 PM – 7 AM"
            onPress={() => {}}
          />
          <SettingRow
            icon="📊"
            iconBg={Colors.success + '33'}
            label="Weekly Report"
            toggle
            toggleValue={weeklyReport}
            onToggle={setWeeklyReport}
            isLast
          />
        </SettingGroup>

        {/* AI Settings */}
        <SettingGroup title="AI Settings">
          <SettingRow
            icon="🎯"
            iconBg={Colors.warning + '33'}
            label="Auto-approve threshold"
            value="95%"
            onPress={() => {}}
          />
          <SettingRow
            icon="🤖"
            iconBg={Colors.violet + '33'}
            label="NLP Provider"
            value="Gemini"
            onPress={() => {}}
          />
          <SettingRow
            icon="📈"
            iconBg={Colors.success + '33'}
            label="AI Accuracy"
            onPress={() => {}}
            badge={{ label: '94%', color: Colors.success }}
            isLast
          />
        </SettingGroup>

        {/* Integrations */}
        <SettingGroup title="Integrations">
          <SettingRow
            icon="📅"
            iconBg='#4285F422'
            label="Google Calendar"
            badge={{ label: 'Connected', color: Colors.success }}
            onPress={() => {}}
          />
          <SettingRow
            icon="📧"
            iconBg={Colors.danger + '22'}
            label="Google Mail"
            badge={{ label: 'Connected', color: Colors.success }}
            onPress={() => {}}
          />
          <SettingRow
            icon="⚡"
            iconBg={Colors.warning + '22'}
            label="n8n Webhooks"
            badge={{ label: 'Disconnected', color: Colors.textMuted }}
            onPress={() => {}}
            isLast
          />
        </SettingGroup>

        {/* Danger zone */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
          <GhostButton
            label="Delete Account"
            onPress={() => {}}
            color={Colors.danger}
            fontSize={14}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.sm,
    gap: 6,
  },
  screenTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.elevated,
    gap: 14,
    ...Shadow.card,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  profileEmail: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  editProfileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.brandBlue,
  },
  editProfileText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.brandBlue,
  },

  // Groups
  group: {
    marginBottom: 8,
  },
  groupTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.elevated,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.elevated,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconText: { fontSize: 18 },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chevron: {
    fontFamily: Fonts.regular,
    fontSize: 20,
    color: Colors.textMuted,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },

  // Danger zone
  dangerZone: {
    marginTop: 12,
    gap: 4,
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.lg,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  signOutText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.danger,
  },
});
