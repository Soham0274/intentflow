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
  startWatchingLocation,
  stopWatchingLocation,
  Coordinates,
  formatCoordinates,
} from '@/services/location';
import {
  getRecommendationsForCategories,
  detectCategories,
  LocationRecommendation,
  getCategoryInfo,
} from '@/services/locationRecommendations';

import { supabase } from '@/services/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://intentflow-9k6n.onrender.com/api';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_SIZE = Math.min(SCREEN_WIDTH - 40, 400);

interface MiniMapProps {
  searchQuery?: string; // For keyword-triggered recommendations
  onLocationSelect?: (location: LocationRecommendation) => void;
  selectedLocation?: LocationRecommendation | null;
  showRecommendations?: boolean;
}

export function MiniMap({
  searchQuery,
  onLocationSelect,
  selectedLocation,
  showRecommendations = true,
}: MiniMapProps) {
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
    let isMounted = true;

    const initLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (isMounted) {
          if (location) {
            setUserLocation(location);
            setError(null);
          } else {
            setError('Location access denied or unavailable');
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to get location');
          setLoading(false);
        }
      }
    };

    initLocation();

    try {
      startWatchingLocation((newLocation) => {
        if (isMounted) {
          setUserLocation(newLocation);
        }
      });
    } catch (err) {
      console.warn('[MiniMap] Location watching failed:', err);
    }

    return () => {
      isMounted = false;
      try {
        stopWatchingLocation();
      } catch (err) {}
    };
  }, []);

  // Fetch recommendations when search query changes
  useEffect(() => {
    if (!userLocation || !searchQuery || !showRecommendations) {
      setRecommendations([]);
      return;
    }

    const categories = detectCategories(searchQuery);
    if (categories.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const results = await getRecommendationsForCategories(
          categories,
          userLocation,
          5000,
          15
        );
        setRecommendations(results);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }
    };

    fetchRecommendations();
  }, [searchQuery, userLocation, showRecommendations]);

  // Generate backend proxy static map URL
  const getMapUrl = useCallback(() => {
    if (!userLocation) return null;

    const markers: string[] = [];
    markers.push(`marker-blue-${userLocation.latitude},${userLocation.longitude}`);
    
    recommendations.forEach((rec) => {
      markers.push(`marker-green-${rec.lat},${rec.lng}`);
    });
    
    if (selectedLocation) {
      markers.push(`marker-red-${selectedLocation.lat},${selectedLocation.lng}`);
    }

    const markersParam = encodeURIComponent(markers.join('|'));
    const mapWidth = MAP_SIZE;
    const mapHeight = Math.round(MAP_SIZE * 0.6);
    
    return `${API_URL}/location/staticmap?lat=${userLocation.latitude}&lon=${userLocation.longitude}&zoom=${zoom}&width=${mapWidth}&height=${mapHeight}&markers=${markersParam}`;
  }, [userLocation, recommendations, selectedLocation, zoom]);

  // Generate map URL when dependencies change
  useEffect(() => {
    const url = getMapUrl();
    setMapUrl(url);
  }, [getMapUrl]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 1, 18));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 1, 10));
  const handleRecenter = async () => {
    const location = await getCurrentLocation();
    if (location) setUserLocation(location);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Getting your location...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Feather name="map-pin" size={32} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={handleRecenter}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categories = searchQuery ? detectCategories(searchQuery) : [];
  const primaryCategory = categories.length > 0 ? categories[0] : null;

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
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.border }]}>
            <Feather name="map" size={32} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
              Map unavailable
            </Text>
          </View>
        )}

        <View style={styles.mapControls}>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.card }]} onPress={handleZoomIn}>
            <Feather name="plus" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.card }]} onPress={handleZoomOut}>
            <Feather name="minus" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.card }]} onPress={handleRecenter}>
            <Feather name="crosshair" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.locationBadge, { backgroundColor: colors.card + 'E0' }]}>
          <Feather name="navigation" size={12} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.foreground }]}>
            {userLocation ? formatCoordinates(userLocation.latitude, userLocation.longitude) : 'Locating...'}
          </Text>
        </View>
      </View>

      {showRecommendations && recommendations.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.recommendationsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {primaryCategory 
              ? `${getCategoryInfo(primaryCategory).icon} Nearby ${getCategoryInfo(primaryCategory).label}` 
              : 'Nearby Places'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationsList}>
            {recommendations.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={[
                  styles.recommendationCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedLocation?.id === rec.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => onLocationSelect?.(rec)}
              >
                <View style={[styles.recIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={styles.recEmoji}>{getCategoryInfo(rec.category).icon}</Text>
                </View>
                <View style={styles.recInfo}>
                  <Text style={[styles.recName, { color: colors.foreground }]} numberOfLines={1}>{rec.name}</Text>
                  <Text style={[styles.recDistance, { color: colors.mutedForeground }]}>{rec.formattedDistance}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {showRecommendations && primaryCategory && recommendations.length === 0 && (
        <Text style={[styles.noResults, { color: colors.mutedForeground }]}>
          No {getCategoryInfo(primaryCategory).label.toLowerCase()} locations found nearby
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  container: { height: 200, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1 },
  mapContainer: { width: '100%', height: Math.round(MAP_SIZE * 0.6), borderRadius: 16, overflow: 'hidden', borderWidth: 1, position: 'relative' },
  mapImage: { width: '100%', height: '100%' },
  mapPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  mapControls: { position: 'absolute', right: 12, top: 12, gap: 8 },
  controlBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  locationBadge: { position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  locationText: { fontSize: 11, fontFamily: 'DMSans_500Medium' },
  loadingText: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  errorText: { fontSize: 14, fontFamily: 'DMSans_500Medium', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  retryBtnText: { color: '#fff', fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  recommendationsSection: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontFamily: 'Syne_600SemiBold', marginBottom: 12 },
  recommendationsList: { gap: 10, paddingRight: 20 },
  recommendationCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 10, minWidth: 200 },
  recIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recEmoji: { fontSize: 20 },
  recInfo: { flex: 1 },
  recName: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  recDistance: { fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  noResults: { fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginTop: 16 },
});
