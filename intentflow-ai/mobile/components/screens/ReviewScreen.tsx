import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusPill } from '@/components/ui/StatusPill';

interface FormRowProps {
  label: string;
  value: string;
  icon: string;
  editable?: boolean;
  multiline?: boolean;
  onChange?: (value: string) => void;
}

function FormRow({ label, value, icon, editable = false, multiline = false, onChange }: FormRowProps) {
  return (
    <View style={formRowStyles.container}>
      <View style={formRowStyles.header}>
        <Text style={formRowStyles.icon}>{icon}</Text>
        <Text style={formRowStyles.label}>{label}</Text>
      </View>
      {editable ? (
        <TextInput
          style={[formRowStyles.input, multiline && formRowStyles.inputMultiline]}
          value={value}
          onChangeText={onChange}
          multiline={multiline}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={Colors.textMuted}
        />
      ) : (
        <Text style={[formRowStyles.value, multiline && formRowStyles.valueMultiline]}>
          {value}
        </Text>
      )}
    </View>
  );
}

const formRowStyles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  value: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  valueMultiline: {
    minHeight: 60,
  },
  input: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState('');

  const formData = [
    { label: 'Contact', value: 'Sarah Chen', icon: '👤' },
    { label: 'Action Type', value: 'Send Reminder', icon: '📤' },
    { label: 'Trigger Time', value: 'Tomorrow at 3:00 PM', icon: '⏰' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.confirmed}>INTENT CONFIRMED</Text>
          <Text style={styles.title}>Review Details</Text>
        </View>
        <Avatar initials="A" size={36} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          {formData.map((row, i) => (
            <FormRow key={i} {...row} />
          ))}
          <FormRow
            label="Additional Notes"
            value={notes}
            icon="📝"
            editable
            multiline
            onChange={setNotes}
          />
        </Card>

        <Text style={styles.hint}>
          Review the details above and make any necessary changes before confirming.
        </Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.dot} />
        <TouchableOpacity style={styles.mic}>
          <Text style={styles.micIcon}>🎙</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerTop: {
    flex: 1,
  },
  confirmed: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    color: Colors.teal,
    letterSpacing: 1.4,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  formCard: {
    marginBottom: Spacing.md,
  },
  hint: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.teal,
  },
  mic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micIcon: {
    fontSize: 24,
  },
  sendBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
  },
  sendText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
});