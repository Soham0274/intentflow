import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { StatusPill } from '@/components/ui/StatusPill';
import { Card } from '@/components/ui/Card';

export function ErrorScreen() {
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  const handleReconnect = () => {
    setIsReconnecting(true);
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
      setIsReconnecting(false);
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <StatusPill status="offline" />
      </View>

      <View style={styles.content}>
        <Text style={styles.headline}>System Offline</Text>
        <Text style={styles.subheadline}>
          We're having trouble connecting to our servers. Please check your internet connection.
        </Text>

        <Card style={styles.errorCard}>
          <Text style={styles.errorLabel}>ERROR CODE</Text>
          <Text style={styles.errorCode}>ERR_NETWORK_TIMEOUT</Text>
          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailText}>Request ID: req_8xK2mNpQ</Text>
            <Text style={styles.errorDetailText}>Timestamp: {new Date().toISOString()}</Text>
          </View>
        </Card>

        <TouchableOpacity
          onPress={handleReconnect}
          disabled={isReconnecting}
          style={styles.reconnectBtn}
        >
          <Animated.Text style={[styles.reconnectIcon, { transform: [{ rotate: spin }] }]}>
            ↻
          </Animated.Text>
          <Text style={styles.reconnectText}>
            {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  headline: {
    fontFamily: Fonts.displayExtra,
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  subheadline: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  errorCard: {
    marginTop: Spacing.xl,
    width: '100%',
    backgroundColor: Colors.redDim,
    borderColor: 'rgba(255,68,85,0.2)',
  },
  errorLabel: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    color: Colors.red,
    letterSpacing: 1.4,
  },
  errorCode: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  errorDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  errorDetailText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  reconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reconnectIcon: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  reconnectText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
});