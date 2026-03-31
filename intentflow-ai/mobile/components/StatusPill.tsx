import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type PillVariant = 'online' | 'offline' | 'analyzing' | 'actionReady' | 'listening';

interface StatusPillProps {
  variant: PillVariant;
  label?:  string;
}

const PILL_CONFIG: Record<PillVariant, { dot: string; bg: string; text: string; label: string }> = {
  online:      { dot: '#10B981', bg: 'rgba(16,185,129,0.15)',  text: '#10B981', label: 'System Online'    },
  offline:     { dot: '#EF4444', bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', label: 'SYSTEM OFFLINE'   },
  analyzing:   { dot: '#14B8A6', bg: 'rgba(20,184,166,0.15)',  text: '#14B8A6', label: 'System Analyzing' },
  actionReady: { dot: '#10B981', bg: 'rgba(16,185,129,0.15)',  text: '#10B981', label: 'Action Ready'     },
  listening:   { dot: '#14B8A6', bg: 'rgba(20,184,166,0.12)',  text: '#14B8A6', label: 'Listening'        },
};

export const StatusPill: React.FC<StatusPillProps> = ({ variant, label }) => {
  const cfg = PILL_CONFIG[variant];
  const { typography } = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg, borderColor: `${cfg.dot}30` }]}>
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
    width:        7,
    height:       7,
    borderRadius: 4,
  },
});
