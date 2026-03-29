import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing, Shadow } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import SectionHeader from '@/components/ui/SectionHeader';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'];

const TIME_BLOCKS = [
  { title: 'Review Q1 Roadmap', start: 1, span: 2, color: Colors.danger },
  { title: 'Call John', start: 3, span: 1, color: Colors.warning },
  { title: 'Team standup', start: 0, span: 1, color: Colors.brandBlue },
  { title: 'Deep work — coding', start: 5, span: 3, color: Colors.violet },
];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useStore();
  const [selectedDay, setSelectedDay] = useState(TODAY_IDX);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - TODAY_IDX);

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d.getDate();
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Calendar</Text>
        <View style={styles.toggleRow}>
          {(['week', 'month'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[styles.togglePill, viewMode === mode && styles.togglePillActive]}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === mode && styles.toggleTextActive,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        {DAYS.map((day, i) => {
          const isToday = i === TODAY_IDX;
          const isSelected = i === selectedDay;
          const dayTasks = tasks.filter((t) => {
            if (i === TODAY_IDX) return t.dueDate === 'Today';
            return false;
          });
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(i)}
              style={styles.dayCol}
            >
              <Text style={styles.dayLabel}>{day}</Text>
              <View
                style={[
                  styles.dateCircle,
                  isToday && styles.dateCircleToday,
                  isSelected && !isToday && styles.dateCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateNum,
                    isToday && styles.dateNumToday,
                    isSelected && !isToday && styles.dateNumSelected,
                  ]}
                >
                  {weekDates[i]}
                </Text>
              </View>
              {/* Task dots */}
              <View style={styles.dotRow}>
                {dayTasks.slice(0, 3).map((t, di) => (
                  <View
                    key={di}
                    style={[styles.taskDot, { backgroundColor: Colors.priority[t.priority] }]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        <View style={styles.timelineInner}>
          {HOURS.map((hour, hi) => (
            <View key={hour} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{hour}</Text>
              <View style={styles.hourLine} />
              {/* Task blocks for this hour */}
              {selectedDay === TODAY_IDX &&
                TIME_BLOCKS.filter((b) => b.start === hi).map((block, bi) => (
                  <View
                    key={bi}
                    style={[
                      styles.taskBlock,
                      {
                        backgroundColor: block.color + '33',
                        borderLeftColor: block.color,
                        height: 48 * block.span - 4,
                        top: 0,
                      },
                    ]}
                  >
                    <Text style={[styles.taskBlockTitle, { color: block.color }]} numberOfLines={1}>
                      {block.title}
                    </Text>
                  </View>
                ))}
            </View>
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 14,
  },
  screenTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.elevated,
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  togglePillActive: {
    backgroundColor: Colors.brandBlue,
  },
  toggleText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.white,
  },

  // Week strip
  weekStrip: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.elevated,
    marginBottom: 4,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCircleToday: {
    backgroundColor: Colors.brandBlue,
  },
  dateCircleSelected: {
    borderWidth: 1,
    borderColor: Colors.brandBlue,
  },
  dateNum: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dateNumToday: {
    color: Colors.white,
  },
  dateNumSelected: {
    color: Colors.brandBlue,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Timeline
  timeline: {
    flex: 1,
  },
  timelineInner: {
    paddingBottom: 32,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 52,
    paddingLeft: Spacing.sm,
    position: 'relative',
  },
  hourLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    width: 44,
    paddingTop: 2,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.elevated,
    marginTop: 8,
  },
  taskBlock: {
    position: 'absolute',
    left: 60,
    right: Spacing.sm,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    padding: 8,
  },
  taskBlockTitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
});
