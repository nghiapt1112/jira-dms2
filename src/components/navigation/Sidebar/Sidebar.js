import React, { useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Collapse,
  useTheme,
  useMediaQuery,
  Tooltip,
  Typography
} from '@mui/material'
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material'
import { useNavigationStore } from '../../../shared/store/navigationStore'
import { getSidebarStyles, SIDEBAR_WIDTHS } from './SidebarStyles'
import { useLocation, useNavigate } from 'react-router-dom'

const NAVIGATION_MENU = [
  {
    id: 'dashboards',
    title: 'Dashboards',
    icon: DashboardIcon,
    children: [
      { id: 'main-dashboard', title: 'Main Dashboard', path: '/main-dashboard' },
      { id: 'quality-dashboard', title: 'Quality Dashboard', path: '/quality-dashboard' }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: AnalyticsIcon,
    children: [
      { id: 'developer-metrics', title: 'Developer Metrics', path: '/analytics/developers' },
      { id: 'qa-metrics', title: 'QA Metrics', path: '/analytics/qa' }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: AssessmentIcon,
    children: [
      { id: 'sprint-reports', title: 'Sprint Reports', path: '/reports/sprints' },
      { id: 'project-reports', title: 'Project Reports', path: '/reports/projects' }
    ]
  },
  {
    id: 'administration',
    title: 'Administration',
    icon: SettingsIcon,
    children: [
      { id: 'user-management', title: 'User Management', path: '/admin/users' },
      { id: 'system-settings', title: 'System Settings', path: '/admin/settings' }
    ]
  }
]

const Sidebar = React.memo(({ onDrawerToggle }) => {
  const theme = useTheme()
  const styles = getSidebarStyles(theme)
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const {
    isOpen,
    activeItem,
    toggleSidebar,
    setActiveItem,
    setMobile,
    closeSidebar
  } = useNavigationStore()
  
  const [expandedItems, setExpandedItems] = useState({})
  
  useEffect(() => {
    setMobile(isMobile)
  }, [isMobile, setMobile])
  
  useEffect(() => {
    const currentPath = location.pathname
    NAVIGATION_MENU.forEach(menu => {
      const childMatch = menu.children.find(child => child.path === currentPath)
      if (childMatch) {
        setActiveItem(childMatch.id)
        setExpandedItems(prev => ({ ...prev, [menu.id]: true }))
      }
    })
  }, [location.pathname, setActiveItem])
  
  const handleItemClick = useCallback((item, parentId) => {
    if (item.path) {
      navigate(item.path)
      setActiveItem(item.id)
      if (isMobile) {
        closeSidebar()
      }
    } else if (parentId) {
      setExpandedItems(prev => ({
        ...prev,
        [parentId]: !prev[parentId]
      }))
    }
  }, [navigate, setActiveItem, isMobile, closeSidebar])
  
  const handleToggle = useCallback(() => {
    if (onDrawerToggle) {
      onDrawerToggle()
    }
    toggleSidebar()
  }, [onDrawerToggle, toggleSidebar])
  
  const renderNavItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems[item.id]
    const isActive = activeItem === item.id
    const Icon = item.icon
    
    const listItemButton = (
      <ListItemButton
        selected={isActive}
        onClick={() => handleItemClick(item, hasChildren ? item.id : null)}
        sx={{
          ...styles.listItem,
          pl: level > 0 ? 4 : 2,
        }}
      >
        {Icon && (
          <ListItemIcon sx={styles.listItemIcon}>
            <Icon />
          </ListItemIcon>
        )}
        {isOpen && (
          <>
            <ListItemText primary={item.title} />
            {hasChildren && (
              <ChevronRightIcon
                sx={{
                  ...styles.collapseIcon,
                  ...(isExpanded && styles.collapseIconOpen)
                }}
              />
            )}
          </>
        )}
      </ListItemButton>
    )

    return (
      <React.Fragment key={item.id}>
        {!isOpen && !isMobile ? (
          <Tooltip title={item.title} placement="right">
            {listItemButton}
          </Tooltip>
        ) : (
          listItemButton
        )}
        
        {hasChildren && (
          <Collapse in={isExpanded && isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }
  
  const drawerContent = (
    <>
      <Box sx={styles.toolbar}>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {isOpen ? 'JIRA DMS' : ''}
        </Typography>
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          onClick={handleToggle}
          edge="end"
          sx={styles.toggleButton}
        >
          {isOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      
      <List sx={styles.menuList}>
        {NAVIGATION_MENU.map(item => renderNavItem(item))}
      </List>
    </>
  )
  
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={isOpen}
        onClose={closeSidebar}
        sx={{
          ...styles.drawer,
          ...styles.drawerMobile
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawerContent}
      </Drawer>
    )
  }
  
  return (
    <Drawer
      variant="permanent"
      open={isOpen}
      sx={{
        ...styles.drawer,
        ...(!isOpen && styles.drawerCollapsed)
      }}
    >
      {drawerContent}
    </Drawer>
  )
})

Sidebar.propTypes = {
  onDrawerToggle: PropTypes.func
}

Sidebar.displayName = 'Sidebar'

export default Sidebar