import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';

interface ConnectedAppProps {
  name: string;
  icon: string;
  status: 'active' | 'connect';
  onPress: () => void;
}

function ConnectedApp({ name, icon, status, onPress }: ConnectedAppProps) {
  return (
    <TouchableOpacity onPress={onPress} style={connectedStyles.container}>
      <Text style={connectedStyles.icon}>{icon}</Text>
      <View style={connectedStyles.info}>
        <Text style={connectedStyles.name}>{name}</Text>
        {status === 'active' ? (
          <Text style={connectedStyles.active}>ACTIVE</Text>
        ) : (
          <Text style={connectedStyles.connect}>Connect</Text>
        )}
      </View>
      <Text style={connectedStyles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const connectedStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  active: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.teal,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  connect: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.accent,
    marginTop: 2,
  },
  chevron: {
    fontFamily: Fonts.regular,
    fontSize: 20,
    color: Colors.textMuted,
  },
});

interface RecentIntentProps {
  title: string;
  time: string;
  icon: string;
}

function RecentIntent({ title, time, icon }: RecentIntentProps) {
  return (
    <View style={recentStyles.container}>
      <Text style={recentStyles.icon}>{icon}</Text>
      <View style={recentStyles.info}>
        <Text style={recentStyles.title} numberOfLines={1}>{title}</Text>
        <Text style={recentStyles.time}>{time}</Text>
      </View>
    </View>
  );
}

const recentStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.lg,
    minWidth: 160,
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  time: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [voiceSensitivity, setVoiceSensitivity] = React.useState(true);
  const [autoConfirm, setAutoConfirm] = React.useState(false);

  const connectedApps = [
    { name: 'Google Calendar', icon: '📅', status: 'active' as const },
    { name: 'Slack', icon: '💬', status: 'active' as const },
    { name: 'Notion', icon: '📝', status: 'connect' as const },
    { name: 'Email', icon: '📧', status: 'connect' as const },
  ];

  const recentIntents = [
    { title: 'Remind Sarah about deadline', time: '2h ago', icon: '⏰' },
    { title: 'Schedule team standup', time: '5h ago', icon: '👥' },
    { title: 'Send weekly report', time: '1d ago', icon: '📊' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar status="online" rightSlot={<Text style={styles.editBtn}>Edit</Text>} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Avatar initials="A" size={80} gradient />
          <Text style={styles.name}>Alex Johnson</Text>
          <Text style={styles.email}>alex@intentflow.ai</Text>
        </View>

        <Card style={styles.settingsCard}>
          <Section label="PREFERENCES">
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Voice Sensitivity</Text>
                <Text style={styles.toggleHint}>High sensitivity for quiet environments</Text>
              </View>
              <Toggle value={voiceSensitivity} onValueChange={() => setVoiceSensitivity(!voiceSensitivity)} />
            </View>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Auto-Confirm Intent</Text>
                <Text style={styles.toggleHint}>Skip review for high confidence</Text>
              </View>
              <Toggle value={autoConfirm} onValueChange={() => setAutoConfirm(!autoConfirm)} />
            </View>
          </Section>
        </Card>

        <Section label="CONNECTED ECOSYSTEM">
          {connectedApps.map((app, i) => (
            <ConnectedApp key={i} {...app} onPress={() => {}} />
          ))}
        </Section>

        <Section label="RECENT INTENTS">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentIntents.map((intent, i) => (
              <RecentIntent key={i} {...intent} />
            ))}
          </ScrollView>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  email: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  editBtn: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.accent,
  },
  settingsCard: {
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  toggleHint: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});