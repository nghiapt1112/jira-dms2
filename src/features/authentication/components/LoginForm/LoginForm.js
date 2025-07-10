import React from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon
} from '@mui/icons-material'

const LoginForm = React.memo(({ onLogin, isLoading = false, error = null }) => {
  const [formData, setFormData] = React.useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const [validationErrors, setValidationErrors] = React.useState({})
  
  const handleInputChange = React.useCallback((event) => {
    const { name, value } = event.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }, [validationErrors])
  
  const handleTogglePassword = React.useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])
  
  const validateForm = React.useCallback(() => {
    const errors = {}
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])
  
  const handleSubmit = React.useCallback((event) => {
    event.preventDefault()
    
    if (validateForm()) {
      onLogin(formData.username, formData.password)
    }
  }, [formData, validateForm, onLogin])
  
  return (
    <Card 
      elevation={3}
      sx={{ 
        maxWidth: 400, 
        mx: 'auto', 
        mt: 8,
        borderRadius: 2
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          textAlign="center"
          color="primary"
          fontWeight="bold"
        >
          JIRA DMS
        </Typography>
        
        <Typography 
          variant="body1" 
          textAlign="center" 
          color="text.secondary" 
          mb={3}
        >
          Sign in to your account
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            name="username"
            label="Username"
            type="text"
            fullWidth
            margin="normal"
            value={formData.username}
            onChange={handleInputChange}
            error={!!validationErrors.username}
            helperText={validationErrors.username}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
            autoComplete="username"
            autoFocus
          />
          
          <TextField
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleInputChange}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePassword}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            autoComplete="current-password"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ 
              mt: 3, 
              mb: 2,
              height: 48,
              borderRadius: 2
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
})

LoginForm.propTypes = {
  onLogin: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string
}


LoginForm.displayName = 'LoginForm'

export default LoginForm