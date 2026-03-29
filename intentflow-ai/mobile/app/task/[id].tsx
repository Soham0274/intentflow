import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing, Shadow } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import GradientButton from '@/components/ui/GradientButton';
import OutlineButton from '@/components/ui/OutlineButton';
import PriorityBadge from '@/components/ui/PriorityBadge';
import { AvatarGroup } from '@/components/ui/Avatar';

const STATUS_COLORS = {
  active: Colors.success,
  pending: Colors.warning,
  completed: Colors.success,
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask, updateTask, showToast } = useStore();

  const task = tasks.find((t) => t.id === id);
  const [newSubtask, setNewSubtask] = useState('');

  if (!task) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Task not found</Text>
        </View>
      </View>
    );
  }

  const isDone = task.status === 'completed';
  const priorityColor = Colors.priority[task.priority];

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const updated = [
      ...task.subtasks,
      { id: Date.now().toString(), title: newSubtask.trim(), completed: false },
    ];
    updateTask(task.id, { subtasks: updated });
    setNewSubtask('');
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = task.subtasks.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    updateTask(task.id, { subtasks: updated });
  };

  const handleComplete = () => {
    toggleTask(task.id);
    showToast('success', isDone ? 'Task reopened' : 'Task completed! 🎉');
    router.back();
  };

  const completedSubs = task.subtasks.filter((s) => s.completed).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {task.title}
        </Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroAccent, { backgroundColor: priorityColor }]} />
          <View style={styles.heroContent}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <View style={styles.badgeRow}>
              <PriorityBadge priority={task.priority} />
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[task.status] + '22', borderColor: STATUS_COLORS[task.status] + '55' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[task.status] }]}>
                  {isDone ? '✓ Completed' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info grid */}
        <View style={[styles.section, styles.infoGrid]}>
          {task.dueDate && (
            <TouchableOpacity style={styles.infoCard}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{task.dueDate}</Text>
            </TouchableOpacity>
          )}
          {task.dueTime && (
            <TouchableOpacity style={styles.infoCard}>
              <Text style={styles.infoIcon}>⏰</Text>
              <Text style={styles.infoLabel}>Due Time</Text>
              <Text style={styles.infoValue}>{task.dueTime}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.infoCard}>
            <Text style={styles.infoIcon}>⚡</Text>
            <Text style={styles.infoLabel}>Priority</Text>
            <Text style={[styles.infoValue, { color: priorityColor }]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoCard}>
            <Text style={styles.infoIcon}>🏷</Text>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{task.category}</Text>
          </TouchableOpacity>
        </View>

        {/* People */}
        {task.people && task.people.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>People</Text>
            <View style={styles.peopleRow}>
              <AvatarGroup initials={task.people} size={36} />
              {task.people.map((p, i) => (
                <Text key={i} style={styles.personName}>{p}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>
              {task.description || 'No notes yet. Tap to add…'}
            </Text>
          </View>
        </View>

        {/* Subtasks */}
        <View style={styles.section}>
          <View style={styles.subtaskHeader}>
            <Text style={styles.sectionLabel}>Subtasks</Text>
            {task.subtasks.length > 0 && (
              <View style={styles.subtaskBadge}>
                <Text style={styles.subtaskBadgeText}>
                  {completedSubs}/{task.subtasks.length}
                </Text>
              </View>
            )}
          </View>

          {task.subtasks.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={styles.subtaskRow}
              onPress={() => handleToggleSubtask(sub.id)}
            >
              <View style={[styles.subCheckbox, sub.completed && styles.subCheckboxDone]}>
                {sub.completed && <Text style={styles.subCheck}>✓</Text>}
              </View>
              <Text style={[styles.subtaskTitle, sub.completed && styles.subtaskDone]}>
                {sub.title}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Add subtask */}
          <View style={styles.addSubtaskRow}>
            <View style={styles.addSubDot} />
            <TextInput
              style={styles.addSubInput}
              placeholder="Add subtask…"
              placeholderTextColor={Colors.textMuted}
              value={newSubtask}
              onChangeText={setNewSubtask}
              onSubmitEditing={handleAddSubtask}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Activity timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Activity</Text>
          {[
            { icon: '✦', label: 'Created', time: 'Mar 18 · 9:00 AM' },
            { icon: '✎', label: 'Edited', time: 'Mar 18 · 10:30 AM' },
          ].map((item, i) => (
            <View key={i} style={styles.activityRow}>
              <View style={styles.activityDot}>
                <Text style={styles.activityIcon}>{item.icon}</Text>
              </View>
              <View style={styles.activityLine} />
              <View>
                <Text style={styles.activityLabel}>{item.label}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
        {isDone ? (
          <OutlineButton
            label="↩ Reopen Task"
            onPress={handleComplete}
            height={54}
          />
        ) : (
          <GradientButton
            label="✓ Mark Complete"
            onPress={handleComplete}
            gradient={['#10B981', '#059669']}
            height={54}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.elevated,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.elevated,
  },
  backArrow: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },

  scroll: {
    paddingBottom: 16,
  },
  section: {
    paddingHorizontal: Spacing.sm,
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  // Hero
  heroSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 20,
    marginBottom: 4,
    gap: 14,
  },
  heroAccent: {
    width: 4,
    borderRadius: 2,
    minHeight: 60,
  },
  heroContent: {
    flex: 1,
    gap: 10,
  },
  taskTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.elevated,
    gap: 4,
    ...Shadow.card,
  },
  infoIcon: { fontSize: 20 },
  infoLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  // People
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personName: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Notes
  notesBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.elevated,
    minHeight: 72,
  },
  notesText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Subtasks
  subtaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  subtaskBadge: {
    backgroundColor: Colors.brandBlue + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  subtaskBadgeText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.brandBlue,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.elevated,
    gap: 12,
  },
  subCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCheckboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  subCheck: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  subtaskTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  subtaskDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  addSubDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addSubInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Activity
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 12,
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIcon: { fontSize: 12 },
  activityLine: { display: 'none' },
  activityLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  activityTime: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Bottom
  bottomAction: {
    paddingHorizontal: Spacing.sm,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.elevated,
    backgroundColor: Colors.background,
  },

  // Not found
  backRow: { padding: Spacing.sm },
  backText: { fontFamily: Fonts.medium, fontSize: 15, color: Colors.textSecondary },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textMuted },
});
