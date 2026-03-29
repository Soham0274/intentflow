import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { Colors, Fonts } from '@/constants/theme';

interface ConfidenceGaugeProps {
  percentage: number; // 0–100
}

const R = 52;
const SW = 10;
const VW = 140;
const VH = 88;
const CX = 70;
const CY = 60;
const ARC_LEN = Math.PI * R;

function gaugeColor(p: number) {
  if (p >= 85) return Colors.success;
  if (p >= 65) return Colors.warning;
  return Colors.danger;
}

export default function ConfidenceGauge({ percentage }: ConfidenceGaugeProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const fillLen = (clamped / 100) * ARC_LEN;
  const color = gaugeColor(clamped);

  const bgPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 0 ${CX + R} ${CY}`;

  return (
    <View style={styles.container}>
      <Svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`}>
        {/* Background arc */}
        <Path
          d={bgPath}
          stroke={Colors.elevated}
          strokeWidth={SW}
          fill="none"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {clamped > 0 && (
          <Path
            d={bgPath}
            stroke={color}
            strokeWidth={SW}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${fillLen} ${ARC_LEN}`}
          />
        )}
        {/* Glow effect inner arc */}
        {clamped > 0 && (
          <Path
            d={bgPath}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${fillLen} ${ARC_LEN}`}
            opacity={0.3}
          />
        )}
      </Svg>

      {/* Centered percentage label */}
      <View style={styles.centerLabel}>
        <Text style={[styles.percentage, { color, fontFamily: Fonts.mono }]}>
          {clamped}%
        </Text>
        <Text style={styles.confLabel}>confidence</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    bottom: 4,
    alignItems: 'center',
  },
  percentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  confLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
