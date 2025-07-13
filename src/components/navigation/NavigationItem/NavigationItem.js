import React from 'react'
import PropTypes from 'prop-types'
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

const NavigationItem = React.memo(({ 
  item, 
  selected = false, 
  collapsed = false, 
  onItemClick,
  level = 0 
}) => {
  const navigate = useNavigate()
  const Icon = item.icon
  
  const handleClick = () => {
    if (item.path) {
      navigate(item.path)
    }
    if (onItemClick) {
      onItemClick(item)
    }
  }
  
  const listItemButton = (
    <ListItemButton
      selected={selected}
      onClick={handleClick}
      sx={{
        borderRadius: 1,
        mx: 1,
        my: 0.5,
        pl: level > 0 ? 4 : 2,
        minHeight: 48,
        justifyContent: collapsed ? 'center' : 'initial',
        px: 2.5,
        '&.Mui-selected': {
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
          '& .MuiListItemIcon-root': {
            color: 'inherit',
          },
        },
      }}
    >
      {Icon && (
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 0 : 3,
            justifyContent: 'center',
            color: 'inherit',
          }}
        >
          <Icon />
        </ListItemIcon>
      )}
      {!collapsed && (
        <ListItemText 
          primary={item.title} 
          primaryTypographyProps={{
            noWrap: true,
          }}
        />
      )}
    </ListItemButton>
  )
  
  if (collapsed && Icon) {
    return (
      <Tooltip title={item.title} placement="right">
        {listItemButton}
      </Tooltip>
    )
  }
  
  return listItemButton
})

NavigationItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    path: PropTypes.string,
    icon: PropTypes.elementType,
  }).isRequired,
  selected: PropTypes.bool,
  collapsed: PropTypes.bool,
  onItemClick: PropTypes.func,
  level: PropTypes.number,
}

NavigationItem.displayName = 'NavigationItem'

export default NavigationItem