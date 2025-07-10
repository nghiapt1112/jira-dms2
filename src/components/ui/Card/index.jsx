import React from 'react'
import PropTypes from 'prop-types'
import { Card as MuiCard, CardContent, CardActions, useTheme } from '@mui/material'

const Card = React.memo(({ children, actions, elevation = 1, sx, ...props }) => {
  const theme = useTheme()

  const cardSx = {
    width: '100%',
    p: 0,
    ...sx,
  }

  return (
    <MuiCard elevation={elevation} sx={cardSx} {...props}>
      <CardContent sx={{ p: 2 }}>
        {children}
      </CardContent>
      {actions && (
        <CardActions sx={{ p: 2, pt: 0 }}>
          {actions}
        </CardActions>
      )}
    </MuiCard>
  )
})

Card.propTypes = {
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  elevation: PropTypes.number,
  sx: PropTypes.object,
}

export default Card