import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Automatically inject Supabase auth token into all requests
api.interceptors.request.use(async (config: any) => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return config;
}, (error: any) => {
  return Promise.reject(error);
});

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

export const processVoice = async (audioUri: string) => {
  const formData = new FormData();
  // @ts-ignore
  formData.append('audio', {
    uri: audioUri,
    name: 'voice_input.m4a',
    type: 'audio/m4a',
  });

  const response = await api.post('/nlp/voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
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
