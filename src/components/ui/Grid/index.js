import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Grid as MuiGrid } from '@mui/material'

const Grid = React.memo(({ children, spacing = { xs: 1, sm: 2, md: 3 }, ...props }) => {
  const spacingConfig = useMemo(() => spacing, [spacing])

  return (
    <MuiGrid
      container
      spacing={spacingConfig}
      {...props}
    >
      {children}
    </MuiGrid>
  )
})

Grid.propTypes = {
  children: PropTypes.node.isRequired,
  spacing: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.object,
  ]),
}

Grid.displayName = 'Grid'

export default Grid

export const GridItem = React.memo(({ children, xs = 12, sm, md, lg, xl, ...props }) => (
  <MuiGrid
    item
    xs={xs}
    sm={sm}
    md={md}
    lg={lg}
    xl={xl}
    {...props}
  >
    {children}
  </MuiGrid>
))

GridItem.propTypes = {
  children: PropTypes.node.isRequired,
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number,
  xl: PropTypes.number,
}

GridItem.displayName = 'GridItem'