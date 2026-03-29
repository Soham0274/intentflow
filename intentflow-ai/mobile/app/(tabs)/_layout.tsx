import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, GradientColors, Shadow } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import CaptureSheet from '@/components/screens/CaptureSheet';
import ToastContainer from '@/components/ui/Toast';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={tabIconStyles.wrapper}>
      <Text style={[tabIconStyles.icon, { opacity: focused ? 1 : 0.5 }]}>{icon}</Text>
      <Text
        style={[
          tabIconStyles.label,
          { color: focused ? Colors.brandBlue : Colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 2 },
  icon: { fontSize: 20 },
  label: { fontFamily: Fonts.medium, fontSize: 10 },
});

function FABButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={fabStyles.touch}
    >
      <LinearGradient
        colors={GradientColors.brand as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={fabStyles.gradient}
      >
        <Text style={fabStyles.plus}>+</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const fabStyles = StyleSheet.create({
  touch: {
    top: -16,
    ...Shadow.default,
  },
  gradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus: {
    color: Colors.white,
    fontSize: 32,
    fontFamily: Fonts.regular,
    lineHeight: 36,
    marginTop: -2,
  },
});

export default function TabLayout() {
  const { isCaptureOpen, openCapture, closeCapture } = useStore();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.brandBlue,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🏠" label="Home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📅" label="Calendar" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="capture"
          options={{
            tabBarButton: () => (
              <FABButton onPress={openCapture} />
            ),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📁" label="Projects" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="⚙️" label="Settings" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen name="two" options={{ href: null }} />
      </Tabs>

      <CaptureSheet visible={isCaptureOpen} onClose={closeCapture} />
      <ToastContainer />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.elevated,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 82 : 64,
    paddingTop: 8,
    ...Shadow.default,
  },
});
