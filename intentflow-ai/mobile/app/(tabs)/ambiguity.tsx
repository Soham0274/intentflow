import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/Button';
import { PhosphorIcon } from '@/components/PhosphorIcon';

export default function AmbiguityScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar status="analyzing" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Analyze Request</Text>
        
        <View style={[styles.inputBox, { backgroundColor: theme.input }]}>
          <Text style={[styles.inputText, { color: theme.textSecondary }]}>
            "Add eggs to my trip to SF."
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Choose Mapping</Text>

        <Card 
          selected={selected === 'shopping'} 
          onPress={() => setSelected('shopping')}
        >
          <View style={styles.cardHeader}>
             <PhosphorIcon name="check" size={20} color={selected === 'shopping' ? theme.accent : theme.textSecondary} />
             <Text style={[styles.cardTitle, { color: theme.textPrimary, marginLeft: 12 }]}>Shopping List</Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.textSecondary, marginLeft: 32 }]}>Extracts 'eggs' and appends to 'Groceries'.</Text>
        </Card>

        <Card 
          selected={selected === 'trip'} 
          onPress={() => setSelected('trip')}
        >
          <View style={styles.cardHeader}>
             <PhosphorIcon name="check" size={20} color={selected === 'trip' ? theme.accent : theme.textSecondary} />
             <Text style={[styles.cardTitle, { color: theme.textPrimary, marginLeft: 12 }]}>SF Itinerary</Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.textSecondary, marginLeft: 32 }]}>Adds physical item 'eggs' to trip packing list.</Text>
        </Card>

        <View style={{ marginTop: 32 }}>
           <GradientButton label="Confirm Mapping" onPress={() => {}} />
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
    marginBottom: 24,
  },
  inputBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  inputText: {
    fontFamily: Fonts.mono, // Using DM Sans as fallback for mono per theme
    fontSize: 15,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
  },
  cardDesc: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
});
