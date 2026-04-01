import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius, Shadow } from '@/constants/theme';

interface LifeArea {
  id: string;
  name: string;
  icon: string;
  tasks: number;
  gradient: [string, string];
}

const lifeAreas: LifeArea[] = [
  { id: 'work', name: 'Work', icon: '💼', tasks: 12, gradient: ['#3B82F6', '#1D4ED8'] },
  { id: 'health', name: 'Health', icon: '🏃', tasks: 8, gradient: ['#10B981', '#059669'] },
  { id: 'finance', name: 'Finance', icon: '💰', tasks: 5, gradient: ['#F59E0B', '#D97706'] },
  { id: 'learning', name: 'Learning', icon: '📚', tasks: 3, gradient: ['#8B5CF6', '#6D28D9'] },
  { id: 'social', name: 'Social', icon: '👥', tasks: 7, gradient: ['#EC4899', '#BE185D'] },
  { id: 'personal', name: 'Personal', icon: '✨', tasks: 4, gradient: ['#06B6D4', '#0891B2'] },
];

interface LifeAreaCardProps {
  area: LifeArea;
}

function LifeAreaCard({ area }: LifeAreaCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={cardStyles.container}>
      <LinearGradient
        colors={area.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles.gradient}
      >
        <View style={cardStyles.badge}>
          <Text style={cardStyles.badgeText}>{area.tasks}</Text>
        </View>
        <Text style={cardStyles.icon}>{area.icon}</Text>
        <Text style={cardStyles.name}>{area.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    width: 178,
    marginRight: Spacing.md,
  },
  gradient: {
    height: 220,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
  },
  badgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.textPrimary,
  },
  icon: {
    fontSize: 36,
    marginTop: Spacing.md,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
});

interface BottomNavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
}

function BottomNavItem({ icon, label, active, onPress }: BottomNavItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={navStyles.item}>
      <Text style={[navStyles.icon, active && navStyles.iconActive]}>{icon}</Text>
      <Text style={[navStyles.label, active && navStyles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const navStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: Colors.teal,
  },
});

function FAB() {
  return (
    <TouchableOpacity activeOpacity={0.9} style={fabStyles.container}>
      <LinearGradient
        colors={['#60A5FA', '#3B82F6']}
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
  container: {
    position: 'absolute',
    top: -28,
    ...Shadow.glow,
  },
  gradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontFamily: Fonts.regular,
    fontSize: 32,
    color: Colors.textPrimary,
    marginTop: -2,
  },
});

export function CollectionsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.screenTitle}>Collections</Text>
        <TouchableOpacity>
          <Text style={styles.settingsBtn}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.smartNudge}>
          <Text style={styles.nudgeIcon}>💡</Text>
          <Text style={styles.nudgeText}>Smart Nudge: 3 tasks are overdue</Text>
          <Text style={styles.nudgeChevron}>›</Text>
        </View>

        <Text style={styles.sectionTitle}>LIFE AREAS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.areasScroll}
        >
          {lifeAreas.map((area) => (
            <LifeAreaCard key={area.id} area={area} />
          ))}
        </ScrollView>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomNavItem icon="🏠" label="Home" active={activeTab === 0} onPress={() => setActiveTab(0)} />
        <BottomNavItem icon="📅" label="Calendar" active={activeTab === 1} onPress={() => setActiveTab(1)} />
        <View style={styles.fabSlot} />
        <BottomNavItem icon="📁" label="Projects" active={activeTab === 3} onPress={() => setActiveTab(3)} />
        <BottomNavItem icon="⚙️" label="Settings" active={activeTab === 4} onPress={() => setActiveTab(4)} />
        <FAB />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bgSurface,
  },
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  settingsBtn: {
    fontSize: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  smartNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  nudgeIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  nudgeText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  nudgeChevron: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  areasScroll: {
    paddingRight: Spacing.md,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    position: 'relative',
  },
  fabSlot: {
    flex: 1,
  },
});