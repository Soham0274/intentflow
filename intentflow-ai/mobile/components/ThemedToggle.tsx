import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ThemedToggleProps {
  value:    boolean;
  onChange: (val: boolean) => void;
}

export const ThemedToggle: React.FC<ThemedToggleProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(value ? 20 : 2)).current;
  const bgAnim    = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: value ? 20 : 2, useNativeDriver: true, damping: 15 }),
      Animated.timing(bgAnim,    { toValue: value ? 1 : 0,  useNativeDriver: false, duration: 200 }),
    ]).start();
  }, [value]);

  const bgColor = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.toggleOff, colors.toggleOn],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(!value); }}
    >
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width:        48,
    height:       28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  thumb: {
    width:        22,
    height:       22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius:  3,
    elevation: 3,
  },
});
