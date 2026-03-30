import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { StatusPill } from './StatusPill';
import { PhosphorIcon } from '@/components/PhosphorIcon'; // I will create a Phosphor icon wrapper for standard vector-icons

interface TopBarProps {
  status: 'online' | 'analyzing' | 'offline';
  statusBarLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export function TopBar({ status, statusBarLabel, leftIcon, rightIcon, onLeftPress, onRightPress }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
          {leftIcon}
        </TouchableOpacity>
        
        <StatusPill status={status} label={statusBarLabel} />

        <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
          {rightIcon}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor & borderColor supplied by theme
  },
});