import React, { useState } from "react";
import { TouchableOpacity, View, Text, StyleSheet, Animated } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface VoiceButtonProps {
  onPress: () => void;
  isActive?: boolean;
  size?: number;
}

export function VoiceButton({ onPress, isActive = false, size = 80 }: VoiceButtonProps) {
  const colors = useColors();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  const pulseAnimation = isActive ? {
    transform: [{ scale: scaleAnim }],
  } : {};

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isActive ? colors.voiceActive : colors.card,
          borderColor: isActive ? colors.voiceActive : colors.border,
          borderWidth: 2,
        },
        pulseAnimation
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={[
        styles.innerCircle,
        {
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size * 0.3,
          backgroundColor: isActive ? colors.voiceActive + "20" : "transparent",
        }
      ]}>
        <Feather 
          name="mic" 
          size={size * 0.3} 
          color={isActive ? colors.background : colors.voiceActive} 
        />
      </View>
      
      {isActive && (
        <Animated.View style={[
          styles.pulseRing,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            borderColor: colors.voiceActive,
          }
        ]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  innerCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
    opacity: 0.3,
  },
});
