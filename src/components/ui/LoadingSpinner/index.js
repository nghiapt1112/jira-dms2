import React from 'react'
import PropTypes from 'prop-types'
import { Box, CircularProgress, Typography } from '@mui/material'

const LoadingSpinner = React.memo(({ size = 40, message = 'Loading...', ...props }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        minHeight: 200,
      }}
      {...props}
    >
      <CircularProgress size={size} sx={{ mb: 2 }} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )
})

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  message: PropTypes.string,
}

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner