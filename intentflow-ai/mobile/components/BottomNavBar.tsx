import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const BottomNavBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.container, { backgroundColor: colors.navBg || '#1A1D2E', borderColor: 'rgba(255,255,255,0.08)' }]}>
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
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            if (isCenter) {
              return (
                <TouchableOpacity
                  key={route.key}
                  style={[
                    styles.fab,
                    { backgroundColor: colors.purple || '#6C63FF' },
                  ]}
                  onPress={() => router.push('/voice')}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#8B83FF', '#6C63FF']}
                    style={styles.fabGradient}
                  >
                    <Ionicons name="add" size={32} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              );
            }

            // Map route names to correct icons
            let iconName: any = 'help-circle-outline';
            if (route.name === 'index') iconName = 'home-variant';
            else if (route.name === 'collections') iconName = 'view-grid';
            else if (route.name === 'calendar') iconName = 'calendar-month';
            else if (route.name === 'alerts') iconName = 'bell';

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.navItem}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isFocused ? iconName : `${iconName}-outline` as any}
                  size={24}
                  color={isFocused ? colors.navActive || '#FFFFFF' : colors.navInactive || '#5A6280'}
                />
                {isFocused && (
                  <View style={[styles.activeDot, { backgroundColor: '#FFFFFF' }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    pointerEvents: 'box-none',
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 10,
    boxShadow: '0px 10px 20px rgba(0,0,0,0.3)',
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -40,
    boxShadow: '0px 6px 15px rgba(108,99,255,0.5)',
    elevation: 12,
    overflow: 'hidden',
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
