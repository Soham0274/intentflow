import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';
import { OutlineButton } from '@/components/ui/Button';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar status="online" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
           <Avatar initials="JD" size={80} gradient />
           <Text style={[styles.name, { color: theme.textPrimary }]}>John Doe</Text>
           <Text style={[styles.email, { color: theme.textSecondary }]}>john@intentflow.ai</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Ecosystem Connect</Text>
        
        <View style={styles.toggleRow}>
           <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Notion Sync</Text>
           <Toggle value={true} onValueChange={() => {}} />
        </View>
        <View style={styles.toggleRow}>
           <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Slack Messages</Text>
           <Toggle value={false} onValueChange={() => {}} />
        </View>
        <View style={styles.toggleRow}>
           <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Google Calendar</Text>
           <Toggle value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.logoutWrap}>
           <OutlineButton label="Sign Out" onPress={() => {}} />
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 24,
    marginTop: 16,
    marginBottom: 4,
  },
  email: {
    fontFamily: Fonts.regular,
    fontSize: 16,
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
  logoutWrap: {
    marginTop: 32,
  },
});
