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

export interface IntentTask {
  id: string;
  entity: string;
  action: string;
  trigger: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
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
  const [voiceTrigger, setVoiceTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Derive user initial from real user data
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  // Fetch real tasks from backend
  const fetchTasks = useCallback(async () => {
    if (!authIsAuthenticated) return;
    try {
      const response = await api.fetchTasks({ limit: 10 });
      const tasksData = response.data || response;
      // Map backend task format to IntentTask format
      const mappedTasks: IntentTask[] = tasksData.map((t: any) => ({
        id: t.id,
        entity: t.category || "General",
        action: t.title,
        trigger: t.due_date ? new Date(t.due_date).toLocaleDateString() : "No due date",
        status: t.status === "pending_review" ? "pending" : t.status === "completed" ? "confirmed" : "pending",
        createdAt: t.created_at || t.createdAt,
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
      });
    } else {
      setTasks([]);
      setLifeAreas([]);
      setIsLoading(false);
    }
  }, [authIsAuthenticated, user, fetchTasks, fetchLifeAreas]);

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
