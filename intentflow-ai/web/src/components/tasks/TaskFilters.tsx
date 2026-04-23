// components/tasks/TaskFilters.tsx
'use client'
import { cn } from '@/lib/utils'
import { useTaskStore } from '@/store/taskStore'

const statusFilters = [
  { value: null, label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Done' },
  { value: 'awaiting_hitl', label: 'Review' },
]

const priorityFilters = [
  { value: null, label: 'Any Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export function TaskFilters() {
  const { filterStatus, filterPriority, setFilterStatus, setFilterPriority, searchQuery, setSearchQuery } = useTaskStore()

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
        />
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        {statusFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilterStatus(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              filterStatus === f.value
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-slate-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Priority filters */}
      <div className="flex flex-wrap gap-1.5">
        {priorityFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilterPriority(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              filterPriority === f.value
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-slate-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
