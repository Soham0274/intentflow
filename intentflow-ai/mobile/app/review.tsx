import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/Button';

export default function ReviewScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [input, setInput] = useState("Buy milk and email Sarah about the Q3 report");
  const [selectedMapping, setSelectedMapping] = useState('groceries');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar status="analyzing" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Human In The Loop</Text>
        
        <View style={[styles.inputGroup, { backgroundColor: theme.cardAlt }]}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Raw Voice Input</Text>
          <TextInput
            style={[styles.inputField, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.input }]}
            value={input}
            onChangeText={setInput}
            multiline
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Extracted Entities</Text>
        
        <Card style={styles.entityCard}>
          <Text style={[styles.entityLabel, { color: theme.textSecondary }]}>Task 1</Text>
          <Text style={[styles.entityValue, { color: theme.textPrimary }]}>Buy milk</Text>
          <View style={[styles.badge, { backgroundColor: theme.tealDim }]}>
             <Text style={[styles.badgeText, { color: theme.teal }]}>Groceries</Text>
          </View>
        </Card>

        <Card style={styles.entityCard}>
          <Text style={[styles.entityLabel, { color: theme.textSecondary }]}>Task 2</Text>
          <Text style={[styles.entityValue, { color: theme.textPrimary }]}>Email Sarah about Q3 report</Text>
          <View style={[styles.badge, { backgroundColor: theme.amber + '20' }]}>
             <Text style={[styles.badgeText, { color: theme.amber }]}>Work / Comms</Text>
          </View>
        </Card>

        <View style={{ marginTop: 24 }}>
           <GradientButton label="Approve & Send" onPress={() => {}} />
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
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    marginBottom: 32,
  },
  inputGroup: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 40,
  },
  inputLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputField: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  entityCard: {
    marginBottom: 16,
    padding: 20,
  },
  entityLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  entityValue: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
});
