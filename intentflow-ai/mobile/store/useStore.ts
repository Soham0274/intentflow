import { create } from 'zustand';
import { Task, Project, User, ToastMessage, ToastType, AIExtraction, IntentOption, ScreenName, SystemStatus, ConnectedApp } from '@/types/index';
import * as api from '@/services/api';

interface AppState {
  screen: ScreenName;
  systemStatus: SystemStatus;
  tasks: Task[];
  projects: Project[];
  user: User;
  isCaptureOpen: boolean;
  toasts: ToastMessage[];
  currentIntent: AIExtraction | null;
  intentOptions: IntentOption[];
  selectedIntentId: string | null;
  notes: string;
  voiceSensitivity: boolean;
  autoConfirm: boolean;
  connectedApps: ConnectedApp[];
  recentIntents: { title: string; time: string; icon: string }[];

  // Navigation
  navigateToScreen: (screen: ScreenName) => void;
  
  // System status
  setSystemStatus: (status: SystemStatus) => void;
  
  // Task actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Data fetching
  fetchUser: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchConnectedApps: () => Promise<void>;
  fetchRecentIntents: () => Promise<void>;
  initializeApp: () => Promise<void>;

  // UI actions
  openCapture: () => void;
  closeCapture: () => void;
  showToast: (type: ToastType, message: string) => void;
  dismissToast: (id: string) => void;
  
  // Intent actions
  setCurrentIntent: (intent: AIExtraction | null) => void;
  setIntentOptions: (options: IntentOption[]) => void;
  selectIntentOption: (id: string | null) => void;
  setNotes: (notes: string) => void;
  clearIntent: () => void;
  
  // Preferences
  setVoiceSensitivity: (value: boolean) => void;
  setAutoConfirm: (value: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  screen: 'home',
  systemStatus: 'online',
  tasks: [],
  projects: [],
  user: { id: '', name: '', email: '', avatar: '' },
  isCaptureOpen: false,
  toasts: [],
  currentIntent: null,
  intentOptions: [],
  selectedIntentId: null,
  notes: '',
  voiceSensitivity: true,
  autoConfirm: false,
  connectedApps: [],
  recentIntents: [],

  // Navigation
  navigateToScreen: (screen) => set({ screen }),

  // System status
  setSystemStatus: (status) => set({ systemStatus: status }),

  // Task actions
  fetchTasks: async () => {
    try {
      const tasks = await api.fetchTasks();
      const mappedTasks = tasks.map((t: any) => ({
        ...t,
        dueDate: t.due_date || t.dueDate,
        dueTime: t.due_time || t.dueTime,
        createdAt: t.created_at || t.createdAt,
      }));
      set({ tasks: mappedTasks as Task[] });
    } catch (error: any) {
      get().showToast('error', error.message || 'Failed to fetch tasks');
    }
  },

  addTask: async (task) => {
    try {
      const newTask = await api.createTask(task);
      const mappedTask = {
        ...newTask,
        dueDate: newTask.due_date || newTask.dueDate,
        dueTime: newTask.due_time || newTask.dueTime,
        createdAt: newTask.created_at || newTask.createdAt,
      };
      set((state) => ({ tasks: [mappedTask as Task, ...state.tasks] }));
      get().showToast('success', 'Task created successfully');
    } catch (error: any) {
      get().showToast('error', error.message);
    }
  },

  updateTask: async (id, updates) => {
    try {
      await api.updateTask(id, updates);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    } catch (error: any) {
      get().showToast('error', error.message);
    }
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'active' : 'completed';
    try {
      await api.updateTask(id, { status: newStatus });
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, status: newStatus } : t
        ),
      }));
    } catch (error: any) {
      get().showToast('error', error.message);
    }
  },

  deleteTask: async (id) => {
    try {
      await api.deleteTask(id);
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      get().showToast('success', 'Task deleted');
    } catch (error: any) {
      get().showToast('error', error.message);
    }
  },

  // Data fetching from backend
  fetchUser: async () => {
    try {
      const user = await api.fetchUser();
      set({ user });
    } catch (error: any) {
      get().showToast('error', error.message || 'Failed to fetch user');
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await api.fetchProjects();
      set({ projects });
    } catch (error: any) {
      get().showToast('error', error.message || 'Failed to fetch projects');
    }
  },

  fetchConnectedApps: async () => {
    try {
      const apps = await api.fetchConnectedApps();
      set({ connectedApps: apps });
    } catch (error: any) {
      get().showToast('error', error.message || 'Failed to fetch connected apps');
    }
  },

  fetchRecentIntents: async () => {
    try {
      const intents = await api.fetchRecentIntents();
      set({ recentIntents: intents });
    } catch (error: any) {
      get().showToast('error', error.message || 'Failed to fetch recent intents');
    }
  },

  initializeApp: async () => {
    const { fetchUser, fetchProjects, fetchTasks, fetchConnectedApps, fetchRecentIntents } = get();
    await Promise.all([
      fetchUser(),
      fetchProjects(),
      fetchTasks(),
      fetchConnectedApps(),
      fetchRecentIntents(),
    ]);
  },

  // UI actions
  openCapture: () => set({ isCaptureOpen: true }),
  closeCapture: () => set({ isCaptureOpen: false }),

  showToast: (type, message) => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => get().dismissToast(id), 3000);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // Intent actions
  setCurrentIntent: (intent) => set({ currentIntent: intent }),
  setIntentOptions: (options) => set({ intentOptions: options }),
  selectIntentOption: (id) => set({ selectedIntentId: id }),
  setNotes: (notes) => set({ notes }),
  clearIntent: () => set({ currentIntent: null, intentOptions: [], selectedIntentId: null, notes: '' }),
  
  // Preferences
  setVoiceSensitivity: (value) => set({ voiceSensitivity: value }),
  setAutoConfirm: (value) => set({ autoConfirm: value }),
}));