import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius, Shadow, GradientColors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  value: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});

export function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const details = [
    { label: 'Reminder For', value: 'Sarah Chen' },
    { label: 'Action', value: 'Send Reminder' },
    { label: 'Trigger', value: 'Tomorrow at 3:00 PM' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <StatusPill status="online" />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.checkWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </Animated.View>

        <Text style={styles.headline}>Intent Confirmed</Text>
        <Text style={styles.subheadline}>
          Your intent has been scheduled successfully.
        </Text>

        <Card style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Summary</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>INT-2847</Text>
            </View>
          </View>

          {details.map((row, i) => (
            <DetailRow key={i} {...row} />
          ))}
        </Card>

        <TouchableOpacity activeOpacity={0.9} style={styles.primaryBtn}>
          <LinearGradient
            colors={GradientColors.brand as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryGradient}
          >
            <Text style={styles.primaryText}>View in Calendar</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Edit Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  checkWrap: {
    marginTop: Spacing.xl,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.tealDim,
    borderWidth: 2,
    borderColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 32,
    color: Colors.teal,
  },
  headline: {
    fontFamily: Fonts.displayExtra,
    fontSize: 26,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  subheadline: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  summaryCard: {
    marginTop: Spacing.xl,
    width: '100%',
    paddingBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  idBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.sm,
  },
  idText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  primaryBtn: {
    marginTop: Spacing.xl,
    width: '100%',
    ...Shadow.glow,
  },
  primaryGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
  },
  primaryText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  secondaryBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});