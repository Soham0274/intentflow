import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fetchCalendarEvents } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CalendarScreen() {
  const { colors, typography, isDark } = useTheme();
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      const data = await fetchCalendarEvents();
      // data is the events array from successful responseHelper
      setEvents(data?.data || data || []);
    } catch (e) {
      console.warn('Failed to load events', e);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const formatTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return 'All Day';
    return new Date(dateTimeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[typography.headingXL, { color: colors.textPrimary }]}>Schedule</Text>
          <Text style={[typography.bodyMD, { color: colors.textMuted, marginTop: 4 }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={[styles.syncBtn, { backgroundColor: colors.bgCard }]}>
          <Ionicons name="sync-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
        showsVerticalScrollIndicator={false}
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.bgCard }]}>
              <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={[typography.headingMD, { color: colors.textPrimary, marginTop: 24 }]}>Quiet day ahead</Text>
            <Text style={[typography.bodyMD, { color: colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }]}>
              Your Google Calendar events will appear here once connected.
            </Text>
          </View>
        ) : (
          events.map((event, idx) => (
            <View key={event.id || idx} style={styles.eventRow}>
              <View style={styles.timeColumn}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary, fontSize: 13 }]}>
                  {formatTime(event.start?.dateTime || event.start?.date)}
                </Text>
                <View style={[styles.timeLine, { backgroundColor: colors.border }]} />
              </View>
              
              <LinearGradient
                colors={isDark ? ['#1F2937', '#111827'] : ['#F9FAFB', '#F3F4F6']}
                style={[styles.eventCard, { borderColor: event.colorId ? colors.purple : colors.border }]}
              >
                <View style={[styles.statusLine, { backgroundColor: colors.purple }]} />
                <View style={styles.eventInfo}>
                  <Text style={[typography.bodyBold, { color: colors.textPrimary }]} numberOfLines={1}>
                    {event.summary || 'Untitled Event'}
                  </Text>
                  {event.location && (
                    <View style={styles.locRow}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={[typography.bodySM, { color: colors.textMuted, marginLeft: 4 }]} numberOfLines={1}>
                        {event.location}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  syncBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  eventRow: { flexDirection: 'row', marginBottom: 24, minHeight: 80 },
  timeColumn: { width: 80, alignItems: 'center' },
  timeLine: { width: 1, flex: 1, marginVertical: 8, opacity: 0.3 },
  eventCard: { flex: 1, borderRadius: 20, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  statusLine: { width: 6, height: '100%' },
  eventInfo: { padding: 16, flex: 1, justifyContent: 'center' },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
});
