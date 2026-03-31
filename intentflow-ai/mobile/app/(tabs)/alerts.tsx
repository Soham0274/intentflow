import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { fetchPendingHitl } from '../../services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { PhosphorIcon } from '@/components/PhosphorIcon';

export default function AlertsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  
  const [toggles, setToggles] = useState({ review: true, goals: false, budget: true });
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);

  const updateToggle = (k: keyof typeof toggles) => setToggles(p => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await fetchPendingHitl();
        setPendingTasks(data || []);
      } catch (e) {
        console.warn('Failed to load pending HITL tasks', e);
      }
    }
    loadTasks();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar status="online" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Smart Nudges & Reviews</Text>
        
        {pendingTasks.length > 0 ? pendingTasks.map((pt, idx) => (
          <Card key={pt.id || idx} style={{ ...styles.insightCard, backgroundColor: theme.accent2 + '20', borderColor: theme.accent }}>
            <View style={styles.insightHeader}>
               <PhosphorIcon name="warning" size={24} color={theme.accent} />
               <Text style={[styles.insightTitle, { color: theme.accent }]}>Action Required</Text>
            </View>
            <Text style={[styles.insightContent, { color: theme.text }]}>
              {pt.raw_input ? `Review parsed task from input: "${pt.raw_input}"` : 'A pending automation requires your approval.'}
            </Text>
          </Card>
        )) : (
          <Card style={{ ...styles.insightCard, backgroundColor: theme.accent2 + '20', borderColor: theme.accent }}>
            <View style={styles.insightHeader}>
               <PhosphorIcon name="warning" size={24} color={theme.accent} />
               <Text style={[styles.insightTitle, { color: theme.accent }]}>Weekly Insight</Text>
            </View>
            <Text style={[styles.insightContent, { color: theme.text }]}>You added 3 books to your reading list but haven't allocated any time for them. Want to block out 30 mins this Sunday?</Text>
          </Card>
        )}

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Rules Engine</Text>
        
        <View style={styles.toggleRow}>
           <Text style={[styles.toggleLabel, { color: theme.text }]}>Weekend Reviews</Text>
           <Toggle value={toggles.review} onValueChange={() => updateToggle('review')} />
        </View>
        <View style={styles.toggleRow}>
           <Text style={[styles.toggleLabel, { color: theme.text }]}>Goal Progress Pings</Text>
           <Toggle value={toggles.goals} onValueChange={() => updateToggle('goals')} />
        </View>
        <View style={styles.toggleRow}>
           <Text style={[styles.toggleLabel, { color: theme.text }]}>Budget Thresholds</Text>
           <Toggle value={toggles.budget} onValueChange={() => updateToggle('budget')} />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    marginBottom: 32,
  },
  insightCard: {
    padding: 24,
    marginBottom: 48,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginLeft: 12,
  },
  insightContent: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  toggleLabel: {
    fontFamily: Fonts.medium,
    fontSize: 17,
  },
});
