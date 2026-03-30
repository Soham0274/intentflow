import { useRef } from 'react';
import { Animated } from 'react-native';

export function useAnimatedValue(initialValue: number) {
  const ref = useRef(new Animated.Value(initialValue));
  return ref.current;
}