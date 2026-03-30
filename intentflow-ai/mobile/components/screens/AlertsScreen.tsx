import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { Toggle } from '@/components/ui/Toggle';
import { StatusPill } from '@/components/ui/StatusPill';

interface DeliveryRuleProps {
  label: string;
  description: string;
  icon: string;
  on: boolean;
  onToggle: () => void;
}

function DeliveryRule({ label, description, icon, on, onToggle }: DeliveryRuleProps) {
  return (
    <View style={ruleStyles.container}>
      <View style={ruleStyles.left}>
        <Text style={ruleStyles.icon}>{icon}</Text>
        <View style={ruleStyles.textWrap}>
          <Text style={ruleStyles.label}>{label}</Text>
          <Text style={ruleStyles.description}>{description}</Text>
        </View>
      </View>
      <Toggle on={on} onToggle={onToggle} />
    </View>
  );
}

const ruleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  description: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

interface TimePickerProps {
  visible: boolean;
}

function TimePicker({ visible }: TimePickerProps) {
  if (!visible) return null;
  
  return (
    <View style={timeStyles.container}>
      <View style={timeStyles.row}>
        <TouchableOpacity style={timeStyles.picker}>
          <Text style={timeStyles.pickerText}>10:00 PM</Text>
          <Text style={timeStyles.pickerChevron}>‹</Text>
        </TouchableOpacity>
        <Text style={timeStyles.to}>to</Text>
        <TouchableOpacity style={timeStyles.picker}>
          <Text style={timeStyles.pickerText}>7:00 AM</Text>
          <Text style={timeStyles.pickerChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const timeStyles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
  },
  pickerText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  pickerChevron: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    color: Colors.textMuted,
  },
  to: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },
});

export function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [quietHours, setQuietHours] = useState(true);
  const [smartNudges, setSmartNudges] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Alerts</Text>
        <StatusPill status="online" />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.featureCard}>
          <LinearGradient
            colors={['rgba(124,111,255,0.15)', 'rgba(0,229,201,0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureGradient}
          >
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>💡</Text>
            </View>
            <Text style={styles.featureTitle}>Smart Nudges</Text>
            <Text style={styles.featureDesc}>
              AI-powered reminders that adapt to your habits and suggest optimal times to act on your intents.
            </Text>
            <View style={styles.featureToggle}>
              <Toggle on={smartNudges} onToggle={() => setSmartNudges(!smartNudges)} />
            </View>
          </LinearGradient>
        </Card>

        <Section label="DELIVERY RULES">
          <Card>
            <DeliveryRule
              label="Push Notifications"
              description="Receive alerts on your device"
              icon="📱"
              on={pushEnabled}
              onToggle={() => setPushEnabled(!pushEnabled)}
            />
            <DeliveryRule
              label="Email Digest"
              description="Daily summary at 9:00 AM"
              icon="📧"
              on={emailEnabled}
              onToggle={() => setEmailEnabled(!emailEnabled)}
            />
            <DeliveryRule
              label="Quiet Hours"
              description="No alerts during set times"
              icon="🌙"
              on={quietHours}
              onToggle={() => setQuietHours(!quietHours)}
            />
            <TimePicker visible={quietHours} />
            <View style={styles.frequencyRow}>
              <View style={styles.frequencyLeft}>
                <Text style={styles.frequencyIcon}>📊</Text>
                <View>
                  <Text style={styles.frequencyLabel}>Alert Frequency</Text>
                  <Text style={styles.frequencyValue}>Normal</Text>
                </View>
              </View>
              <Text style={styles.frequencyChevron}>›</Text>
            </View>
          </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  featureCard: {
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  featureGradient: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  featureDesc: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  featureToggle: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  frequencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyIcon: {
    fontSize: 18,
    marginRight: Spacing.md,
  },
  frequencyLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  frequencyValue: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  frequencyChevron: {
    fontFamily: Fonts.regular,
    fontSize: 20,
    color: Colors.textMuted,
  },
});