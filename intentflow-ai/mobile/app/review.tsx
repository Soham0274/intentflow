import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchHitlById, confirmHitl } from '../services/api';
import { ActivityIndicator } from 'react-native';

// Field row wrapper
const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const { colors, typography } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[typography.labelMD, { color: colors.textMuted, marginBottom: 8 }]}>{label}</Text>
      {children}
    </View>
  );
};

export default function EditReminderScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const { hitlId } = useLocalSearchParams<{ hitlId: string }>();
  const [loading, setLoading] = useState(!!hitlId);
  const [taskData, setTaskData] = useState<any>(null);
  
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (hitlId) {
      fetchHitlById(hitlId).then(res => {
        const data = res.data || res;
        const extracted = data.extracted_tasks?.[0] || {};
        setTaskData(extracted);
        setNotes(extracted.description || '');
        setLoading(false);
      }).catch(err => {
        console.error('Failed to load review data', err);
        setLoading(false);
      });
    }
  }, [hitlId]);

  const handleDone = async () => {
    try {
      if (hitlId) {
        await confirmHitl(hitlId);
        router.push('/confirm');
      } else {
        router.push('/confirm');
      }
    } catch (e) {
      console.error('Failed to confirm', e);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Background atmosphere */}
      <View style={[edStyles.atmosphereContainer, { pointerEvents: 'none' }]}>
        <View style={[edStyles.atmosphereGlow, { backgroundColor: colors.blueDim }]} />
      </View>

      {/* Header */}
      <View style={edStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[edStyles.backBtn, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[typography.statusSM, { color: colors.blue }]}>Intent Confirmed</Text>
          <Text style={[typography.bodyBold, { color: colors.textPrimary, marginTop: 2 }]}>Edit Reminder</Text>
        </View>
        <TouchableOpacity style={[edStyles.doneBtn, { backgroundColor: colors.blue, boxShadow: `0px 2px 10px ${colors.blue}66`, elevation: 6 }]} onPress={handleDone}>
          <Text style={[typography.bodyBold, { color: '#FFF' }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={edStyles.body} showsVerticalScrollIndicator={false}>
        <Text style={[typography.headingMD, { color: colors.textPrimary, marginBottom: 4 }]}>Review Details</Text>
        <Text style={[typography.bodyMD, { color: colors.textSecondary, marginBottom: 28 }]}>
          Voice intent parsed successfully. Refine if needed.
        </Text>

        {/* Contact */}
        <FieldGroup label="Contact / Entity">
          <View style={[edStyles.fieldCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[edStyles.contactAvatar, { backgroundColor: colors.blueDim }]}>
              <Text style={[typography.bodyBold, { color: colors.blue }]}>C</Text>
            </View>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, flex: 1, marginLeft: 12 }]}>Contact</Text>
            <Ionicons name="person-add-outline" size={18} color={colors.textMuted} />
          </View>
        </FieldGroup>

        {/* Action Type */}
        <FieldGroup label="Action Type">
          <View style={[edStyles.fieldCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="pencil-outline" size={18} color={colors.blue} style={{ marginRight: 12 }} />
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
              {taskData?.category || 'Task'}
            </Text>
          </View>
        </FieldGroup>

        {/* Trigger Time */}
        <FieldGroup label="Trigger Time">
          <View style={[edStyles.fieldCard, { backgroundColor: colors.bgCard, borderColor: colors.blue + '40' }]}>
            <View style={[edStyles.clockIcon, { borderColor: colors.blue }]}>
              <Ionicons name="time-outline" size={16} color={colors.blue} />
            </View>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginLeft: 12 }]}>
              {taskData?.due_date} {taskData?.due_time ? `@ ${taskData.due_time}` : ''}
            </Text>
          </View>
        </FieldGroup>

        {/* Notes */}
        <FieldGroup label="Additional Notes">
          <View style={[edStyles.notesCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[typography.bodyMD, { color: colors.textPrimary, lineHeight: 22 }]}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </FieldGroup>
      </ScrollView>

      {/* Command Bar */}
      <View style={[edStyles.commandBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[edStyles.dotDeco, { backgroundColor: colors.blue }]} />
        <TextInput
          placeholder="Type a command o..."
          placeholderTextColor={colors.textMuted}
          style={[typography.bodyMD, { color: colors.textPrimary, flex: 1 }]}
        />
        <Ionicons name="mic-outline" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
        <TouchableOpacity style={[edStyles.sendBtn, { backgroundColor: colors.blue, boxShadow: `0px 2px 8px ${colors.blue}66`, elevation: 5 }]}>
          <Ionicons name="arrow-up" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const edStyles = StyleSheet.create({
  atmosphereContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  atmosphereGlow:     { width: 380, height: 380, borderRadius: 190, opacity: 0.12, position: 'absolute', top: '15%' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:            { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  doneBtn:            { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  body:               { paddingHorizontal: 24, paddingBottom: 120 },
  fieldCard:          { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14 },
  contactAvatar:      { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  clockIcon:          { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  notesCard:          { borderRadius: 16, borderWidth: 1, padding: 14, minHeight: 90 },
  commandBar:         { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  dotDeco:            { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  sendBtn:            { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
