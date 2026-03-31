import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { StatusPill } from '../components/StatusPill';

export default function ConnectionErrorScreen() {
  const { colors, typography } = useTheme();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Subtle shake on mount to indicate error
  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  4, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[eStyles.root, { backgroundColor: colors.bg }]}>
      {/* Subtle red gradient overlay */}
      <View style={[eStyles.redTint, { backgroundColor: colors.errorDim }]} pointerEvents="none" />

      {/* Top Bar */}
      <View style={eStyles.topBar}>
        <TouchableOpacity style={[eStyles.menuBtn, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="menu" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <StatusPill variant="offline" />
        <View style={[eStyles.avatar, { backgroundColor: colors.bgCard }]}>
          <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>A</Text>
        </View>
      </View>

      {/* Error Content */}
      <View style={eStyles.body}>
        {/* CONNECTION LOST label */}
        <View style={eStyles.errorLabel}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={[typography.statusLG, { color: colors.error, marginLeft: 8 }]}>Connection Lost</Text>
        </View>

        {/* Headline */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Text style={[typography.headingLG, { color: colors.textPrimary, marginTop: 16, marginBottom: 0 }]}>
            Unable to reach the processing engine.{' '}
            <Text style={{ color: colors.textMuted }}>
              Check your network connection and try again.
            </Text>
          </Text>
        </Animated.View>

        {/* Error Code Card */}
        <View style={[eStyles.errorCard, { backgroundColor: colors.bgCard, borderColor: colors.errorDim }]}>
          <View style={eStyles.errorCardRow}>
            <View style={[eStyles.triangleIcon, { borderBottomColor: colors.error }]} />
            <View>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Protocol Error 408</Text>
              <Text style={[typography.statusSM, { color: colors.textMuted, marginTop: 2 }]}>
                TIMED_OUT_WAITING_FOR_RESPONSE
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Bar */}
      <View style={[eStyles.bottomBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border }]}>
        <View>
          <Text style={[typography.bodyBold, { color: colors.textSecondary }]}>Service Unavailable</Text>
          <Text style={[typography.statusSM, { color: colors.error, marginTop: 2 }]}>Sync Interrupted</Text>
        </View>
        <TouchableOpacity
          style={[eStyles.reconnectBtn, { backgroundColor: colors.error }]}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={[typography.bodyBold, { color: '#FFF' }]}>Reconnect</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const eStyles = StyleSheet.create({
  root:          { flex: 1 },
  redTint:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06 },
  topBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  menuBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatar:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body:          { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  errorLabel:    { flexDirection: 'row', alignItems: 'center' },
  errorCard:     { marginTop: 32, borderRadius: 16, borderWidth: 1, padding: 18 },
  errorCardRow:  { flexDirection: 'row', alignItems: 'center' },
  triangleIcon:  { width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginRight: 14 },
  bottomBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  reconnectBtn:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16 },
});
