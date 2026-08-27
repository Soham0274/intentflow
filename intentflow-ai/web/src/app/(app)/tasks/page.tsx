// app/(app)/tasks/page.tsx — Task list page
'use client'
import { useMemo } from 'react'
import { NLPInput } from '@/components/nlp/NLPInput'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { useTasks } from '@/hooks/useTasks'
import { useTaskStore } from '@/store/taskStore'

export default function TasksPage() {
  const { data: tasks, isLoading, error } = useTasks()
  const { filterStatus, filterPriority, searchQuery } = useTaskStore()

  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    return tasks.filter((task) => {
      if (filterStatus && task.status !== filterStatus) return false
      if (filterPriority && task.priority !== filterPriority) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          task.title.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q) ||
          task.tags?.some((t) => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [tasks, filterStatus, filterPriority, searchQuery])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your tasks with AI-powered natural language input
        </p>
      </div>

      {/* NLP Input */}
      <NLPInput />

      {/* Filters */}
      <TaskFilters />

      {/* Task count */}
      {tasks && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {filteredTasks.length} of {tasks.length} tasks
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300">
          Failed to load tasks. Please check your connection and try again.
        </div>
      )}

      {/* Task list */}
      <TaskList tasks={filteredTasks} loading={isLoading} />
    </div>
  )
}
