import { create } from 'zustand'

export const useGlobalStore = create((set) => ({
  isLoading: false,
  error: null,
  theme: 'light',
  sidebarOpen: false,
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))