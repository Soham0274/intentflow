import axios from 'axios';
import { supabase } from './supabase';

// For Expo development, use your computer's local IP instead of localhost
// Find your IP: Windows (ipconfig), Mac/Linux (ifconfig or ipconfig getifaddr en0)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.x:3001/api';

console.log('[API Config] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('[API Config] Final API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Automatically inject Supabase auth token into all requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// USER APIs
export const fetchUser = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (updates: any) => {
  const response = await api.put('/users/profile', updates);
  return response.data;
};

export const fetchUserPreferences = async () => {
  const response = await api.get('/users/preferences');
  return response.data;
};

export const updateUserPreferences = async (preferences: any) => {
  const response = await api.put('/users/preferences', preferences);
  return response.data;
};

// PROJECT APIs
export const fetchProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const fetchProjectById = async (projectId: string) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async (projectData: any) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const updateProject = async (projectId: string, updates: any) => {
  const response = await api.patch(`/projects/${projectId}`, updates);
  return response.data;
};

export const deleteProject = async (projectId: string) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

// CONNECTED APPS APIs
export const fetchConnectedApps = async () => {
  const response = await api.get('/users/connected-apps');
  return response.data;
};

export const connectApp = async (appName: string, credentials: any) => {
  const response = await api.post('/users/connect-app', { appName, credentials });
  return response.data;
};

export const disconnectApp = async (appName: string) => {
  const response = await api.post('/users/disconnect-app', { appName });
  return response.data;
};

// RECENT INTENTS APIs
export const fetchRecentIntents = async (limit: number = 10) => {
  const response = await api.get('/users/recent-intents', { params: { limit } });
  return response.data;
};

// TASK APIs
export const fetchTasks = async (filters = {}) => {
  const response = await api.get('/tasks', { params: filters });
  return response.data;
};

export const createTask = async (taskData: any) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (taskId: string, updates: any) => {
  const response = await api.patch(`/tasks/${taskId}`, updates);
  return response.data;
};

export const deleteTask = async (taskId: string) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// AUTOMATION APIs
export const triggerAutomation = async (workflowId: string, payload: any) => {
  const response = await api.post(`/automation/trigger/${workflowId}`, payload);
  return response.data;
};

export const getAutomationStatus = async (executionId: string) => {
  const response = await api.get(`/automation/status/${executionId}`);
  return response.data;
};

// HITL (Human In The Loop) APIs
export const fetchPendingHitl = async () => {
  const response = await api.get('/hitl/pending');
  return response.data;
};

export const fetchHitlById = async (id: string) => {
  const response = await api.get(`/hitl/${id}`);
  return response.data;
};

export const confirmHitl = async (hitlId: string) => {
  const response = await api.post('/hitl/confirm', { hitlId });
  return response.data;
};

export const rejectHitl = async (hitlId: string, reason?: string) => {
  const response = await api.post('/hitl/reject', { hitlId, reason });
  return response.data;
};

// NLP APIs
export const processNLP = async (text: string) => {
  const response = await api.post('/nlp/extract', { text });
  return response.data;
};

export const processVoice = async (audioUri: string) => {
  console.log('[API] processVoice called with URI:', audioUri);
  console.log('[API] API_URL:', API_URL);
  
  const formData = new FormData();
  
  // Handle blob URLs (web) vs file URIs (mobile)
  if (audioUri.startsWith('blob:')) {
    // Web: fetch the blob from the URL
    console.log('[API] Fetching blob from URL...');
    const response = await fetch(audioUri);
    const blob = await response.blob();
    console.log('[API] Blob fetched, size:', blob.size, 'type:', blob.type);
    
    // Create a File from the blob - use audio/mp4 for m4a files
    const mimeType = blob.type === 'audio/m4a' ? 'audio/mp4' : (blob.type || 'audio/mp4');
    const file = new File([blob], 'voice_input.m4a', { type: mimeType });
    formData.append('audio', file);
  } else {
    // React Native: use the file URI directly
    formData.append('audio', {
      uri: audioUri,
      name: 'voice_input.m4a',
      type: 'audio/mp4', // Use audio/mp4 for m4a files
    } as unknown as Blob);
  }

  console.log('[API] Sending FormData to /nlp/voice...');
  
  try {
    const response = await api.post('/nlp/voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout for voice processing
    });
    console.log('[API] Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error in processVoice:', error.message);
    console.error('[API] Error response:', error.response?.data);
    console.error('[API] Error status:', error.response?.status);
    throw error;
  }
};

// CALENDAR APIs
export const fetchCalendarEvents = async () => {
  const response = await api.get('/calendar/events');
  return response.data;
};

export const syncTaskToCalendar = async (task: any) => {
  const response = await api.post('/calendar/sync-task', { task });
  return response.data;
};

export default api;
