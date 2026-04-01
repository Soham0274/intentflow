import React from 'react';
import {
  House,
  Compass,
  Plus,
  ChartBar,
  Bell,
  User,
  Gear,
  Check,
  Warning,
  Microphone,
  Calendar,
  Icon,
} from 'phosphor-react-native';

type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

interface PhosphorIconProps {
  name: 'house' | 'compass' | 'plus' | 'chart-bar' | 'bell' | 'user' | 'gear' | 'check' | 'warning' | 'microphone' | 'calendar';
  color: string;
  size: number;
  weight?: IconWeight;
}

const iconMap: Record<PhosphorIconProps['name'], React.ComponentType<React.ComponentProps<typeof House>>> = {
  'house': House,
  'compass': Compass,
  'plus': Plus,
  'chart-bar': ChartBar,
  'bell': Bell,
  'user': User,
  'gear': Gear,
  'check': Check,
  'warning': Warning,
  'microphone': Microphone,
  'calendar': Calendar,
};

export function PhosphorIcon({ name, color, size, weight = 'regular' }: PhosphorIconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    return <Warning color={color} size={size} weight={weight} />;
  }
  
  return <IconComponent color={color} size={size} weight={weight} />;
}
