// store/uiStore.ts
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  nlpStreaming: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  setNlpStreaming: (streaming: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  nlpStreaming: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
  setNlpStreaming: (streaming) => set({ nlpStreaming: streaming }),
}))
