import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';

import { useColors } from "@/hooks/useColors";
import { GradientBackground } from "@/components/GradientBackground";
import { useApp } from "@/context/AppContext";
import { GeofencedTask, getRegisteredGeofences } from "@/services/geofencing";
import { checkLocationPermissions, requestLocationPermissions } from "@/services/geofencing";
import { InteractiveMap } from "@/components/InteractiveMap";
import { LocationRecommendation } from "@/services/locationRecommendations";

export default function GeolocationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    tasks,
    contextualIntelligence,
    locationPermissions,
    setContextualIntelligence,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [registeredGeofences, setRegisteredGeofences] = useState<any[]>([]);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationRecommendation | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Available categories for nearby search
  const categories = [
    { key: 'grocery', label: 'Grocery', icon: '🛒' },
    { key: 'pharmacy', label: 'Pharmacy', icon: '💊' },
    { key: 'cafe', label: 'Cafe', icon: '☕' },
    { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
    { key: 'bank', label: 'Bank', icon: '🏦' },
    { key: 'gas', label: 'Gas Station', icon: '⛽' },
    { key: 'fastfood', label: 'Fast Food', icon: '🍔' },
    { key: 'stationery', label: 'Stationery', icon: '✂️' },
    { key: 'sweets', label: 'Sweets', icon: '🍩' },
  ];

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Get geofenced tasks
  const geofencedTasks = tasks.filter(
    (t: any) =>
      t.location_lat &&
      t.location_lng &&
      t.status !== "completed"
  ) as any[];

  // Check current permissions
  useEffect(() => {
    const checkPerms = async () => {
      const perms = await checkLocationPermissions();
      if (!perms.background && contextualIntelligence) {
        setShowPermissionWarning(true);
      } else {
        setShowPermissionWarning(false);
      }
    };
    checkPerms();
  }, [contextualIntelligence]);

  // Load registered geofences
  const loadGeofences = async () => {
    const geofences = await getRegisteredGeofences();
    setRegisteredGeofences(geofences);
  };

  // Handle toggle
  const handleToggleContextual = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const success = await setContextualIntelligence(enabled);
      if (!success && enabled) {
        // Permission denied, toggle should visually revert
        setShowPermissionWarning(true);
      } else {
        setShowPermissionWarning(false);
      }
      
      if (success) {
        await loadGeofences();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manual permission request
  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      const perms = await requestLocationPermissions();
      if (perms.background) {
        setShowPermissionWarning(false);
        await setContextualIntelligence(true);
        await loadGeofences();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contextualIntelligence) {
      loadGeofences();
    }
  }, [contextualIntelligence]);

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string;
    color: string;
  }) => (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card + "80", borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          { backgroundColor: color + "20" },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.foreground }]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
    </View>
  );

  return (
    <GradientBackground>
      <View style={{ paddingTop: topPad + 16, paddingHorizontal: 20 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              Geolocation
            </Text>
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              Location-based reminders
            </Text>
          </View>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Feather name="map-pin" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Interactive Map with Intent Tracking */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.mapContainer}>
          <InteractiveMap
            searchQuery={searchQuery}
            selectedLocation={selectedLocation}
            onLocationSelect={(location) => setSelectedLocation(location)}
            tasks={tasks} // Pass tasks to show intents with location on map
          />
        </Animated.View>

        {/* Search Input for Recommendations */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[
            styles.searchCard,
            { backgroundColor: colors.card + "80", borderColor: colors.border },
          ]}
        >
          <Text style={[styles.searchLabel, { color: colors.mutedForeground }]}>
            Search nearby places
          </Text>
          <View style={styles.searchInputWrap}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={[styles.searchInput, { color: colors.foreground }]}>
                {searchQuery
                  ? categories.find(c => c.key === searchQuery)?.label || searchQuery
                  : "Tap to select category..."}
              </Text>
            </TouchableOpacity>
          </View>
          {selectedLocation && (
            <View style={styles.selectedLocation}>
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={[styles.selectedText, { color: colors.foreground }]}>
                Selected: {selectedLocation.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedLocation(null)}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Contextual Intelligence Toggle */}
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={[
            styles.toggleCard,
            { backgroundColor: colors.card + "80", borderColor: colors.border },
          ]}
        >
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View
                style={[
                  styles.toggleIcon,
                  { backgroundColor: contextualIntelligence ? "#22c55e" + "20" : colors.destructive + "20" },
                ]}
              >
                <Feather
                  name={contextualIntelligence ? "check-circle" : "circle"}
                  size={18}
                  color={contextualIntelligence ? "#22c55e" : colors.destructive}
                />
              </View>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.foreground }]}>
                  Contextual Intelligence
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.mutedForeground }]}>
                  Get reminded when near task locations
                </Text>
              </View>
            </View>
            <Switch
              value={contextualIntelligence}
              onValueChange={handleToggleContextual}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={contextualIntelligence ? colors.primary : "#fff"}
              disabled={isLoading}
            />
          </View>

          {showPermissionWarning && (
            <Animated.View entering={FadeIn} style={styles.warningBox}>
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.warningText, { color: colors.destructive }]}>
                Location permissions required. Tap to enable.
              </Text>
              <TouchableOpacity onPress={requestPermissions}>
                <Text style={[styles.enableLink, { color: colors.primary }]}>
                  Enable
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.statsRow}
        >
          <StatCard
            icon="map-marker-radius"
            label="Active Geofences"
            value={String(registeredGeofences.length)}
            color="#7c6fe0"
          />
          <StatCard
            icon="crosshairs-gps"
            label="Tasks with Location"
            value={String(geofencedTasks.length)}
            color="#22c55e"
          />
        </Animated.View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 120 },
        ]}
      >
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          {/* Status Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </Text>
            <View
              style={[
                styles.statusCard,
                { backgroundColor: colors.card + "80", borderColor: colors.border },
              ]}
            >
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>
                  Background Location
                </Text>
                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: locationPermissions.background
                          ? "#22c55e"
                          : colors.destructive,
                      },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: colors.foreground }]}>
                    {locationPermissions.background ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>
                  Foreground Location
                </Text>
                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: locationPermissions.foreground
                          ? "#22c55e"
                          : colors.destructive,
                      },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: colors.foreground }]}>
                    {locationPermissions.foreground ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Geofenced Tasks List */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Geofenced Tasks
            </Text>
            {geofencedTasks.length > 0 ? (
              <View
                style={[
                  styles.tasksList,
                  { backgroundColor: colors.card + "80", borderColor: colors.border },
                ]}
              >
                {geofencedTasks.map((task, i) => (
                  <View
                    key={task.id}
                    style={[
                      styles.taskRow,
                      i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.taskIcon,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Feather name="map-pin" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text
                        style={[styles.taskTitle, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {(task as any).title || (task as any).action}
                      </Text>
                      <Text
                        style={[styles.taskLocation, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        📍 {task.location_name} · {(task.geofence_radius_m || 200)}m radius
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.taskStatus,
                        {
                          backgroundColor:
                            task.status === "completed"
                              ? colors.intentSuccess + "20"
                              : colors.primary + "15",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskStatusText,
                          {
                            color:
                              task.status === "completed"
                                ? colors.intentSuccess
                                : colors.primary,
                          },
                        ]}
                      >
                        {task.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Animated.View entering={FadeIn} style={styles.empty}>
                <View
                  style={[
                    styles.emptyIconBox,
                    { backgroundColor: colors.border + "40" },
                  ]}
                >
                  <Feather name="map" size={24} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No tasks with locations yet
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground + "80" }]}>
                  Add location names when creating tasks via voice
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Select Category
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryItem,
                    searchQuery === category.key && {
                      backgroundColor: colors.primary + "20",
                    },
                  ]}
                  onPress={() => {
                    setSearchQuery(category.key);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: colors.foreground },
                      searchQuery === category.key && {
                        color: colors.primary,
                        fontFamily: "DMSans_600SemiBold",
                      },
                    ]}
                  >
                    {category.label}
                  </Text>
                  {searchQuery === category.key && (
                    <Feather name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Syne_700Bold",
    letterSpacing: -0.8,
  },
  pageSub: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTitle: {
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
  },
  toggleDesc: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  warningText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    flex: 1,
  },
  enableLink: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Syne_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  scroll: {
    paddingTop: 12,
  },
  section: {
    gap: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Syne_600SemiBold",
    marginBottom: 12,
  },
  statusCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  tasksList: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
  taskLocation: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  taskStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskStatusText: {
    fontSize: 10,
    fontFamily: "Syne_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
  },
  searchCard: {
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  searchLabel: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    marginBottom: 8,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },
  selectedLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  selectedText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Syne_600SemiBold",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
  },
  mapContainer: {
    height: 400,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
