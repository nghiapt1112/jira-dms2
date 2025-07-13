import React from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography, Button, Alert, Collapse } from '@mui/material'
import { ErrorOutline, Refresh, ExpandMore, ExpandLess } from '@mui/icons-material'
import { performanceMonitor } from '../../utils/PerformanceMonitor'

class DeveloperQualityErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
      lastErrorTime: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Developer Quality Dashboard Error:', error, errorInfo)
    
    // Record error in performance monitor
    performanceMonitor.recordMetric('errorOccurred', 1)
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1
    })
    
    // Call error callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    const now = Date.now()
    const timeSinceLastError = now - (this.state.lastErrorTime || 0)
    
    // Prevent rapid retries
    if (timeSinceLastError < 5000) {
      console.warn('Retry attempted too soon, please wait')
      return
    }
    
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      lastErrorTime: null
    })
    
    // Record retry attempt
    performanceMonitor.recordMetric('errorRetry', 1)
    
    // Call retry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  handleToggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails
    }))
  }

  renderFallbackUI() {
    const { error, errorInfo, showDetails, retryCount } = this.state
    const { fallbackMessage, allowRetry = true, maxRetries = 3 } = this.props
    
    const canRetry = allowRetry && retryCount < maxRetries
    
    return (
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 2, sm: 3 },
          m: { xs: 1, sm: 2 },
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'error.light'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          color: 'error.main'
        }}>
          <ErrorOutline sx={{ mr: 1, fontSize: '2rem' }} />
          <Typography variant="h6" color="error.main">
            Dashboard Error
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {fallbackMessage || 'An error occurred while loading the Developer Quality Dashboard. This might be due to data processing issues or network problems.'}
        </Typography>
        
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {error?.message || 'Unknown error occurred'}
          </Typography>
        </Alert>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          alignItems: 'center',
          mb: 2
        }}>
          {canRetry && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Refresh />}
              onClick={this.handleRetry}
              sx={{ minWidth: 120 }}
            >
              Retry ({maxRetries - retryCount} left)
            </Button>
          )}
          
          {retryCount >= maxRetries && (
            <Typography variant="body2" color="text.secondary">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </Typography>
          )}
          
          <Button
            variant="outlined"
            size="small"
            onClick={this.handleToggleDetails}
            endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </Box>
        
        <Collapse in={showDetails}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Error Details:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ 
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {error?.stack || 'No stack trace available'}
            </Typography>
            
            {errorInfo?.componentStack && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                  Component Stack:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {errorInfo.componentStack}
                </Typography>
              </>
            )}
          </Alert>
        </Collapse>
        
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          backgroundColor: 'background.default',
          borderRadius: 1
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Troubleshooting Tips:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Check your network connection</li>
            <li>Verify that data is available and properly formatted</li>
            <li>Try refreshing the page</li>
            <li>Clear browser cache if the problem persists</li>
            <li>Contact support if the issue continues</li>
          </Typography>
        </Box>
      </Paper>
    )
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI()
    }

    return this.props.children
  }
}

// ✅ REQUIRED: PropTypes
DeveloperQualityErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackMessage: PropTypes.string,
  onError: PropTypes.func,
  onRetry: PropTypes.func,
  allowRetry: PropTypes.bool,
  maxRetries: PropTypes.number
}

export default DeveloperQualityErrorBoundary 