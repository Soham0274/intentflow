import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { StatusPill } from '@/components/ui/StatusPill';
import { Card } from '@/components/ui/Card';

interface AmbiguityOption {
  id: string;
  icon: string;
  title: string;
  confidence: number;
  description: string;
  tags: string[];
}

interface OptionCardProps {
  option: AmbiguityOption;
  selected: boolean;
  onSelect: () => void;
}

function OptionCard({ option, selected, onSelect }: OptionCardProps) {
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.85}>
      <Card style={[
          optionStyles.card, 
          selected && optionStyles.cardSelected
        ]}>
        <View style={optionStyles.header}>
          <View style={optionStyles.iconWrap}>
            <Text style={optionStyles.icon}>{option.icon}</Text>
          </View>
          <View style={optionStyles.titleWrap}>
            <Text style={optionStyles.title}>{option.title}</Text>
            <View style={[
                optionStyles.badge, 
                selected && optionStyles.badgeSelected
              ]}>
              <Text style={[
                  optionStyles.badgeText, 
                  selected && optionStyles.badgeTextSelected
                ]}>
                {option.confidence}% confidence
              </Text>
            </View>
          </View>
        </View>

        {selected && (
          <View style={optionStyles.expanded}>
            <Text style={optionStyles.description}>{option.description}</Text>
            <View style={optionStyles.tags}>
              {option.tags.map((tag, i) => (
                <View key={i} style={optionStyles.tag}>
                  <Text style={optionStyles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const optionStyles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(124,111,255,0.07)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 22,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bgCardAlt,
  },
  badgeSelected: {
    backgroundColor: Colors.tealDim,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.textMuted,
  },
  badgeTextSelected: {
    color: Colors.teal,
  },
  expanded: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  description: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.pill,
  },
  tagText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
});

export function AmbiguityScreen() {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const options: AmbiguityOption[] = [
    {
      id: '1',
      icon: '📅',
      title: 'Schedule Meeting',
      confidence: 78,
      description: 'Create a calendar event for the team standup with all participants.',
      tags: ['Calendar', 'Meeting', 'Team'],
    },
    {
      id: '2',
      icon: '👥',
      title: 'Send Team Message',
      confidence: 65,
      description: 'Post a message to the team channel about the standup topic.',
      tags: ['Slack', 'Message', 'Team'],
    },
    {
      id: '3',
      icon: '📝',
      title: 'Create Task',
      confidence: 52,
      description: 'Add a task item to your task list with the standup agenda.',
      tags: ['Tasks', 'Project', 'Reminder'],
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <StatusPill status="analyzing" label="Multiple interpretations detected" />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headline}>What did you mean?</Text>
        <Text style={styles.subheadline}>
          Your voice command could be interpreted in multiple ways. Please select the intent you'd like to proceed with.
        </Text>

        <View style={styles.options}>
          {options.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              selected={selectedId === option.id}
              onSelect={() => setSelectedId(option.id)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, !selectedId && styles.confirmBtnDisabled]}
          disabled={!selectedId}
        >
          <Text style={[styles.confirmText, !selectedId && styles.confirmTextDisabled]}>
            Confirm Selection
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  headline: {
    fontFamily: Fonts.displayExtra,
    fontSize: 24,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  subheadline: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  options: {
    marginTop: Spacing.lg,
  },
  confirmBtn: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.bgCardAlt,
  },
  confirmText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  confirmTextDisabled: {
    color: Colors.textMuted,
  },
});