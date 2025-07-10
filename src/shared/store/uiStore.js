import { create } from 'zustand'

export const useUIStore = create((set) => ({
  globalLoading: false,
  notifications: [],
  theme: 'light',
  
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  
  addNotification: (notification) => set(state => ({
    notifications: [...state.notifications, {
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    }]
  })),
  
  removeNotification: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  setTheme: (theme) => set({ theme })
}))