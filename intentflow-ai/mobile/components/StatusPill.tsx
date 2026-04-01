import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type PillVariant = 'online' | 'offline' | 'analyzing' | 'actionReady' | 'listening' | 'lowConfidence';

interface StatusPillProps {
  variant: PillVariant;
  label?:  string;
}

const PILL_CONFIG: Record<PillVariant, { dot: string; bg: string; text: string; label: string; border: string }> = {
  online:      { dot: '#00C896', bg: 'rgba(0,200,150,0.12)',  text: '#00C896', label: 'System Online',    border: 'rgba(0,200,150,0.20)' },
  offline:     { dot: '#FF4D4D', bg: 'rgba(255,77,77,0.12)',   text: '#FF4D4D', label: 'System Offline',   border: 'rgba(255,77,77,0.20)' },
  analyzing:   { dot: '#6C63FF', bg: 'rgba(108,99,255,0.12)',  text: '#6C63FF', label: 'System Analyzing', border: 'rgba(108,99,255,0.20)' },
  actionReady: { dot: '#00C896', bg: 'rgba(0,200,150,0.15)',  text: '#00C896', label: 'Action Ready',     border: 'rgba(0,200,150,0.30)' },
  listening:   { dot: '#6C63FF', bg: 'rgba(108,99,255,0.12)',  text: '#6C63FF', label: 'Listening',        border: 'rgba(108,99,255,0.20)' },
  lowConfidence: { dot: '#FF4D4D', bg: '#2A1515',              text: '#FF4D4D', label: 'Low Confidence',   border: 'rgba(255,77,77,0.30)' },
};

export const StatusPill: React.FC<StatusPillProps> = ({ variant, label }) => {
  const cfg = PILL_CONFIG[variant];
  const { typography } = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[typography.statusSM, { color: cfg.text }]}>
        {label ?? cfg.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 12,
    paddingVertical:    6,
    borderRadius:   20,
    borderWidth:    1,
    gap: 6,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
});
