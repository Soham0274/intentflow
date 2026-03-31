import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useRouter, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { name: 'Home',        icon: 'home-outline',     activeIcon: 'home',        route: '/'   },
  { name: 'Collections', icon: 'grid-outline',     activeIcon: 'grid',        route: '/'   }, // mapped to root
  { name: 'Add',         icon: 'add',              activeIcon: 'add',         route: '/voice' },
  { name: 'Calendar',    icon: 'calendar-outline', activeIcon: 'calendar',    route: '/review' },
  { name: 'Profile',     icon: 'person-outline',   activeIcon: 'person',      route: '/profile' },
] as const;

export const BottomNavBar: React.FC = () => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <BlurView
      intensity={isDark ? 60 : 80}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.blurWrapper, { borderTopColor: colors.border }]}
    >
      <View style={styles.row}>
        {NAV_ITEMS.map((item, idx) => {
          const isCenter = idx === 2;
          const isActive = pathname === item.route;

          if (isCenter) {
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.fab, { backgroundColor: colors.purple }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={28} color="#FFF" />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={22}
                color={isActive ? colors.navActive : colors.navInactive}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurWrapper: {
    position:       'absolute',
    bottom:         0,
    left:           0,
    right:          0,
    borderTopWidth: 1,
    paddingBottom:  Platform.OS === 'ios' ? 20 : 8,
    paddingTop:     10,
  },
  row: {
    flexDirection:  'row',
    justifyContent: 'space-around',
    alignItems:     'center',
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  fab: {
    width:        56,
    height:       56,
    borderRadius: 28,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom:   12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius:  12,
    elevation: 8,
  },
});
