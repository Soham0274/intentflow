// types/hitl.ts — Human-in-the-Loop data models

import type { Task } from './task'

export type HITLStatus = 'pending' | 'approved' | 'rejected' | 'expired'
export type HITLActionType =
  | 'confirm_task_creation'
  | 'confirm_task_update'
  | 'confirm_workflow_action'
  | 'review_nlp_result'

export interface HITLItem {
  id: string
  task_id: string | null
  user_id: string
  action_type: HITLActionType
  status: HITLStatus
  proposed_data: Partial<Task>
  final_data: Partial<Task> | null
  ai_reasoning: string | null
  confidence: number | null
  user_reason: string | null
  n8n_callback_url: string | null
  expires_at: string
  resolved_at: string | null
  created_at: string
}

export interface HITLResolveInput {
  action: 'approve' | 'reject'
  reason?: string
  modified_data?: Partial<Task>
}
