import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance, Coordinates } from './location';
import { LocationRecommendation } from './locationRecommendations';

export const GEOFENCE_TASK_NAME = 'INTENTFLOW_GEOFENCE';

// Define the background task
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('[GeofenceTask] Error:', error);
    return;
  }

  if (data) {
    const { eventType, region } = data;
    
    if (eventType === Location.GeofencingEventType.Enter) {
      console.warn('[GeofenceTask] Entered region:', region);
      
      // Extract task info from region identifier
      const taskId = region.identifier;
      const taskTitle = region.taskTitle || 'Nearby task';
      const locationName = region.locationName || 'location';
      
      // Log geofence entry (notification would be scheduled here with expo-notifications)
      console.warn('[Geofence] 📍 Intent Nearby:', taskTitle, 'at', locationName);
      // TODO: Add expo-notifications and schedule local notification here
    }
  }
});

// Request location permissions (three-tier)
export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  try {
    // 1. Foreground Location
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn('[Geofencing] Foreground location denied');
      return { foreground: false, background: false };
    }

    // 2. Background Location (required for geofencing)
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('[Geofencing] Background location denied - geofencing disabled');
      return { foreground: true, background: false };
    }

    console.warn('[Geofencing] All location permissions granted');
    return { foreground: true, background: true };
  } catch (err) {
    console.error('[Geofencing] Permission error:', err);
    return { foreground: false, background: false };
  }
}

// Check current permission status
export async function checkLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  try {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    
    return {
      foreground: foreground.status === 'granted',
      background: background.status === 'granted',
    };
  } catch (err) {
    console.error('[Geofencing] Check permission error:', err);
    return { foreground: false, background: false };
  }
}

// Sync geofences with active tasks
export interface GeofencedTask {
  id: string;
  title: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  geofence_radius_m?: number;
  geofence_enabled?: boolean;
  status?: string;
}

export async function syncGeofences(tasks: GeofencedTask[]): Promise<boolean> {
  try {
    // Check permissions first
    const perms = await checkLocationPermissions();
    if (!perms.background) {
      console.warn('[Geofencing] Cannot sync - background permission not granted');
      return false;
    }

    // Filter to only active geofenced tasks
    const geofencedTasks = tasks.filter(
      (t) =>
        t.geofence_enabled &&
        t.location_lat &&
        t.location_lng &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    );

    // Convert to Location regions (cast to any for custom properties)
    const regions: any[] = geofencedTasks.map((task) => ({
      identifier: task.id,
      latitude: task.location_lat!,
      longitude: task.location_lng!,
      radius: task.geofence_radius_m || 200,
      notifyOnEnter: true,
      notifyOnExit: false,
      // Store additional data in the region object
      taskTitle: task.title,
      locationName: task.location_name,
    }));

    // Start geofencing
    if (regions.length > 0) {
      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
      console.warn(
        '[Geofencing] Synced',
        regions.length,
        'geofences:'
      );
      regions.forEach((r) =>
        console.warn(`  - ${r.taskTitle} @ ${r.locationName}`)
      );
    } else {
      // Stop geofencing if no active regions
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      console.warn('[Geofencing] No active geofences - cleared all regions');
    }

    return true;
  } catch (err) {
    console.error('[Geofencing] Sync error:', err);
    return false;
  }
}

// Stop all geofencing
export async function stopGeofencing(): Promise<void> {
  try {
    // Use stopGeofencingAsync to clear all regions
    await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    console.warn('[Geofencing] Stopped all monitoring');
  } catch (err) {
    console.error('[Geofencing] Stop error:', err);
  }
}

// Get currently registered geofences (for debugging)
export async function getRegisteredGeofences(): Promise<any[]> {
  try {
    return await (Location as any).getRegisteredRegionsAsync?.() || [];
  } catch (err) {
    console.error('[Geofencing] Get regions error:', err);
    return [];
  }
}

const STORED_LOCATIONS_KEY = '@intentflow_stored_locations';

export interface StoredGeofencedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
  address?: string;
  createdAt: string;
}

/**
 * Save a location to the geofencing system
 */
export async function saveGeofencedLocation(
  location: LocationRecommendation
): Promise<boolean> {
  try {
    const existing = await getStoredLocations();
    
    // Check if location already exists
    const exists = existing.some(
      (l) => l.lat === location.lat && l.lng === location.lng
    );
    
    if (exists) {
      console.warn('[Geofencing] Location already exists:', location.name);
      return false;
    }
    
    const newLocation: StoredGeofencedLocation = {
      id: location.id,
      name: location.name,
      lat: location.lat,
      lng: location.lng,
      category: location.category,
      address: location.address,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...existing, newLocation];
    await AsyncStorage.setItem(STORED_LOCATIONS_KEY, JSON.stringify(updated));
    
    console.warn('[Geofencing] Saved location:', location.name);
    return true;
  } catch (err) {
    console.error('[Geofencing] Save location error:', err);
    return false;
  }
}

/**
 * Get all stored geofenced locations
 */
export async function getStoredLocations(): Promise<StoredGeofencedLocation[]> {
  try {
    const data = await AsyncStorage.getItem(STORED_LOCATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('[Geofencing] Get stored locations error:', err);
    return [];
  }
}

/**
 * Get locations near a specific coordinate
 */
export async function getNearbyLocations(
  center: Coordinates,
  radius: number = 5000 // meters
): Promise<StoredGeofencedLocation[]> {
  try {
    const locations = await getStoredLocations();
    
    return locations
      .map((loc) => ({
        ...loc,
        distance: calculateDistance(center.latitude, center.longitude, loc.lat, loc.lng),
      }))
      .filter((loc) => (loc as any).distance <= radius)
      .sort((a, b) => (a as any).distance - (b as any).distance);
  } catch (err) {
    console.error('[Geofencing] Get nearby locations error:', err);
    return [];
  }
}

/**
 * Remove a stored location
 */
export async function removeStoredLocation(locationId: string): Promise<boolean> {
  try {
    const locations = await getStoredLocations();
    const updated = locations.filter((l) => l.id !== locationId);
    await AsyncStorage.setItem(STORED_LOCATIONS_KEY, JSON.stringify(updated));
    console.warn('[Geofencing] Removed location:', locationId);
    return true;
  } catch (err) {
    console.error('[Geofencing] Remove location error:', err);
    return false;
  }
}

/**
 * Clear all stored locations
 */
export async function clearStoredLocations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORED_LOCATIONS_KEY);
    console.warn('[Geofencing] Cleared all stored locations');
  } catch (err) {
    console.error('[Geofencing] Clear locations error:', err);
  }
}
