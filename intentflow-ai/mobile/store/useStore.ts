import { create } from 'zustand';
import { Task, Project, User, ToastMessage, ToastType, AIExtraction, IntentOption, ScreenName, SystemStatus, ConnectedApp } from '@/types/index';
import { supabase } from '@/services/supabase';
import { mockProjects, mockUser } from '@/constants/mockData';

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
  projects: mockProjects,
  user: mockUser,
  isCaptureOpen: false,
  toasts: [],
  currentIntent: null,
  intentOptions: [],
  selectedIntentId: null,
  notes: '',
  voiceSensitivity: true,
  autoConfirm: false,
  connectedApps: [
    { name: 'Google Calendar', icon: '📅', status: 'active' },
    { name: 'Slack', icon: '💬', status: 'active' },
    { name: 'Notion', icon: '📝', status: 'connect' },
    { name: 'Email', icon: '📧', status: 'connect' },
  ],
  recentIntents: [
    { title: 'Remind Sarah about deadline', time: '2h ago', icon: '⏰' },
    { title: 'Schedule team standup', time: '5h ago', icon: '👥' },
    { title: 'Send weekly report', time: '1d ago', icon: '📊' },
  ],

  // Navigation
  navigateToScreen: (screen) => set({ screen }),

  // System status
  setSystemStatus: (status) => set({ systemStatus: status }),

  // Task actions
  fetchTasks: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedTasks = data.map((t: any) => ({
        ...t,
        dueDate: t.due_date,
        dueTime: t.due_time,
        createdAt: t.created_at,
      }));
      set({ tasks: mappedTasks as Task[] });
    } catch (error: any) {
      get().showToast('error', error.message || 'Failed to fetch tasks');
    }
  },

  addTask: async (task) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dbTask = {
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        due_time: task.dueTime,
        priority: task.priority,
        category: task.category,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(dbTask)
        .select()
        .single();
        
      if (error) throw error;
      
      const newTask = {
        ...data,
        dueDate: data.due_date,
        dueTime: data.due_time,
        createdAt: data.created_at,
      };
      
      set((state) => ({ tasks: [newTask as Task, ...state.tasks] }));
      get().showToast('success', 'Task created successfully');
    } catch (error: any) {
      get().showToast('error', error.message);
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
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
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      
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
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      get().showToast('success', 'Task deleted');
    } catch (error: any) {
      get().showToast('error', error.message);
    }
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