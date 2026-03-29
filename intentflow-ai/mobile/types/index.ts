export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'active' | 'pending' | 'completed';
export type Category = 'Work' | 'Personal' | 'Health' | 'Finance' | 'Learning';
export type CaptureStep = 'input' | 'recording' | 'processing' | 'preview';
export type ToastType = 'success' | 'error' | 'info';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority: Priority;
  category: Category;
  status: TaskStatus;
  subtasks: Subtask[];
  people?: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  tasks: number;
  completed: number;
  overdue: number;
  members: string[];
  dueDate: string;
  progress: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface ExtractedField {
  label: string;
  value: string;
  icon: string;
  confidence: number;
}

export interface AIExtraction {
  title: string;
  date?: string;
  time?: string;
  priority: Priority;
  category: Category;
  people?: string[];
  confidence: number;
  fields: ExtractedField[];
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
