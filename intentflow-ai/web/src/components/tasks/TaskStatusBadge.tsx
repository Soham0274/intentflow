// components/tasks/TaskStatusBadge.tsx
import { Badge } from '@/components/ui/Badge'
import type { TaskStatus } from '@/types/task'

const statusConfig: Record<TaskStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet' }> = {
  pending: { label: 'Pending', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  awaiting_hitl: { label: 'Needs Review', variant: 'warning' },
  completed: { label: 'Done', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

interface TaskStatusBadgeProps {
  status: TaskStatus
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending
  return (
    <Badge variant={config.variant} pulse={status === 'awaiting_hitl'}>
      {config.label}
    </Badge>
  )
}
