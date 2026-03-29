import React from 'react';
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
import ProgressBar from '@/components/ui/ProgressBar';
import { AvatarGroup } from '@/components/ui/Avatar';

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { projects } = useStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Projects</Text>
        <TouchableOpacity style={styles.newBtn}>
          <Text style={styles.newBtnText}>+ New Project</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[styles.card, { borderLeftColor: project.color }]}
            activeOpacity={0.85}
          >
            {/* Color accent overlay */}
            <View style={[styles.cardAccentGlow, { backgroundColor: project.color + '0D' }]} />

            {/* Project name */}
            <View style={styles.cardHeader}>
              <View style={[styles.colorDot, { backgroundColor: project.color }]} />
              <Text style={styles.projectName}>{project.name}</Text>
            </View>

            {/* Progress */}
            <View style={styles.progressRow}>
              <ProgressBar
                progress={project.progress}
                color={project.color}
                height={7}
                showLabel
              />
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <Text style={styles.statItem}>{project.tasks} tasks</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={[styles.statItem, { color: Colors.success }]}>
                {project.completed} done
              </Text>
              {project.overdue > 0 && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={[styles.statItem, { color: Colors.danger }]}>
                    {project.overdue} overdue
                  </Text>
                </>
              )}
            </View>

            {/* Bottom row */}
            <View style={styles.bottomRow}>
              <AvatarGroup initials={project.members} size={28} />
              <View style={styles.dueDateBadge}>
                <Text style={styles.dueDateIcon}>📅</Text>
                <Text style={styles.dueDateText}>{project.dueDate}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 16 }} />
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
  newBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.brandBlue,
  },
  newBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.brandBlue,
  },
  scroll: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.elevated,
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...Shadow.card,
    gap: 14,
  },
  cardAccentGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  projectName: {
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    color: Colors.textPrimary,
    flex: 1,
  },
  progressRow: {},
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statItem: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  dot: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dueDateIcon: { fontSize: 12 },
  dueDateText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
