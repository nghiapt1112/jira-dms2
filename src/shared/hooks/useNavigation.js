import { useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNavigationStore } from '../store/navigationStore'

export const useNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isOpen,
    isMobile,
    activeItem,
    toggleSidebar,
    setActiveItem,
    closeSidebar,
    openSidebar
  } = useNavigationStore()
  
  const navigateTo = useCallback((path, options = {}) => {
    navigate(path, options)
    
    if (isMobile && options.closeSidebar !== false) {
      closeSidebar()
    }
  }, [navigate, isMobile, closeSidebar])
  
  const goBack = useCallback(() => {
    navigate(-1)
  }, [navigate])
  
  const goForward = useCallback(() => {
    navigate(1)
  }, [navigate])
  
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900
      useNavigationStore.getState().setMobile(mobile)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  const isActive = useCallback((path) => {
    return location.pathname === path
  }, [location.pathname])
  
  const isParentActive = useCallback((paths) => {
    return paths.some(path => location.pathname.startsWith(path))
  }, [location.pathname])
  
  return {
    isOpen,
    isMobile,
    activeItem,
    currentPath: location.pathname,
    toggleSidebar,
    setActiveItem,
    closeSidebar,
    openSidebar,
    navigateTo,
    goBack,
    goForward,
    isActive,
    isParentActive
  }
}