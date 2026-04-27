import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "../store/AuthContext";
import * as api from "../services/api";
import {
  syncGeofences,
  requestLocationPermissions,
  checkLocationPermissions,
  GeofencedTask,
} from "../services/geofencing";

export interface IntentTask {
  id: string;
  entity: string;
  action: string;
  trigger: string;
  status: "pending" | "active" | "completed";
  createdAt: string;
  // Location data for geolocation features
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
}

export interface LifeArea {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  color: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  userInitial: string;
  tasks: IntentTask[];
  lifeAreas: LifeArea[];
  smartNudges: boolean;
  quietHours: boolean;
  voiceSensitivity: "Low" | "Medium" | "High";
  autoConfirm: boolean;
  contextualIntelligence: boolean;
  locationPermissions: { foreground: boolean; background: boolean };
  voiceTrigger: number;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  addTask: (task: IntentTask) => void;
  deleteTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<IntentTask>) => void;
  refreshTasks: () => Promise<void>;
  setSmartNudges: (v: boolean) => void;
  setQuietHours: (v: boolean) => void;
  setVoiceSensitivity: (v: "Low" | "Medium" | "High") => void;
  setAutoConfirm: (v: boolean) => void;
  setContextualIntelligence: (v: boolean) => Promise<boolean>;
  syncGeofences: () => Promise<boolean>;
  triggerVoice: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated: authIsAuthenticated, user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState<IntentTask[]>([]);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [smartNudges, setSmartNudgesState] = useState(true);
  const [quietHours, setQuietHoursState] = useState(true);
  const [voiceSensitivity, setVoiceSensitivityState] = useState<"Low" | "Medium" | "High">("High");
  const [autoConfirm, setAutoConfirmState] = useState(false);
  const [contextualIntelligence, setContextualIntelligenceState] = useState(false);
  const [locationPermissions, setLocationPermissions] = useState({ foreground: false, background: false });
  const [voiceTrigger, setVoiceTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Check location permissions on mount
  useEffect(() => {
    checkLocationPermissions().then(setLocationPermissions);
  }, []);

  // Derive user initial from real user data
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  // Fetch real tasks from backend
  const fetchTasks = useCallback(async () => {
    if (!authIsAuthenticated) return;
    try {
      const response = await api.fetchTasks({ limit: 10 });
      const tasksData = response.data || response;
      // Map backend task format to IntentTask format with location data
      const mappedTasks: IntentTask[] = tasksData.map((t: any) => ({
        id: t.id,
        entity: t.category || "General",
        action: t.title,
        trigger: t.due_date ? new Date(t.due_date).toLocaleDateString() : "No due date",
        status: t.status === "completed" ? "completed" :
                t.status === "active" ? "active" :
                "pending",
        createdAt: t.created_at || t.createdAt,
        // Location data from backend
        locationName: t.location_name || t.locationName,
        locationLat: t.location_lat || t.locationLat,
        locationLng: t.location_lng || t.locationLng,
        locationAddress: t.location_address || t.locationAddress,
      }));
      setTasks(mappedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }, [authIsAuthenticated]);

  // Fetch life areas (using categories from tasks as life areas)
  const fetchLifeAreas = useCallback(async () => {
    if (!authIsAuthenticated) return;
    try {
      // Get unique categories from tasks or use defaults
      const defaultAreas: LifeArea[] = [
        { id: "1", name: "Work", description: "Professional tasks", taskCount: 0, color: "#7C6EFF" },
        { id: "2", name: "Personal", description: "Personal life tasks", taskCount: 0, color: "#4ECDC4" },
        { id: "3", name: "Health", description: "Health & wellness", taskCount: 0, color: "#FF6B6B" },
        { id: "4", name: "Routine", description: "Daily routines", taskCount: 0, color: "#FFB800" },
      ];
      
      // Count tasks per category
      const response = await api.fetchTasks({ limit: 100 });
      const tasksData = response.data || response;
      const areasWithCounts = defaultAreas.map(area => ({
        ...area,
        taskCount: tasksData.filter((t: any) => t.category === area.name.toLowerCase()).length
      }));
      
      setLifeAreas(areasWithCounts);
    } catch (error) {
      console.error("Failed to fetch life areas:", error);
      // Set default areas if fetch fails
      setLifeAreas([
        { id: "1", name: "Work", description: "Professional tasks", taskCount: 0, color: "#7C6EFF" },
        { id: "2", name: "Personal", description: "Personal life tasks", taskCount: 0, color: "#4ECDC4" },
        { id: "3", name: "Health", description: "Health & wellness", taskCount: 0, color: "#FF6B6B" },
        { id: "4", name: "Routine", description: "Daily routines", taskCount: 0, color: "#FFB800" },
      ]);
    }
  }, [authIsAuthenticated]);

  // Sync local auth state with AuthContext/Supabase and fetch real data
  useEffect(() => {
    setIsAuthenticated(authIsAuthenticated);
    
    if (authIsAuthenticated && user) {
      Promise.all([fetchTasks(), fetchLifeAreas()]).finally(() => {
        setIsLoading(false);
        // Sync geofences after fetching tasks
        if (contextualIntelligence) {
          handleSyncGeofences();
        }
      });
    } else {
      setTasks([]);
      setLifeAreas([]);
      setIsLoading(false);
    }
  }, [authIsAuthenticated, user, fetchTasks, fetchLifeAreas, contextualIntelligence]);

  // Sync geofences when tasks change or contextual intelligence is enabled
  useEffect(() => {
    if (contextualIntelligence && tasks.length > 0 && locationPermissions.background) {
      handleSyncGeofences();
    }
  }, [tasks, contextualIntelligence, locationPermissions.background]);

  // Handle contextual intelligence toggle
  const setContextualIntelligence = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (enabled) {
      // Request location permissions
      const locationPerms = await requestLocationPermissions();
      
      setLocationPermissions(locationPerms);
      
      if (!locationPerms.background) {
        console.warn('[ContextualIntelligence] Background location denied');
        setContextualIntelligenceState(false);
        return false;
      }
      
      // Sync geofences immediately
      await handleSyncGeofences();
    } else {
      // Stop all geofencing when disabled
      const { stopGeofencing } = await import('../services/geofencing');
      await stopGeofencing();
    }
    
    setContextualIntelligenceState(enabled);
    return true;
  }, []);

  // Sync geofences with current tasks
  const handleSyncGeofences = useCallback(async (): Promise<boolean> => {
    if (!contextualIntelligence || !locationPermissions.background) {
      return false;
    }

    const geofencedTasks: GeofencedTask[] = tasks.map(t => ({
      id: t.id,
      title: (t as any).title || t.action,
      location_name: (t as any).location_name,
      location_lat: (t as any).location_lat,
      location_lng: (t as any).location_lng,
      geofence_radius_m: (t as any).geofence_radius_m || 200,
      geofence_enabled: !!(t as any).location_lat && !!(t as any).location_lng,
      status: t.status,
    }));

    return await syncGeofences(geofencedTasks);
  }, [tasks, contextualIntelligence, locationPermissions.background]);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  const addTask = (task: IntentTask) => {
    setTasks((prev) => [task, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const updateTask = (taskId: string, updates: Partial<IntentTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const refreshTasks = async () => {
    await fetchTasks();
    await fetchLifeAreas();
  };

  const triggerVoice = useCallback(() => {
    setVoiceTrigger((n) => n + 1);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        userInitial,
        tasks,
        lifeAreas,
        smartNudges,
        quietHours,
        voiceSensitivity,
        autoConfirm,
        contextualIntelligence,
        locationPermissions,
        voiceTrigger,
        isLoading,
        login,
        logout,
        addTask,
        deleteTask,
        updateTask,
        refreshTasks,
        setSmartNudges: setSmartNudgesState,
        setQuietHours: setQuietHoursState,
        setVoiceSensitivity: setVoiceSensitivityState,
        setAutoConfirm: setAutoConfirmState,
        setContextualIntelligence,
        syncGeofences: handleSyncGeofences,
        triggerVoice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
