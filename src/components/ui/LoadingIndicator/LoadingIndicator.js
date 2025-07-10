import React from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Backdrop
} from '@mui/material'

const LoadingIndicator = React.memo(({ 
  type = 'circular',
  overlay = false,
  progress = null,
  message = 'Loading...',
  size = 40,
  thickness = 4
}) => {
  const renderProgress = () => {
    if (type === 'linear') {
      return (
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant={progress !== null ? 'determinate' : 'indeterminate'}
            value={progress}
          />
          {progress !== null && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {`${Math.round(progress)}%`}
            </Typography>
          )}
        </Box>
      )
    }
    
    return (
      <CircularProgress
        size={size}
        thickness={thickness}
        variant={progress !== null ? 'determinate' : 'indeterminate'}
        value={progress}
      />
    )
  }
  
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
      }}
    >
      {renderProgress()}
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )
  
  if (overlay) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
        open={true}
      >
        {content}
      </Backdrop>
    )
  }
  
  return content
})

LoadingIndicator.propTypes = {
  type: PropTypes.oneOf(['circular', 'linear']),
  overlay: PropTypes.bool,
  progress: PropTypes.number,
  message: PropTypes.string,
  size: PropTypes.number,
  thickness: PropTypes.number,
}

LoadingIndicator.displayName = 'LoadingIndicator'

export default LoadingIndicator