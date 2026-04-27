import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: number;
}

let locationWatcher: Location.LocationSubscription | null = null;

/**
 * Get the user's current GPS location
 * Returns null if permissions are denied or location is unavailable
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    // Check permissions first
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus !== 'granted') {
        console.warn('[Location] Permission denied');
        return null;
      }
    }

    // Get current position with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || undefined,
      altitude: location.coords.altitude || undefined,
      timestamp: location.timestamp,
    };
  } catch (err) {
    console.error('[Location] Error getting current location:', err);
    return null;
  }
}

/**
 * Start watching for location updates
 * @param callback - Function called with new location data
 * @param interval - Update interval in milliseconds (default: 5000)
 */
export async function startWatchingLocation(
  callback: (location: Coordinates) => void,
  interval: number = 5000
): Promise<boolean> {
  try {
    // Stop any existing watcher
    if (locationWatcher) {
      stopWatchingLocation();
    }

    // Check permissions
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus !== 'granted') {
        console.warn('[Location] Cannot start watching - permission denied');
        return false;
      }
    }

    // Start watching position
    locationWatcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: interval,
        distanceInterval: 10, // Minimum 10 meters of movement before update
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          altitude: location.coords.altitude || undefined,
          timestamp: location.timestamp,
        });
      }
    );

    console.warn('[Location] Started watching position');
    return true;
  } catch (err) {
    console.error('[Location] Error starting location watch:', err);
    return false;
  }
}

/**
 * Stop watching for location updates
 */
export function stopWatchingLocation(): void {
  if (locationWatcher) {
    try {
      // The subscription remove() method can throw in some Expo versions
      locationWatcher.remove();
    } catch (err) {
      // Silently ignore - the subscription may already be cleaned up
      console.warn('[Location] Error removing watcher:', err);
    }
    locationWatcher = null;
    console.warn('[Location] Stopped watching position');
  }
}

/**
 * Check if location watching is active
 */
export function isWatchingLocation(): boolean {
  return locationWatcher !== null;
}

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
