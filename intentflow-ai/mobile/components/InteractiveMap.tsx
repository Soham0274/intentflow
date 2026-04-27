import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import {
  getCurrentLocation,
  startWatchingLocation,
  stopWatchingLocation,
  Coordinates,
} from '@/services/location';
import {
  getRecommendationsForCategories,
  detectCategories,
  LocationRecommendation,
  getCategoryInfo,
} from '@/services/locationRecommendations';
import { IntentTask } from '@/context/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAP_HEIGHT = Math.min(SCREEN_HEIGHT * 0.5, 400);

interface InteractiveMapProps {
  searchQuery?: string;
  onLocationSelect?: (location: LocationRecommendation) => void;
  selectedLocation?: LocationRecommendation | null;
  showRecommendations?: boolean;
  tasks?: IntentTask[]; // Tasks with location data to display as markers
}

export function InteractiveMap({
  searchQuery,
  onLocationSelect,
  selectedLocation,
  showRecommendations = true,
  tasks = [],
}: InteractiveMapProps) {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [recommendations, setRecommendations] = useState<LocationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  // Initialize location
  useEffect(() => {
    let isMounted = true;
    let locationSubscription: any = null;

    const initLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (isMounted) {
          if (location) {
            setUserLocation(location);
            setRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
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

    // Start watching location for real-time updates
    const startLocationWatch = async () => {
      try {
        locationSubscription = await startWatchingLocation((location) => {
          if (isMounted) {
            setUserLocation(location);
          }
        });
      } catch (err) {
        console.log('[InteractiveMap] Location watch not available:', err);
      }
    };

    initLocation();
    startLocationWatch();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
      stopWatchingLocation();
    };
  }, []);

  // Fetch recommendations when search query or location changes
  useEffect(() => {
    if (!userLocation || !searchQuery) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const categories = detectCategories(searchQuery);
        const results = await getRecommendationsForCategories(
          categories,
          userLocation,
          5
        );
        setRecommendations(results);
      } catch (err) {
        console.error('[InteractiveMap] Failed to fetch recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [searchQuery, userLocation]);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  }, [userLocation]);

  // Zoom in
  const zoomIn = useCallback(() => {
    if (region && mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setRegion(newRegion);
    }
  }, [region]);

  // Zoom out
  const zoomOut = useCallback(() => {
    if (region && mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setRegion(newRegion);
    }
  }, [region]);

  // Toggle map type
  const toggleMapType = useCallback(() => {
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
  }, []);

  // Handle region change
  const onRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  // Get category color for markers
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      grocery: '#22c55e',
      pharmacy: '#f97316',
      cafe: '#a855f7',
      restaurant: '#ef4444',
      bank: '#3b82f6',
      gas: '#eab308',
      fastfood: '#f97316',
      stationery: '#8b5cf6',
      sweets: '#ec4899',
    };
    return colors[category] || colors.primary;
  };

  // Filter tasks with valid location data
  const tasksWithLocation = tasks.filter(
    task => task.locationLat && task.locationLng
  );

  if (loading && !userLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Getting your location...
        </Text>
      </View>
    );
  }

  if (error || !userLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Feather name="map-pin" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          {error || 'Location unavailable'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLoading(true);
            setError(null);
            getCurrentLocation().then(location => {
              if (location) {
                setUserLocation(location);
                setRegion({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                });
              }
              setLoading(false);
            }).catch(() => {
              setError('Failed to get location');
              setLoading(false);
            });
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.card }]}
          onPress={zoomIn}
        >
          <Feather name="plus" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.card }]}
          onPress={zoomOut}
        >
          <Feather name="minus" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.card }]}
          onPress={centerOnUser}
        >
          <Feather name="crosshair" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.card }]}
          onPress={toggleMapType}
        >
          <Feather name="layers" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Interactive Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region || {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onRegionChangeComplete={onRegionChangeComplete}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        rotateEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        zoomEnabled={true}
      >
        {/* User Location Circle */}
        <Circle
          center={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          radius={100}
          strokeColor={colors.primary}
          fillColor={`${colors.primary}20`}
          strokeWidth={2}
        />

        {/* Task Markers - Intents with location data */}
        {tasksWithLocation.map((task) => (
          <Marker
            key={`task-${task.id}`}
            coordinate={{
              latitude: task.locationLat!,
              longitude: task.locationLng!,
            }}
            title={task.action}
            description={task.locationAddress || task.locationName}
            pinColor={colors.primary}
          >
            <View style={[styles.taskMarker, { backgroundColor: colors.primary }]}>
              <Feather name="check-square" size={16} color="#fff" />
            </View>
          </Marker>
        ))}

        {/* Recommendation Markers */}
        {recommendations.map((rec, index) => (
          <Marker
            key={`rec-${rec.id || index}`}
            coordinate={{
              latitude: rec.lat,
              longitude: rec.lng,
            }}
            title={rec.name}
            description={`${rec.category} • ${rec.formattedDistance}`}
            onPress={() => onLocationSelect?.(rec)}
          >
            <View style={[
              styles.recommendationMarker,
              { backgroundColor: getCategoryColor(rec.category) },
              selectedLocation?.id === rec.id && styles.selectedMarker
            ]}>
              <Text style={styles.markerIcon}>
                {getCategoryInfo(rec.category).icon}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Recommendations List */}
      {showRecommendations && recommendations.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.recommendationsContainer}>
          <Text style={[styles.recommendationsTitle, { color: colors.foreground }]}>
            Nearby Places
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendationsScroll}
          >
            {recommendations.map((rec, index) => (
              <TouchableOpacity
                key={`card-${rec.id || index}`}
                style={[
                  styles.recommendationCard,
                  { backgroundColor: colors.card },
                  selectedLocation?.id === rec.id && { borderColor: colors.primary }
                ]}
                onPress={() => {
                  onLocationSelect?.(rec);
                  // Center map on selected location
                  mapRef.current?.animateToRegion({
                    latitude: rec.lat,
                    longitude: rec.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 500);
                }}
              >
                <Text style={styles.recommendationIcon}>
                  {getCategoryInfo(rec.category).icon}
                </Text>
                <Text
                  style={[styles.recommendationName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {rec.name}
                </Text>
                <Text style={[styles.recommendationDistance, { color: colors.mutedForeground }]}>
                  {rec.formattedDistance}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Tasks with Location Indicator */}
      {tasksWithLocation.length > 0 && (
        <View style={[styles.tasksIndicator, { backgroundColor: colors.card }]}>
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={[styles.tasksIndicatorText, { color: colors.foreground }]}>
            {tasksWithLocation.length} intent{tasksWithLocation.length !== 1 ? 's' : ''} with location
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    height: MAP_HEIGHT,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  map: {
    flex: 1,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  controlsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 8,
    zIndex: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recommendationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedMarker: {
    borderColor: '#7C6EFF',
    borderWidth: 4,
  },
  markerIcon: {
    fontSize: 20,
  },
  recommendationsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontFamily: 'Syne_600SemiBold',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  recommendationsScroll: {
    gap: 8,
    paddingRight: 24,
  },
  recommendationCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  recommendationIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  recommendationName: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    textAlign: 'center',
    marginBottom: 2,
  },
  recommendationDistance: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },
  tasksIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tasksIndicatorText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
});
