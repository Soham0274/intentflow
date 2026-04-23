// types/task.ts — Task data models (aligned with Supabase schema)

export type TaskStatus = 'pending' | 'in_progress' | 'awaiting_hitl' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'
export type Category = 'Work' | 'Personal' | 'Health' | 'Finance' | 'Learning'

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  category?: Category
  due_date: string | null
  nlp_raw_input: string | null
  nlp_parsed_data: Record<string, unknown> | null
  workflow_id: string | null
  tags: string[]
  subtasks?: Subtask[]
  created_at: string
  updated_at: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  due_date?: string
  priority?: TaskPriority
  category?: Category
  nlp_raw_input?: string
  tags?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string
  tags?: string[]
}
