import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { PhosphorIcon } from '@/components/PhosphorIcon';

const HUBS = [
  { id: '1', title: 'Work Ecosystem', tasks: 42, color: 'accent' },
  { id: '2', title: 'Personal Goals', tasks: 18, color: 'teal' },
  { id: '3', title: 'Health Tracking', tasks: 7, color: 'amber' }
];

export default function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar 
        status="online" 
        leftIcon={<PhosphorIcon name="user" size={24} color={theme.textPrimary} />} 
      />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Knowledge Hub</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your mapped life areas</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        snapToInterval={280}
        decelerationRate="fast"
      >
        {HUBS.map(hub => (
          <Card key={hub.id} style={[styles.hubCard, { backgroundColor: theme.cardAlt }]} hoverable onPress={() => {}}>
            <View style={[styles.iconWrap, { backgroundColor: (theme as any)[hub.color] + '20' }]}>
               <PhosphorIcon name="compass" size={28} color={(theme as any)[hub.color]} />
            </View>
            <Text style={[styles.hubTitle, { color: theme.textPrimary }]}>{hub.title}</Text>
            <Text style={[styles.hubDesc, { color: theme.textSecondary }]}>{hub.tasks} active items</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hubCard: {
    width: 264,
    height: 320,
    marginRight: 16,
    justifyContent: 'flex-end',
    padding: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 'auto',
  },
  hubTitle: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    marginBottom: 8,
  },
  hubDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
});
