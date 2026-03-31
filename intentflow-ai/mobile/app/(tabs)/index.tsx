import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, TextInput, Dimensions, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { ThemedToggle } from '../../components/ThemedToggle';
import { useRouter } from 'expo-router';
import { fetchTasks } from '../../services/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W * 0.82, 340);
const CARD_H = Math.min(SCREEN_H * 0.45, 420);

interface LifeAreaData {
  id:         string;
  icon:       keyof typeof Ionicons.glyphMap;
  title:      string;
  subtitle:   string;
  taskCount:  number;
  gradient:   [string, string];
}

const INITIAL_LIFE_AREAS: LifeAreaData[] = [
  { id: 'home',    icon: 'home',         title: 'Home',    subtitle: 'Chores & upkeep',     taskCount: 0, gradient: ['#4388FF', '#4E40D8'] },
  { id: 'work',    icon: 'briefcase',    title: 'Work',    subtitle: 'Projects & tasks',    taskCount: 0, gradient: ['#7C3AED', '#9D6EFB'] },
  { id: 'health',  icon: 'fitness',      title: 'Health',  subtitle: 'Fitness & wellness',  taskCount: 0, gradient: ['#0F9688', '#14B8A6'] },
  { id: 'finance', icon: 'cash-outline', title: 'Finance', subtitle: 'Bills & budgeting',   taskCount: 0, gradient: ['#D97706', '#F59E0B'] },
];

export default function IndexScreen() {
  const { colors, typography } = useTheme();
  const [nudgesOn, setNudgesOn] = useState(true);
  const [searchQ, setSearchQ]  = useState('');
  const [lifeAreas, setLifeAreas] = useState<LifeAreaData[]>(INITIAL_LIFE_AREAS);
  const router = useRouter();

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await fetchTasks();
        // Assuming data is an array of tasks with a 'category' field matching the IDs above
        const updatedAreas = INITIAL_LIFE_AREAS.map(area => ({
          ...area,
          taskCount: data.filter((t: any) => (t.category || t.category_id || '').toLowerCase() === area.id).length
        }));
        setLifeAreas(updatedAreas);
      } catch (e) {
        console.warn('Failed to load tasks:', e);
      }
    }
    loadTasks();
  }, []);

  const renderCard = ({ item }: { item: LifeAreaData }) => (
    <TouchableOpacity activeOpacity={0.88} style={[coStyles.card, { width: CARD_W, height: CARD_H }]}>
      <LinearGradient colors={item.gradient} style={coStyles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Icon + Task Badge Row */}
        <View style={coStyles.cardTopRow}>
          <View style={coStyles.cardIconBox}>
            <Ionicons name={item.icon} size={22} color="#FFF" />
          </View>
          <View style={[coStyles.taskBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[typography.bodyBold, { color: '#FFF', fontSize: 13, letterSpacing: 0.5 }]}>
              {item.taskCount} TASKS
            </Text>
          </View>
        </View>

        {/* Title at bottom */}
        <View style={coStyles.cardBottom}>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 44, color: '#FFF', marginBottom: 4 }}>
            {item.title}
          </Text>
          <Text style={[typography.bodyLG, { color: 'rgba(255,255,255,0.85)' }]}>
            {item.subtitle}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={coStyles.header}>
        <Text style={[typography.headingLG, { color: colors.textPrimary }]}>Collections</Text>
        <TouchableOpacity style={[coStyles.bellBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={() => router.push('/alerts')}>
          <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          <View style={[coStyles.bellDot, { backgroundColor: colors.purple }]} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[coStyles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder="Search tasks, categories..."
          placeholderTextColor={colors.textMuted}
          style={[typography.bodyMD, { flex: 1, color: colors.textPrimary }]}
        />
        <TouchableOpacity style={[coStyles.filterBtn, { backgroundColor: colors.bgCardAlt }]}>
          <MaterialCommunityIcons name="tune-variant" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Life Areas Header */}
        <View style={coStyles.sectionHeader}>
          <Text style={[typography.headingSM, { color: colors.textPrimary }]}>Life Areas</Text>
          <TouchableOpacity>
            <Text style={[typography.bodyBold, { color: colors.purple }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Card Scroll */}
        <FlatList
          data={lifeAreas}
          horizontal
          keyExtractor={item => item.id}
          renderItem={renderCard}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
          snapToInterval={CARD_W + 14}
          decelerationRate="fast"
          style={{ marginBottom: 24 }}
        />
      </ScrollView>

      {/* Smart Nudges Banner (floating above nav) */}
      <View style={[coStyles.nudgesBanner, { backgroundColor: colors.bgCardAlt, borderColor: colors.border }]}>
        <View style={[coStyles.nudgesIconBox, { backgroundColor: colors.purpleDim }]}>
          <MaterialCommunityIcons name="auto-fix" size={16} color={colors.purple} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>Smart Nudges</Text>
          <Text style={[typography.bodySM, { color: colors.textMuted }]}>AI determines best time to...</Text>
        </View>
        <ThemedToggle value={nudgesOn} onChange={setNudgesOn} />
      </View>
    </SafeAreaView>
  );
}

const coStyles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  bellBtn:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bellDot:      { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  searchBar:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20 },
  filterBtn:    { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  card:         { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardGradient: { flex: 1, padding: 24, justifyContent: 'space-between' },
  cardTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIconBox:  { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  taskBadge:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cardBottom:   { alignItems: 'center', gap: 4, paddingBottom: 16 },
  nudgesBanner: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 14 },
  nudgesIconBox:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});