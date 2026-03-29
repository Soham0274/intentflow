import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import { Task, Priority } from '@/types/index';
import { AvatarGroup } from './Avatar';
import { useRouter } from 'expo-router';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: Colors.danger,
  high: Colors.warning,
  medium: Colors.brandBlue,
  low: Colors.success,
};

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const router = useRouter();
  const checkAnim = useRef(new Animated.Value(task.status === 'completed' ? 1 : 0)).current;
  const isDone = task.status === 'completed';
  const priorityColor = PRIORITY_COLORS[task.priority];

  const handleToggle = () => {
    Animated.spring(checkAnim, {
      toValue: isDone ? 0 : 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
    onToggle(task.id);
  };

  const checkScale = checkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/task/${task.id}` as any)}
      style={[styles.card, isDone && styles.cardDone]}
    >
      {/* Priority accent bar */}
      <View style={[styles.accentBar, { backgroundColor: priorityColor }]} />

      <View style={styles.content}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isDone && styles.titleDone]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {/* Checkbox */}
          <TouchableOpacity
            onPress={handleToggle}
            style={styles.checkboxTouch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View
              style={[
                styles.checkbox,
                isDone && styles.checkboxDone,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              {isDone && <Text style={styles.checkmark}>✓</Text>}
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {task.dueDate && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>📅 {task.dueDate}</Text>
            </View>
          )}
          {task.dueTime && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>⏰ {task.dueTime}</Text>
            </View>
          )}
          <View style={styles.chip}>
            <Text style={styles.chipText}>🏷 {task.category}</Text>
          </View>
          <View style={{ flex: 1 }} />
          {task.people && task.people.length > 0 && (
            <AvatarGroup initials={task.people} size={22} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.elevated,
    ...Shadow.card,
  },
  cardDone: {
    opacity: 0.65,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
