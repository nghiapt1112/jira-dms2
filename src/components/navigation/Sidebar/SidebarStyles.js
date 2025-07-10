export const SIDEBAR_WIDTHS = {
  EXPANDED: 280,
  COLLAPSED: 64,
  MOBILE: 280
}

export const SIDEBAR_STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  MOBILE_OVERLAY: 'overlay'
}

export const getSidebarStyles = (theme) => ({
  drawer: {
    width: SIDEBAR_WIDTHS.EXPANDED,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: SIDEBAR_WIDTHS.EXPANDED,
      boxSizing: 'border-box',
      backgroundColor: theme.palette.background.paper,
      borderRight: '1px solid',
      borderColor: theme.palette.divider,
      transition: theme.transitions.create(['width', 'transform'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
  },
  drawerCollapsed: {
    width: SIDEBAR_WIDTHS.COLLAPSED,
    '& .MuiDrawer-paper': {
      width: SIDEBAR_WIDTHS.COLLAPSED,
      overflowX: 'hidden',
    },
  },
  drawerMobile: {
    '& .MuiDrawer-paper': {
      width: SIDEBAR_WIDTHS.MOBILE,
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    ...theme.mixins.toolbar,
  },
  toggleButton: {
    marginLeft: 'auto',
  },
  menuList: {
    padding: theme.spacing(1),
  },
  listItem: {
    borderRadius: theme.spacing(1),
    margin: theme.spacing(0.5, 1),
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.contrastText,
      },
    },
  },
  listItemIcon: {
    minWidth: 40,
    color: theme.palette.text.secondary,
  },
  nestedListItem: {
    paddingLeft: theme.spacing(4),
  },
  collapseIcon: {
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  collapseIconOpen: {
    transform: 'rotate(90deg)',
  },
})