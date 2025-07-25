import React from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  CssBaseline,
  Toolbar,
  useTheme,
  useMediaQuery
} from '@mui/material'
import Sidebar from '../../navigation/Sidebar'
import GlobalCachePopover from '../../../shared/components/GlobalCachePopover'
import { DebugPanel, DebugFab } from '../../../shared/components/DebugPanel'
import { useNavigationStore } from '../../../shared/store/navigationStore'

const Layout = React.memo(({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { isOpen, getIsOpen } = useNavigationStore()
  
  // Get the actual sidebar open state
  const sidebarIsOpen = isOpen // Use the actual state for both mobile and desktop
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Sidebar with overlay behavior */}
      <Sidebar />
      
      {/* Main content - always full width with proper spacing */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%', // Always full width
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* MUI's recommended way to add spacing for fixed AppBar */}
        <Toolbar />
        
        {/* Additional spacing for StagewiseToolbar */}
        <Box sx={{ height: 48 }} />
        
        {/* Content container with proper padding */}
        <Box
          sx={{
            flexGrow: 1,
            p: 2,
            minHeight: 0, // Allow content to shrink if needed
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Global Cache Management Popover */}
      <GlobalCachePopover selectedProjects={[]} />
      
      {/* Debug Panel - Global debugging functionality */}
      <DebugPanel />
      <DebugFab />
    </Box>
  )
})

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

Layout.displayName = 'Layout'

export default Layout