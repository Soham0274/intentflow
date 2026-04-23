// app/(app)/tasks/[id]/page.tsx — Task detail page
'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { Spinner } from '@/components/ui/Spinner'
import { useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { cn, formatDate, capitalize, getPriorityColor } from '@/lib/utils'
import type { Task, TaskStatus, TaskPriority } from '@/types/task'

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium')
  const [editStatus, setEditStatus] = useState<TaskStatus>('pending')
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const t = data.data || data
        setTask(t)
        setEditTitle(t.title || '')
        setEditDescription(t.description || '')
        setEditPriority(t.priority || 'medium')
        setEditStatus(t.status || 'pending')
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Task not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    )
  }

  const handleSave = async () => {
    await updateTask.mutateAsync({
      id: task.id,
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      status: editStatus,
    })
    setTask({ ...task, title: editTitle, description: editDescription, priority: editPriority, status: editStatus })
    setEditing(false)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask.mutateAsync(task.id)
      router.push('/tasks')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to tasks
      </button>

      {/* Main card */}
      <Card className="space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold border', getPriorityColor(task.priority))}>
              {capitalize(task.priority)}
            </span>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteTask.isPending}>
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} loading={updateTask.isPending}>
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <Input label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h1 className="text-xl font-semibold text-white">{task.title}</h1>
            {task.description && <p className="text-sm text-slate-400 leading-relaxed">{task.description}</p>}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.04]">
          <div>
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Due Date</span>
            <p className="text-sm text-slate-300 mt-0.5">{formatDate(task.due_date)}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">Created</span>
            <p className="text-sm text-slate-300 mt-0.5">{formatDate(task.created_at)}</p>
          </div>
          {task.tags && task.tags.length > 0 && (
            <div className="col-span-2">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">Tags</span>
              <div className="flex gap-1.5 mt-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="violet" size="sm">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          {task.nlp_raw_input && (
            <div className="col-span-2">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">Original Input</span>
              <p className="text-xs text-slate-500 mt-0.5 font-mono bg-white/[0.02] rounded-lg p-2">
                &ldquo;{task.nlp_raw_input}&rdquo;
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
