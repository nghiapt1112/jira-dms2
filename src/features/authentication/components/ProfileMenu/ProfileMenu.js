import React from 'react'
import PropTypes from 'prop-types'
import {
  Avatar,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box
} from '@mui/material'
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const ProfileMenu = React.memo(({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const navigate = useNavigate()
  const open = Boolean(anchorEl)
  
  const handleClick = React.useCallback((event) => {
    setAnchorEl(event.currentTarget)
  }, [])
  
  const handleClose = React.useCallback(() => {
    setAnchorEl(null)
  }, [])
  
  const handleLogout = React.useCallback(() => {
    handleClose()
    onLogout()
  }, [onLogout, handleClose])
  
  const handleViewProfile = React.useCallback(() => {
    handleClose()
    navigate('/profile')
  }, [handleClose, navigate])
  
  const handleSettings = React.useCallback(() => {
    handleClose()
    navigate('/settings')
  }, [handleClose, navigate])
  
  const getUserInitial = React.useCallback(() => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase()
    }
    return 'U'
  }, [user])
  
  const getUserDisplayName = React.useCallback(() => {
    return user?.username || 'Unknown User'
  }, [user])
  
  const getUserRole = React.useCallback(() => {
    return user?.role || 'User'
  }, [user])
  
  return (
    <>
      <Button
        onClick={handleClick}
        sx={{
          minWidth: 'auto',
          borderRadius: '50%',
          p: 1,
          color: 'text.primary'
        }}
        aria-label="Profile menu"
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{ 
            width: 32, 
            height: 32,
            backgroundColor: 'primary.main',
            fontSize: '0.875rem'
          }}
        >
          {getUserInitial()}
        </Avatar>
      </Button>
      
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{ 
                width: 40, 
                height: 40,
                backgroundColor: 'primary.main',
                mr: 2
              }}
            >
              {getUserInitial()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {getUserDisplayName()}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {getUserRole()}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Divider />
        
        {/* Profile Actions */}
        <MenuItem 
          onClick={handleViewProfile}
          sx={{ py: 1 }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={handleSettings}
          sx={{ py: 1 }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleLogout} 
          sx={{ 
            py: 1,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.lighter'
            }
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
})

ProfileMenu.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    role: PropTypes.string,
    userId: PropTypes.string
  }),
  onLogout: PropTypes.func.isRequired
}

ProfileMenu.displayName = 'ProfileMenu'

export default ProfileMenu