import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { StatusPill, PillVariant } from '../StatusPill';

interface TopBarProps {
  status: PillVariant;
  statusBarLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightSlot?: ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export function TopBar({ 
  status, 
  statusBarLabel, 
  leftIcon, 
  rightIcon, 
  rightSlot, 
  onLeftPress, 
  onRightPress 
}: TopBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.content}>
        <TouchableOpacity 
          onPress={onLeftPress} 
          style={[styles.iconButton, { backgroundColor: colors.bgCardHover || '#1E2130', borderColor: colors.border }]}
        >
          {leftIcon}
        </TouchableOpacity>
        
        <StatusPill variant={status} label={statusBarLabel} />

        <TouchableOpacity 
          onPress={onRightPress} 
          style={[styles.iconButton, { backgroundColor: colors.bgCardHover || '#1E2130', borderColor: colors.border }]}
        >
          {rightSlot || rightIcon}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
    borderRadius: 12, // Rounded square per spec
    alignItems: 'center',
    justifyContent: 'center',
  },
});