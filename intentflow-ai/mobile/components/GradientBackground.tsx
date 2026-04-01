import React from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
}

export function GradientBackground({ children, style }: GradientBackgroundProps) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <View
        style={[
          styles.topGlow,
          { backgroundColor: colors.primary, opacity: 0.07 },
        ]}
      />
      <View
        style={[
          styles.bottomGlow,
          { backgroundColor: colors.accent, opacity: 0.05 },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    left: -50,
  },
  bottomGlow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: -80,
    right: -60,
  },
});
