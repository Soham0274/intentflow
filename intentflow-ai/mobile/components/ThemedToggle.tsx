import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ThemedToggleProps {
  value:    boolean;
  onChange: (val: boolean) => void;
}

export const ThemedToggle: React.FC<ThemedToggleProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(value ? 22 : 4)).current;
  const bgAnim    = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: value ? 22 : 4, useNativeDriver: true, damping: 15, stiffness: 120 }),
      Animated.timing(bgAnim,    { toValue: value ? 1 : 0,  useNativeDriver: false, duration: 250 }),
    ]).start();
  }, [value]);

  const bgColor = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.toggleOff || '#2A2D3A', colors.toggleOn || '#6C63FF'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => { 
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
        onChange(!value); 
      }}
    >
      <Animated.View 
        style={[
          styles.track, 
          { backgroundColor: bgColor },
          value && {
            boxShadow: '0px 0px 10px rgba(108,99,255,0.4)',
            elevation: 8,
          }
        ]}
      >
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width:        50,
    height:       28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  thumb: {
    width:        22,
    height:       22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    boxShadow: '0px 2px 3px rgba(0,0,0,0.25)',
    elevation: 3,
  },
});
