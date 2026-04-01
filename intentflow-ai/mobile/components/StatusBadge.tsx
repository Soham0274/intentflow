import React from "react";
import { View, Text, StyleSheet, TextStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StatusBadgeProps {
  status: "ready" | "warning" | "error" | "success" | "pending";
  text?: string;
  size?: "small" | "medium" | "large";
}

export function StatusBadge({ status, text, size = "medium" }: StatusBadgeProps) {
  const colors = useColors();
  
  const getStatusConfig = () => {
    switch (status) {
      case "ready":
      case "success":
        return {
          backgroundColor: colors.intentSuccess + "20",
          color: colors.intentSuccess,
          text: text || "Ready",
        };
      case "warning":
        return {
          backgroundColor: colors.intentWarning + "20",
          color: colors.intentWarning,
          text: text || "Warning",
        };
      case "error":
        return {
          backgroundColor: colors.intentError + "20",
          color: colors.intentError,
          text: text || "Error",
        };
      case "pending":
        return {
          backgroundColor: colors.muted,
          color: colors.mutedForeground,
          text: text || "Pending",
        };
      default:
        return {
          backgroundColor: colors.muted,
          color: colors.mutedForeground,
          text: text || status,
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = size === "small" ? styles.small : size === "large" ? styles.large : styles.medium;
  const textSizeStyles = size === "small" ? styles.smallText : size === "large" ? styles.largeText : styles.mediumText;

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.backgroundColor },
      sizeStyles
    ]}>
      <Text style={[
        styles.text,
        { color: config.color },
        textSizeStyles
      ]}>
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "500",
    textTransform: "uppercase",
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallText: {
    fontSize: 10,
  } as TextStyle,
  mediumText: {
    fontSize: 12,
  } as TextStyle,
  largeText: {
    fontSize: 14,
  } as TextStyle,
});
