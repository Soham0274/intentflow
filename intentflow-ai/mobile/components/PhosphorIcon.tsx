import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface PhosphorIconProps {
  name: "house" | "compass" | "plus" | "chart-bar" | "bell" | "user" | "gear" | "check" | "warning" | "microphone";
  color: string;
  size: number;
  weight?: string;
}

const iconMap: Record<PhosphorIconProps['name'], keyof typeof Ionicons.glyphMap> = {
  "house": "home-outline",
  "compass": "compass-outline",
  "plus": "add",
  "chart-bar": "bar-chart-outline",
  "bell": "notifications-outline",
  "user": "person-outline",
  "gear": "settings-outline",
  "check": "checkmark-outline",
  "warning": "warning-outline",
  "microphone": "mic"
};

export function PhosphorIcon({ name, color, size, weight }: PhosphorIconProps) {
  const ioniconName = iconMap[name] || 'help-outline';
  return <Ionicons name={ioniconName} size={size} color={color} />;
}
