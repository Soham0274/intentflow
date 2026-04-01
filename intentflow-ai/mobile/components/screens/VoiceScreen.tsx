import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius, Shadow, GradientColors } from '@/constants/theme';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/store/useStore';

interface WaveformProps {
  active: boolean;
}

function Waveform({ active }: WaveformProps) {
  const bars = 5;
  const anims = useRef(Array.from({ length: bars }, () => new Animated.Value(0.4))).current;

  useEffect(() => {
    if (active) {
      anims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 300 + i * 50,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.4,
              duration: 300 + i * 50,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      anims.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [active]);

  return (
    <View style={waveformStyles.container}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            waveformStyles.bar,
            {
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const waveformStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
  },
  bar: {
    width: 4,
    height: 28,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
});

interface ParseRowProps {
  label: string;
  value: string;
  badge?: string;
  badgeColor?: string;
}

function ParseRow({ label, value, badge, badgeColor = Colors.teal }: ParseRowProps) {
  return (
    <View style={parseRowStyles.row}>
      <Text style={parseRowStyles.label}>{label}</Text>
      <View style={parseRowStyles.valueWrap}>
        <Text style={parseRowStyles.value}>{value}</Text>
        {badge && (
          <View style={[parseRowStyles.badge, { backgroundColor: badgeColor + '20' }]}>
            <Text style={[parseRowStyles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const parseRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
  },
});

function MicButton({ onPress, active }: { onPress: () => void; active: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [active]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={micStyles.wrapper}
    >
      <Animated.View style={[micStyles.pulse, { opacity: pulseAnim, transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }] }]} />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient colors={GradientColors.brand as [string, string]} style={micStyles.gradient}>
          <Text style={micStyles.icon}>🎙</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const micStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent + '30',
  },
  gradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
});

export function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const { navigateToScreen } = useStore();
  const [isListening, setIsListening] = React.useState(true);

  const transcript = "Remind Sarah about the project deadline tomorrow at 3pm";
  const parseData = [
    { label: 'Entity', value: 'Sarah', badge: '98%', badgeColor: Colors.teal },
    { label: 'Action', value: 'Send Reminder', badge: 'Confident', badgeColor: Colors.accent },
    { label: 'Trigger', value: 'Tomorrow 3:00 PM', badge: 'Time', badgeColor: Colors.amber },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TopBar
        status="analyzing"
        statusBarLabel="Listening..."
        rightSlot={<Avatar initials="A" size={36} />}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.transcriptWrap}>
          <Waveform active={isListening} />
          <Text style={styles.transcript}>
            {transcript}
          </Text>
        </View>

        <Card style={styles.parseCard}>
          <Text style={styles.parseTitle}>NLP Parse</Text>
          {parseData.map((row, i) => (
            <ParseRow key={i} {...row} />
          ))}
        </Card>

        <Text style={styles.hint}>Tap the mic to confirm or edit details</Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <MicButton onPress={() => setIsListening(!isListening)} active={isListening} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  transcriptWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  transcript: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
    marginTop: Spacing.md,
  },
  parseCard: {
    marginTop: Spacing.md,
  },
  parseTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  hint: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    paddingTop: Spacing.md,
    ...Shadow.default,
  },
});