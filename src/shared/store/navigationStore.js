import { create } from 'zustand'

export const useNavigationStore = create((set, get) => ({
  isOpen: false, // Sidebar collapsed by default (mini drawer mode)
  isMobile: false,
  activeItem: null,
  isLoading: false,
  
  toggleSidebar: () => set(state => ({ isOpen: !state.isOpen })),
  setMobile: (isMobile) => set({ isMobile }),
  setActiveItem: (item) => set({ activeItem: item }),
  closeSidebar: () => set({ isOpen: false }),
  openSidebar: () => set({ isOpen: true }),
  
  getIsOpen: () => {
    const state = get()
    return state.isOpen // Return the actual state for both mobile and desktop
  }
}))