// types/nlp.ts — NLP / AI parsing types

import type { TaskPriority } from './task'

export interface NLPParseResult {
  title: string
  description?: string
  due_date?: string
  priority?: TaskPriority
  requires_hitl: boolean
  confidence: number
  intent: 'create_task' | 'update_task' | 'query_tasks' | 'unknown'
}

export interface NLPStreamChunk {
  token?: string
  done: boolean
  full_response?: string
}

export interface NLPParseRequest {
  input: string
}

export interface NLPStreamRequest {
  input: string
  task_context?: Record<string, unknown>
}
