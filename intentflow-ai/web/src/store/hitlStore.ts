// store/hitlStore.ts
import { create } from 'zustand'
import type { HITLItem } from '@/types/hitl'

interface HITLStore {
  pendingItems: HITLItem[]
  pendingCount: number
  addPending: (item: HITLItem) => void
  resolvePending: (id: string) => void
  setItems: (items: HITLItem[]) => void
}

export const useHITLStore = create<HITLStore>((set) => ({
  pendingItems: [],
  pendingCount: 0,
  addPending: (item) =>
    set((s) => ({
      pendingItems: [item, ...s.pendingItems],
      pendingCount: s.pendingCount + 1,
    })),
  resolvePending: (id) =>
    set((s) => ({
      pendingItems: s.pendingItems.filter((i) => i.id !== id),
      pendingCount: Math.max(0, s.pendingCount - 1),
    })),
  setItems: (items) =>
    set({
      pendingItems: items,
      pendingCount: items.length,
    }),
}))
