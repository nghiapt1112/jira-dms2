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
import MobileNav from '../../navigation/MobileNav'
import GlobalCachePopover from '../../../shared/components/GlobalCachePopover'
import { useNavigationStore } from '../../../shared/store/navigationStore'
import { SIDEBAR_WIDTHS } from '../../navigation/Sidebar/SidebarStyles'

const Layout = React.memo(({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { isOpen, getIsOpen } = useNavigationStore()
  
  // Get the actual sidebar open state
  const sidebarIsOpen = isMobile ? isOpen : true // Desktop sidebar is always open
  
  const getMainStyles = () => {
    if (isMobile) {
      return {
        flexGrow: 1,
        p: 3,
        width: '100%',
        mt: 8, // Account for mobile AppBar
      }
    }
    
    const sidebarWidth = sidebarIsOpen ? SIDEBAR_WIDTHS.EXPANDED : SIDEBAR_WIDTHS.COLLAPSED
    
    return {
      flexGrow: 1,
      p: 3,
      ml: `${sidebarWidth}px`,
      transition: theme.transitions.create(['margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }
  }
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {isMobile && <MobileNav />}
      
      <Sidebar />
      
      <Box
        component="main"
        sx={getMainStyles()}
      >
        {/* Toolbar spacer for desktop AppBar */}
        {!isMobile && <Toolbar />}
        {isMobile && <Toolbar />}
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