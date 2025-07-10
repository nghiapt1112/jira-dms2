export const findActiveMenuItem = (menuItems, pathname) => {
  for (const item of menuItems) {
    if (item.path === pathname) {
      return item
    }
    
    if (item.children) {
      const childMatch = findActiveMenuItem(item.children, pathname)
      if (childMatch) {
        return childMatch
      }
    }
  }
  
  return null
}

export const findParentMenuItem = (menuItems, childId) => {
  for (const item of menuItems) {
    if (item.children) {
      const hasChild = item.children.some(child => child.id === childId)
      if (hasChild) {
        return item
      }
    }
  }
  
  return null
}

export const getFlatMenuItems = (menuItems, result = []) => {
  menuItems.forEach(item => {
    result.push(item)
    if (item.children) {
      getFlatMenuItems(item.children, result)
    }
  })
  
  return result
}

export const getPathsFromMenu = (menuItems) => {
  const paths = []
  
  const extractPaths = (items) => {
    items.forEach(item => {
      if (item.path) {
        paths.push(item.path)
      }
      if (item.children) {
        extractPaths(item.children)
      }
    })
  }
  
  extractPaths(menuItems)
  return paths
}

export const getBreadcrumbs = (menuItems, pathname) => {
  const breadcrumbs = []
  
  const findPath = (items, currentPath = []) => {
    for (const item of items) {
      const newPath = [...currentPath, item]
      
      if (item.path === pathname) {
        breadcrumbs.push(...newPath)
        return true
      }
      
      if (item.children) {
        if (findPath(item.children, newPath)) {
          return true
        }
      }
    }
    
    return false
  }
  
  findPath(menuItems)
  return breadcrumbs
}

export const isPathActive = (itemPath, currentPath) => {
  if (!itemPath || !currentPath) return false
  
  if (itemPath === currentPath) return true
  
  if (itemPath === '/' || itemPath === '') return false
  
  return currentPath.startsWith(itemPath + '/') || currentPath === itemPath
}

export const getMenuItemByPath = (menuItems, path) => {
  return getFlatMenuItems(menuItems).find(item => item.path === path)
}