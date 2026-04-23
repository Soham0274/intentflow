// store/taskStore.ts
import { create } from 'zustand'
import type { Task } from '@/types/task'

interface TaskStore {
  selectedTaskId: string | null
  isCreateModalOpen: boolean
  realtimeAdditions: Task[]
  filterStatus: string | null
  filterPriority: string | null
  searchQuery: string
  setSelectedTask: (id: string | null) => void
  openCreateModal: () => void
  closeCreateModal: () => void
  addRealtimeTask: (task: Task) => void
  clearRealtimeAdditions: () => void
  setFilterStatus: (status: string | null) => void
  setFilterPriority: (priority: string | null) => void
  setSearchQuery: (query: string) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  selectedTaskId: null,
  isCreateModalOpen: false,
  realtimeAdditions: [],
  filterStatus: null,
  filterPriority: null,
  searchQuery: '',
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  addRealtimeTask: (task) =>
    set((s) => ({ realtimeAdditions: [task, ...s.realtimeAdditions] })),
  clearRealtimeAdditions: () => set({ realtimeAdditions: [] }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
