import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIModel } from '@/types'

interface AppState {
  // AI
  selectedModel: AIModel
  setModel: (model: AIModel) => void

  // UI
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void

  // Chat
  currentConversationId: string | null
  setConversationId: (id: string | null) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      selectedModel: 'gpt-4o-mini',
      setModel: (model) => set({ selectedModel: model }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      currentConversationId: null,
      setConversationId: (id) => set({ currentConversationId: id }),
    }),
    {
      name: 'aiva-store',
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
