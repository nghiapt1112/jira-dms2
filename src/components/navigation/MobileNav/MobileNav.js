import React from 'react'
import PropTypes from 'prop-types'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  useTheme
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material'
import { useNavigationStore } from '../../../shared/store/navigationStore'
import { useAuthStore } from '../../../features/authentication/store/authStore'
import ProfileMenu from '../../../features/authentication/components/ProfileMenu'

const MobileNav = React.memo(({ title = 'JIRA DMS' }) => {
  const theme = useTheme()
  const { openSidebar } = useNavigationStore()
  const { user, logout } = useAuthStore()
  
  const handleLogout = React.useCallback(async () => {
    await logout()
    // Navigation to login will be handled by the auth state change
  }, [logout])
  
  return (
    <AppBar
      position="fixed"
      sx={{
        display: { xs: 'block', md: 'none' },
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={openSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="large"
            aria-label="show notifications"
            color="inherit"
            sx={{ mr: 1 }}
          >
            <NotificationsIcon />
          </IconButton>
          
          <ProfileMenu
            user={user}
            onLogout={handleLogout}
          />
        </Box>
      </Toolbar>
    </AppBar>
  )
})

MobileNav.propTypes = {
  title: PropTypes.string
}

MobileNav.displayName = 'MobileNav'

export default MobileNav