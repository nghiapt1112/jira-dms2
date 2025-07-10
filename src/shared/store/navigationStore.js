import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNavigationStore = create(
  persist(
    (set, get) => ({
      isOpen: false,
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
        return state.isMobile ? state.isOpen : true
      }
    }),
    {
      name: 'navigation-storage',
      partialize: (state) => ({ isOpen: state.isOpen })
    }
  )
)