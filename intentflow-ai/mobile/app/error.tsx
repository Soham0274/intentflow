import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { GradientButton } from '@/components/ui/Button';

export default function ErrorScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopBar status="offline" />
      
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.cardAlt }]}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
        </View>
        
        <Text style={[styles.title, { color: theme.textPrimary }]}>Connection Error</Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>We were unable to reach the knowledge graph. Your change has been stored locally.</Text>
        
        <View style={styles.btnWrap}>
           <GradientButton label="Retry Connection" onPress={() => {}} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  btnWrap: {
    width: '100%',
    marginTop: 48,
  },
});
