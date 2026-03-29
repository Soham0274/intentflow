import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '@/constants/theme';
import { ToastMessage } from '@/types/index';
import { useStore } from '@/store/useStore';

const TOAST_META = {
  success: { color: Colors.success, icon: '✓' },
  error: { color: Colors.danger, icon: '✕' },
  info: { color: Colors.brandBlue, icon: 'ℹ' },
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const { dismissToast } = useStore();
  const { color, icon } = TOAST_META[toast.type];

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.toast, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={[styles.iconBadge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.iconText, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
      <TouchableOpacity onPress={() => dismissToast(toast.id)} style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ToastContainer() {
  const { toasts } = useStore();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: Radius.md,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.default,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  message: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  close: {
    padding: 4,
  },
  closeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
