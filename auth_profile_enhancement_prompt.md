# Authentication & Profile Enhancement Prompt
## 🔐 Login System & Profile Management

Review, enhance, and implement authentication system following strict coding conventions.

## CONTEXT
- Follow .claude/conventions.md STRICTLY
- Follow .claude/project-context.md specifications
- Project: JIRA DMS React MUI SPA
- Focus: Authentication flow, JWT management, and profile UI

---

## 🎯 REQUIREMENTS TO IMPLEMENT

### **1. AUTHENTICATION SYSTEM**
- **Login Function**: Based on provided curl command
- **JWT Management**: Token storage, refresh, and validation
- **Profile Menu**: Dropdown with logout, settings, view details

### **2. NAVIGATION INTEGRATION**
- **Profile Icon**: Top-right corner of navigation
- **User Avatar**: Display user information
- **Dropdown Menu**: Accessible profile actions

### **3. SECURITY & ERROR HANDLING**
- **Token Interceptor**: Automatic JWT attachment
- **Auth Guards**: Route protection
- **Session Management**: Token expiration handling

---

## 🔗 **REAL API SPECIFICATIONS**

Based on your curl commands, implement these exact endpoints:

### **Login API**
```javascript
// EXACT API ENDPOINT from your curl
const LOGIN_ENDPOINT = 'https://6rornklpte.execute-api.ap-southeast-1.amazonaws.com/dev/api/auth/login'

// EXACT Request Payload
const loginPayload = {
  "username": "admin",
  "password": "password123"
}

// EXACT Headers Required
const headers = {
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'DNT': '1'
}
```

### **JWT Token Structure**
```javascript
// Based on your token, implement JWT handling for:
const jwtPayload = {
  "userId": "user_001",
  "role": "ADMIN", 
  "username": "admin",
  "iat": 1752121874,
  "exp": 1753849874
}
```

---

## 📁 REQUIRED FOLDER STRUCTURE

Generate/enhance this exact structure following conventions:

```
src/
├── features/
│   └── authentication/
│       ├── components/
│       │   ├── LoginForm/
│       │   │   ├── index.js
│       │   │   ├── LoginForm.js
│       │   │   ├── LoginForm.test.js
│       │   │   └── LoginFormStyles.js
│       │   ├── ProfileMenu/
│       │   │   ├── index.js
│       │   │   ├── ProfileMenu.js
│       │   │   ├── ProfileMenu.test.js
│       │   │   └── ProfileMenuStyles.js
│       │   └── ProtectedRoute/
│       │       ├── index.js
│       │       ├── ProtectedRoute.js
│       │       └── ProtectedRoute.test.js
│       ├── services/
│       │   ├── authService.js
│       │   ├── jwtService.js
│       │   └── authValidation.js
│       ├── store/
│       │   └── authStore.js
│       └── hooks/
│           ├── useAuth.js
│           ├── useLogin.js
│           └── useProfile.js
├── shared/
│   ├── services/
│   │   ├── axiosConfig.js (enhance existing)
│   │   └── apiService.js (enhance existing)
│   └── utils/
│       ├── tokenUtils.js
│       └── authUtils.js
└── pages/
    ├── LoginPage.js
    └── ProfilePage.js (placeholder)
```

---

## 🔐 AUTHENTICATION STORE SPECIFICATIONS

### **Auth Store (Zustand)**
```javascript
// REQUIRED: Implement exact auth store pattern
export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token, isAuthenticated: !!token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Clear auth state
  logout: () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_data')
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      error: null 
    })
  },
  
  // Initialize from localStorage
  initializeAuth: () => {
    const token = localStorage.getItem('jwt_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        set({ 
          token, 
          user, 
          isAuthenticated: true 
        })
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        get().logout()
      }
    }
  },
  
  // Async login action
  login: async (username, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(username, password)
      const { token, user } = response.data
      
      // Store in localStorage
      localStorage.setItem('jwt_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
      
      set({ 
        token, 
        user, 
        isAuthenticated: true, 
        isLoading: false 
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      set({ 
        error: errorMessage, 
        isLoading: false 
      })
      return { success: false, error: errorMessage }
    }
  }
}))
```

---

## 🔧 AUTH SERVICE SPECIFICATIONS

### **Auth Service (authService.js)**
```javascript
// REQUIRED: Implement exact API integration
import axios from '../shared/services/axiosConfig'

export const authService = {
  // Login function based on your curl
  login: async (username, password) => {
    const response = await axios.post('/auth/login', {
      username,
      password
    }, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'DNT': '1'
      }
    })
    return response
  },
  
  // Logout function
  logout: async () => {
    try {
      await axios.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage regardless
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('user_data')
    }
  },
  
  // Refresh token
  refreshToken: async () => {
    const response = await axios.post('/auth/refresh')
    return response.data
  },
  
  // Validate token
  validateToken: async (token) => {
    const response = await axios.get('/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },
  
  // Get user profile
  getProfile: async () => {
    const response = await axios.get('/auth/profile')
    return response.data
  }
}
```

### **JWT Service (jwtService.js)**
```javascript
// REQUIRED: Implement JWT utilities
export const jwtService = {
  // Decode JWT payload
  decodeToken: (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  },
  
  // Check if token is expired
  isTokenExpired: (token) => {
    const decoded = jwtService.decodeToken(token)
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Date.now() / 1000
    return decoded.exp < currentTime
  },
  
  // Get token expiration time
  getTokenExpiration: (token) => {
    const decoded = jwtService.decodeToken(token)
    return decoded?.exp ? new Date(decoded.exp * 1000) : null
  },
  
  // Extract user info from token
  getUserFromToken: (token) => {
    const decoded = jwtService.decodeToken(token)
    if (!decoded) return null
    
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    }
  }
}
```

---

## 🧭 PROFILE MENU SPECIFICATIONS

### **ProfileMenu Component**
```javascript
// REQUIRED: Implement exact profile menu
import React from 'react'
import PropTypes from 'prop-types'
import {
  Avatar,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box
} from '@mui/material'
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material'

const ProfileMenu = React.memo(({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  
  const handleClick = React.useCallback((event) => {
    setAnchorEl(event.currentTarget)
  }, [])
  
  const handleClose = React.useCallback(() => {
    setAnchorEl(null)
  }, [])
  
  const handleLogout = React.useCallback(() => {
    handleClose()
    onLogout()
  }, [onLogout, handleClose])
  
  const handleViewProfile = React.useCallback(() => {
    handleClose()
    // TODO: Navigate to profile page
    console.log('Navigate to profile page')
  }, [handleClose])
  
  const handleSettings = React.useCallback(() => {
    handleClose()
    // TODO: Navigate to settings page
    console.log('Navigate to settings page')
  }, [handleClose])
  
  return (
    <>
      <Button
        onClick={handleClick}
        sx={{
          minWidth: 'auto',
          borderRadius: '50%',
          p: 1,
          color: 'text.primary'
        }}
        aria-label="Profile menu"
      >
        <Avatar
          sx={{ 
            width: 32, 
            height: 32,
            backgroundColor: 'primary.main'
          }}
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </Avatar>
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {user?.username || 'Unknown User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role || 'User'}
          </Typography>
        </Box>
        
        <Divider />
        
        {/* Profile Actions */}
        <MenuItem onClick={handleViewProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
})

ProfileMenu.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    role: PropTypes.string,
    userId: PropTypes.string
  }),
  onLogout: PropTypes.func.isRequired
}

ProfileMenu.displayName = 'ProfileMenu'

export default ProfileMenu
```

---

## 🔒 ENHANCED AXIOS CONFIGURATION

### **Enhanced axiosConfig.js**
```javascript
// REQUIRED: Enhance existing axios config with auth
import axios from 'axios'
import { jwtService } from '../features/authentication/services/jwtService'

// Base configuration
const axiosInstance = axios.create({
  baseURL: 'https://6rornklpte.execute-api.ap-southeast-1.amazonaws.com/dev/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'DNT': '1'
  }
})

// Request interceptor - Add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token')
    
    if (token && !jwtService.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear auth state
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('user_data')
      
      // Redirect to login
      window.location.href = '/login'
      
      return Promise.reject(error)
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance
```

---

## 🎨 LOGIN FORM SPECIFICATIONS

### **LoginForm Component**
```javascript
// REQUIRED: Implement material design login form
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

const LoginForm = React.memo(({ onLogin, isLoading, error }) => {
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
```

---

## 🧪 TESTING REQUIREMENTS

### **Component Tests**
```javascript
// REQUIRED: Generate comprehensive tests
describe('Authentication System', () => {
  describe('LoginForm', () => {
    it('renders without crashing', () => {})
    it('validates required fields', () => {})
    it('submits form with correct data', () => {})
    it('shows loading state during submission', () => {})
    it('displays error messages', () => {})
    it('toggles password visibility', () => {})
  })
  
  describe('ProfileMenu', () => {
    it('renders user avatar and name', () => {})
    it('opens menu on click', () => {})
    it('calls logout function', () => {})
    it('shows profile options', () => {})
  })
  
  describe('AuthService', () => {
    it('makes login request with correct payload', () => {})
    it('handles login success', () => {})
    it('handles login failure', () => {})
    it('manages JWT tokens correctly', () => {})
  })
  
  describe('AuthStore', () => {
    it('initializes with correct default state', () => {})
    it('updates state on successful login', () => {})
    it('clears state on logout', () => {})
    it('handles authentication errors', () => {})
  })
})
```

---

## 📱 INTEGRATION WITH NAVIGATION

### **Navigation Bar Integration**
```javascript
// REQUIRED: Add ProfileMenu to existing Sidebar component
import ProfileMenu from '../../features/authentication/components/ProfileMenu'
import { useAuthStore } from '../../features/authentication/store/authStore'

// In your Sidebar component, add ProfileMenu to AppBar
<AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
  <Toolbar>
    <IconButton onClick={toggleSidebar}>
      <MenuIcon />
    </IconButton>
    
    <Typography variant="h6" sx={{ flexGrow: 1 }}>
      JIRA DMS
    </Typography>
    
    {/* Add ProfileMenu here */}
    <ProfileMenu 
      user={user} 
      onLogout={logout}
    />
  </Toolbar>
</AppBar>
```

---

## ✅ VALIDATION CHECKLIST

Verify implementation follows conventions:
- [ ] **Folder Structure**: Feature-based auth folder created
- [ ] **React.memo**: All components wrapped
- [ ] **PropTypes**: All props validated
- [ ] **Zustand Store**: Proper auth store pattern
- [ ] **JWT Handling**: Token decode, validation, expiration
- [ ] **Error Handling**: Network, auth, validation errors
- [ ] **Security**: Token storage, logout cleanup
- [ ] **MUI Components**: sx prop only, no style/className
- [ ] **Responsive Design**: Mobile-friendly login form
- [ ] **Testing**: Comprehensive test coverage
- [ ] **API Integration**: Exact curl command implementation
- [ ] **Profile Menu**: Dropdown with logout, settings, view details

---

## 🚀 GENERATION ORDER

Generate/enhance in this exact order:
1. **Auth Store** (Zustand with login/logout actions)
2. **JWT Service** (Token utilities and validation)
3. **Auth Service** (API integration with exact endpoints)
4. **Enhanced Axios Config** (JWT interceptor, error handling)
5. **LoginForm Component** (Material Design form)
6. **ProfileMenu Component** (Dropdown with actions)
7. **ProtectedRoute Component** (Route guard)
8. **Integration** (Add ProfileMenu to navigation)
9. **Tests** (Comprehensive coverage)
10. **Documentation** (Usage examples)

---

## 🎯 SUCCESS CRITERIA

Authentication system is complete when:
- Login form submits to exact API endpoint
- JWT token is stored and attached to requests
- ProfileMenu appears in navigation bar
- Dropdown shows logout, settings, view details options
- Logout clears all auth state
- Protected routes redirect unauthorized users
- Token expiration is handled gracefully
- All components follow MUI/React conventions
- Tests pass with good coverage

Generate: Complete authentication system following all conventions and specifications above.