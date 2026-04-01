import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface AvatarButtonProps {
  initial?: string;
  onPress?: () => void;
  size?: number;
}

export function AvatarButton({ initial = "U", onPress, size = 40 }: AvatarButtonProps) {
  const colors = useColors();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary + "20",
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.initial,
        {
          color: colors.primary,
          fontSize: size * 0.4,
        }
      ]}>
        {initial.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontWeight: "700",
  },
});
