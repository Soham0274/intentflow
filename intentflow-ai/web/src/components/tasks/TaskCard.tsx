// components/tasks/TaskCard.tsx
'use client'
import { Card } from '@/components/ui/Card'
import { TaskStatusBadge } from './TaskStatusBadge'
import { cn, formatDate, getPriorityColor } from '@/lib/utils'
import type { Task } from '@/types/task'
import Link from 'next/link'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <Card hoverable className="group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <TaskStatusBadge status={task.status} />
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border',
                getPriorityColor(task.priority)
              )}>
                {task.priority}
              </span>
            </div>
            <h3 className="text-slate-900 dark:text-white font-medium text-sm group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors truncate">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-slate-500 text-xs mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {task.due_date && (
              <span className="text-[11px] text-slate-500">
                {formatDate(task.due_date)}
              </span>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
