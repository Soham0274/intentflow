import { Tabs, router } from 'expo-router';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import { PhosphorIcon } from '@/components/PhosphorIcon'; // Placeholder until I implement actual Phosphor
import { BottomNavBar } from '@/components/BottomNavBar';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <Tabs
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Voice',
          tabBarIcon: ({ color }) => <PhosphorIcon name="house" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <PhosphorIcon name="compass" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="capture" // This is a dummy route that is intercepted by the FAB
        options={{
          title: 'Voice Match',
          tabBarIcon: () => (
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/')}>
              <View style={[styles.fabContainer]}>
                <LinearGradient
                  colors={[theme.accent, theme.accent2]}
                  style={styles.fabGradient}
                >
                  <PhosphorIcon name="plus" color="#FFFFFF" size={24} />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // Prevent default navigation
            router.push('/'); // Route to Index (Voice)
          },
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <PhosphorIcon name="calendar" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <PhosphorIcon name="bell" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -24, // Pull it up above the tab bar
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(124, 111, 255, 0.4)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
