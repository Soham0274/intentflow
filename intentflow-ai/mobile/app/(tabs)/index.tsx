import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing, Shadow, GradientColors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import TaskCard from '@/components/ui/TaskCard';
import StatCard from '@/components/ui/StatCard';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import ProgressBar from '@/components/ui/ProgressBar';
import PriorityBadge from '@/components/ui/PriorityBadge';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, user, toggleTask, openCapture, fetchTasks } = useStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const todayTasks = tasks.filter((t) => t.dueDate === 'Today');
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedToday = tasks.filter((t) => t.status === 'completed' && t.dueDate === 'Today');
  const focusTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 3);
  const streak = 7;
  const completionPct =
    todayTasks.length > 0
      ? Math.round((completedToday.length / todayTasks.length) * 100)
      : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <Avatar initials={user.avatar} size={42} showOnlineDot />
          <Text style={styles.screenTitle}>Today</Text>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* ── Focus Mode Card ── */}
        <View style={styles.section}>
          <LinearGradient
            colors={GradientColors.focusCard as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.focusCard}
          >
            <View style={styles.focusHeader}>
              <Text style={styles.focusTitle}>🎯 Focus Mode</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {focusTasks.length === 0 ? (
              <Text style={styles.noFocus}>All caught up! 🎉</Text>
            ) : (
              focusTasks.map((task) => {
                const barColor = Colors.priority[task.priority];
                return (
                  <View key={task.id} style={styles.focusTaskRow}>
                    <View style={[styles.focusPriorityBar, { backgroundColor: barColor }]} />
                    <Text style={styles.focusTaskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <PriorityBadge priority={task.priority} showLabel={false} />
                  </View>
                );
              })
            )}

            {/* Progress bar */}
            <View style={styles.focusProgress}>
              <ProgressBar
                progress={completionPct}
                color={Colors.success}
                height={5}
                showLabel={false}
              />
              <Text style={styles.focusProgressLabel}>
                {completedToday.length}/{todayTasks.length} done today
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Stats Row ── */}
        <View style={[styles.statsRow, styles.section]}>
          <StatCard
            label="Tasks Today"
            value={todayTasks.length}
            valueColor={Colors.textPrimary}
          />
          <View style={styles.statsGap} />
          <StatCard
            label="Completed"
            value={completedToday.length}
            valueColor={Colors.success}
          />
          <View style={styles.statsGap} />
          <StatCard
            label="Streak 🔥"
            value={streak}
            valueColor={Colors.warning}
          />
        </View>

        {/* ── Active Tasks ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Active Tasks"
            action="Filter"
            style={styles.sectionHeaderSpacing}
          />
        </View>

        {activeTasks.length === 0 ? (
          <EmptyState
            icon="✅"
            title="All tasks complete!"
            subtitle="You're crushing it. Add a new task to keep the momentum."
            cta="+ Add Task"
            onCta={openCapture}
          />
        ) : (
          <View style={styles.taskList}>
            {activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </View>
        )}

        {/* Completed section */}
        {completedToday.length > 0 && (
          <View style={[styles.section, styles.taskList]}>
            <SectionHeader title={`Completed (${completedToday.length})`} style={styles.sectionHeaderSpacing} />
            {completedToday.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} />
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
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
    paddingBottom: 16,
  },
  section: {
    paddingHorizontal: Spacing.sm,
  },
  sectionHeaderSpacing: {
    marginBottom: 12,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 14,
    marginBottom: 4,
  },
  screenTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
  },
  bellIcon: { fontSize: 22 },
  bellDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  // Focus Mode
  focusCard: {
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brandBlue + '33',
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  focusTitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  seeAll: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.brandBlue,
  },
  noFocus: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  focusTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  focusPriorityBar: {
    width: 3,
    height: 30,
    borderRadius: 2,
  },
  focusTaskTitle: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  focusProgress: {
    marginTop: 10,
    gap: 6,
  },
  focusProgressLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  statsGap: { width: 10 },

  // Task list
  taskList: {
    paddingHorizontal: Spacing.sm,
  },
});
