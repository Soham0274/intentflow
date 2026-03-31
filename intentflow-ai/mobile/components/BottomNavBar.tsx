import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';

export const BottomNavBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <BlurView
      intensity={isDark ? 80 : 100}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.blurWrapper, { borderColor: 'rgba(255,255,255,0.05)' }]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCenter = route.name === 'capture';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            // The capture button has listeners in _layout to intercept, but we can also manually route if needed.
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                style={[styles.fab, { backgroundColor: colors.purple }]}
                onPress={() => router.push('/voice')} // Directly trigger voice entry modal layout
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={28} color="#FFF" />
              </TouchableOpacity>
            );
          }

          // Map route names to correct icons
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';
          let activeIconName: keyof typeof Ionicons.glyphMap = 'help-circle';
          if (route.name === 'index') {
            iconName = 'home-outline'; activeIconName = 'home';
          } else if (route.name === 'collections') {
            iconName = 'grid-outline'; activeIconName = 'grid';
          } else if (route.name === 'ambiguity') {
             iconName = 'bar-chart-outline'; activeIconName = 'bar-chart';
          } else if (route.name === 'calendar') {
             iconName = 'calendar-outline'; activeIconName = 'calendar';
          } else if (route.name === 'alerts') {
             iconName = 'notifications-outline'; activeIconName = 'notifications';
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.navItem}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFocused ? activeIconName : iconName}
                size={22}
                color={isFocused ? colors.textPrimary : colors.textMuted}
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
    bottom:         Platform.OS === 'ios' ? 34 : 24, // Floating offset
    left:           24, // Pull in from sides
    right:          24,
    borderRadius:   40, // 100% pill shape
    borderWidth:    1,
    paddingVertical: 12,
    overflow:       'hidden',
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
    paddingVertical: 8,
  },
  fab: {
    width:        52,
    height:       52,
    borderRadius: 26,
    alignItems:   'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius:  12,
    elevation: 8,
  },
});
