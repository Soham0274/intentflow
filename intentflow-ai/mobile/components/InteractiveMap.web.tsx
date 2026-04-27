import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import {
  getCurrentLocation,
  Coordinates,
  formatCoordinates,
} from '@/services/location';
import {
  getRecommendationsForCategories,
  detectCategories,
  LocationRecommendation,
  getCategoryInfo,
} from '@/services/locationRecommendations';
import { IntentTask } from '@/context/AppContext';
import { supabase } from '@/services/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://intentflow-9k6n.onrender.com/api';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(SCREEN_HEIGHT * 0.5, 400);

interface InteractiveMapProps {
  searchQuery?: string;
  onLocationSelect?: (location: LocationRecommendation) => void;
  selectedLocation?: LocationRecommendation | null;
  showRecommendations?: boolean;
  tasks?: IntentTask[];
}

export function InteractiveMap({
  searchQuery,
  onLocationSelect,
  selectedLocation,
  showRecommendations = true,
  tasks = [],
}: InteractiveMapProps) {
  const colors = useColors();
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [recommendations, setRecommendations] = useState<LocationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(15);
  const [error, setError] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Get auth token for image requests
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
    };
    getSession();
  }, []);

  // Initialize location
  useEffect(() => {
    const initLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);
          setError(null);
        } else {
          setError('Location access denied or unavailable');
        }
      } catch (err) {
        setError('Failed to get location');
      } finally {
        setLoading(false);
      }
    };
    initLocation();
  }, []);

  // Fetch recommendations
  useEffect(() => {
    if (!userLocation || !searchQuery) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const categories = detectCategories(searchQuery);
        const results = await getRecommendationsForCategories(
          categories,
          userLocation,
          5000,
          10
        );
        setRecommendations(results);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }
    };

    fetchRecommendations();
  }, [searchQuery, userLocation]);

  // Generate static map URL (Web Fallback)
  const getMapUrl = useCallback(() => {
    if (!userLocation) return null;

    const markers: string[] = [];
    markers.push(`marker-blue-${userLocation.latitude},${userLocation.longitude}`);
    
    recommendations.forEach((rec) => {
      markers.push(`marker-green-${rec.lat},${rec.lng}`);
    });
    
    tasks.forEach(task => {
      if (task.locationLat && task.locationLng) {
        markers.push(`marker-red-${task.locationLat},${task.locationLng}`);
      }
    });

    if (selectedLocation) {
      markers.push(`marker-gold-${selectedLocation.lat},${selectedLocation.lng}`);
    }

    const markersParam = encodeURIComponent(markers.join('|'));
    const width = Math.round(SCREEN_WIDTH - 40);
    const height = Math.round(MAP_HEIGHT);
    
    return `${API_URL}/location/staticmap?lat=${userLocation.latitude}&lon=${userLocation.longitude}&zoom=${zoom}&width=${width}&height=${height}&markers=${markersParam}`;
  }, [userLocation, recommendations, selectedLocation, tasks, zoom]);

  useEffect(() => {
    const url = getMapUrl();
    setMapUrl(url);
  }, [getMapUrl]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 1, 18));
  const handleZoomOut = () => setZoom(z => Math.max(z - 1, 10));

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading Map...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.mapContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {mapUrl ? (
          <Image
            source={{ 
              uri: mapUrl,
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
            }}
            style={styles.mapImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Feather name="map" size={48} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>{error || 'Map unavailable'}</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.card }]} onPress={handleZoomIn}>
            <Feather name="plus" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.card }]} onPress={handleZoomOut}>
            <Feather name="minus" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.badge, { backgroundColor: colors.card + 'E0' }]}>
          <Feather name="navigation" size={12} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.foreground }]}>
            {userLocation ? formatCoordinates(userLocation.latitude, userLocation.longitude) : 'Web View'}
          </Text>
        </View>
      </View>

      {showRecommendations && recommendations.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.recSection}>
          <Text style={[styles.title, { color: colors.foreground }]}>Nearby Suggestions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {recommendations.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: selectedLocation?.id === rec.id ? colors.primary : colors.border }
                ]}
                onPress={() => onLocationSelect?.(rec)}
              >
                <Text style={styles.icon}>{getCategoryInfo(rec.category).icon}</Text>
                <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{rec.name}</Text>
                <Text style={[styles.dist, { color: colors.mutedForeground }]}>{rec.formattedDistance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, height: MAP_HEIGHT },
  container: { flex: 1, height: MAP_HEIGHT, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  mapContainer: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, position: 'relative' },
  mapImage: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { position: 'absolute', top: 12, right: 12, gap: 8 },
  btn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.1, elevation: 2 },
  badge: { position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: 'DMSans_500Medium' },
  recSection: { marginTop: 16 },
  title: { fontSize: 14, fontFamily: 'Syne_600SemiBold', marginBottom: 8 },
  scroll: { gap: 10, paddingRight: 20 },
  card: { width: 140, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  icon: { fontSize: 24, marginBottom: 4 },
  name: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', textAlign: 'center' },
  dist: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  loadingText: { fontSize: 14, marginTop: 8 },
});
