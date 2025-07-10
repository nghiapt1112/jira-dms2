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
import { useNavigationStore } from '../../../shared/store/navigationStore'
import { SIDEBAR_WIDTHS } from '../../navigation/Sidebar'

const Layout = React.memo(({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { isOpen } = useNavigationStore()
  
  const getMainStyles = () => {
    if (isMobile) {
      return {
        flexGrow: 1,
        p: 3,
        width: '100%',
        mt: 8,
      }
    }
    
    return {
      flexGrow: 1,
      p: 3,
      width: `calc(100% - ${isOpen ? SIDEBAR_WIDTHS.EXPANDED : SIDEBAR_WIDTHS.COLLAPSED}px)`,
      ml: `${isOpen ? SIDEBAR_WIDTHS.EXPANDED : SIDEBAR_WIDTHS.COLLAPSED}px`,
      transition: theme.transitions.create(['margin', 'width'], {
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
        {isMobile && <Toolbar />}
        {children}
      </Box>
    </Box>
  )
})

Layout.propTypes = {
  children: PropTypes.node.isRequired
}

Layout.displayName = 'Layout'

export default Layout