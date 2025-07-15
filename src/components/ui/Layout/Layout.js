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
import { useNavigationStore } from '../../../shared/store/navigationStore'

const Layout = React.memo(({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { isOpen, getIsOpen } = useNavigationStore()
  
  // Get the actual sidebar open state
  const sidebarIsOpen = isOpen // Use the actual state for both mobile and desktop
  
  const getMainStyles = () => {
    // Main content always uses full width - no margin calculations
    return {
      flexGrow: 1,
      width: '100%', // Always full width
      p: 2,
      mt: 8, // Account for AppBar height
    }
  }
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Sidebar with overlay behavior */}
      <Sidebar />
      
      {/* Main content - always full width */}
      <Box
        component="main"
        sx={getMainStyles()}
      >
        {children}
      </Box>

      {/* Global Cache Management Popover */}
      <GlobalCachePopover selectedProjects={[]} />
    </Box>
  )
})

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

Layout.displayName = 'Layout'

export default Layout