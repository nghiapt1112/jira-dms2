# React MUI Coding Conventions & Rules
## 📋 Project Standards & Guidelines

> **IMPORTANT**: This document is a **MANDATORY** rulebook for all developers (human and AI) working on this project. Violations will result in code rejection.

---

## 🏗️ FOLDER STRUCTURE RULES

### ✅ MANDATORY Structure

```
src/
├── components/                 # ONLY reusable UI components
│   ├── ui/                    # Basic UI elements ONLY
│   │   ├── Button/
│   │   │   ├── index.js       # REQUIRED: Default export
│   │   │   ├── Button.js      # REQUIRED: Component logic
│   │   │   ├── Button.test.js # REQUIRED: Tests
│   │   │   └── Button.stories.js # OPTIONAL: Storybook
│   │   └── [ComponentName]/   # Follow same pattern
│   └── charts/                # Chart components ONLY
│       ├── LineChart/
│       ├── BarChart/
│       └── PieChart/
├── features/                  # Feature-specific code ONLY
│   ├── [feature-name]/        # kebab-case naming
│   │   ├── components/        # Feature components
│   │   ├── hooks/             # Feature hooks
│   │   ├── store/             # Feature state
│   │   ├── services/          # Feature APIs
│   │   └── index.js           # Feature exports
│   └── [another-feature]/
├── shared/                    # Global shared code
│   ├── store/                 # Global state ONLY
│   ├── hooks/                 # Global hooks ONLY
│   ├── services/              # Global APIs ONLY
│   ├── utils/                 # Utility functions ONLY
│   └── constants/             # Constants ONLY
├── theme/                     # MUI theme ONLY
│   ├── index.js               # Main theme
│   ├── palette.js             # Colors
│   └── components.js          # Component overrides
├── pages/                     # Page components ONLY
└── App.js                     # Root component
```

### ❌ FORBIDDEN Actions

- **NEVER** create files in wrong folders
- **NEVER** mix feature code with shared code
- **NEVER** put business logic in components folder
- **NEVER** create nested folders beyond 3 levels
- **NEVER** create files without proper naming convention

---

## 📁 FILE NAMING CONVENTIONS

### ✅ REQUIRED Naming Rules

| File Type | Convention | Example |
|-----------|------------|---------|
| **Components** | PascalCase | `LineChart.js` |
| **Hooks** | camelCase + "use" prefix | `useChartData.js` |
| **Stores** | camelCase + "Store" suffix | `chartStore.js` |
| **Services** | camelCase + "Service" suffix | `apiService.js` |
| **Utils** | camelCase | `formatData.js` |
| **Constants** | camelCase | `apiConstants.js` |
| **Pages** | PascalCase | `Dashboard.js` |
| **Features** | kebab-case | `user-management/` |
| **Tests** | [filename].test.js | `Button.test.js` |

### ❌ FORBIDDEN Naming

- **NO** snake_case: `user_service.js` ❌
- **NO** random names: `stuff.js` ❌
- **NO** abbreviations: `btn.js` ❌
- **NO** spaces: `my component.js` ❌

---

## 🔧 COMPONENT RULES

### ✅ REQUIRED Component Structure

```javascript
// MANDATORY: Every component must follow this exact pattern
import React from 'react'
import PropTypes from 'prop-types' // REQUIRED for all props
import { Box, Typography } from '@mui/material'

// REQUIRED: Use React.memo for ALL components
const ComponentName = React.memo(({ 
  prop1, 
  prop2 = 'defaultValue',
  onClick,
  children,
  ...props 
}) => {
  // REQUIRED: Destructure props at top
  // REQUIRED: Use hooks before any logic
  // REQUIRED: Use useMemo/useCallback for performance
  
  return (
    <Box {...props}>
      {children}
    </Box>
  )
})

// REQUIRED: PropTypes for ALL components
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
}

// REQUIRED: Display name for debugging
ComponentName.displayName = 'ComponentName'

export default ComponentName
```

### ❌ FORBIDDEN Component Patterns

- **NO** class components (use functional only)
- **NO** inline styles (use sx prop or theme)
- **NO** direct DOM manipulation
- **NO** components without React.memo
- **NO** props without PropTypes

---

## 🚀 STATE MANAGEMENT RULES

### ✅ REQUIRED Zustand Store Pattern

```javascript
// MANDATORY: All stores must follow this pattern
import { create } from 'zustand'

export const useStoreName = create((set, get) => ({
  // REQUIRED: State at top
  data: [],
  isLoading: false,
  error: null,
  
  // REQUIRED: Simple actions
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // REQUIRED: Reset function
  reset: () => set({ data: [], isLoading: false, error: null }),
  
  // REQUIRED: Async actions at bottom
  fetchData: async (endpoint) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      set({ data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  }
}))
```

### ❌ FORBIDDEN State Patterns

- **NO** Redux (use Zustand only)
- **NO** Context API for frequently changing data
- **NO** useState for global state
- **NO** direct state mutations
- **NO** stores without async error handling

---

## 🎨 MUI THEME RULES

### ✅ REQUIRED Theme Structure

```javascript
// MANDATORY: Theme must follow this structure
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  // REQUIRED: Minimal spacing
  spacing: 4,
  
  // REQUIRED: Palette structure
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  
  // REQUIRED: Component overrides for full-width
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 8,
          paddingRight: 8,
          maxWidth: '100% !important',
        },
      },
    },
  },
})

export default theme
```

### ❌ FORBIDDEN Theme Patterns

- **NO** inline theme objects
- **NO** CSS files for global styles
- **NO** styled-components
- **NO** custom CSS classes
- **NO** !important unless absolutely necessary

---

## 📊 CHART COMPONENT RULES

### ✅ REQUIRED Chart Pattern

```javascript
// MANDATORY: All charts must follow this pattern
import React from 'react'
import { LineChart } from '@mui/x-charts/LineChart'
import { Paper, Typography, Box } from '@mui/material'

const ChartComponent = React.memo(({ 
  data, 
  title, 
  height = 400,
  ...props 
}) => {
  // REQUIRED: Memoize chart data
  const chartData = useMemo(() => {
    return {
      series: data.series,
      xAxis: data.xAxis,
    }
  }, [data])
  
  // REQUIRED: Loading state
  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>
  }
  
  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height }}>
        <LineChart
          series={chartData.series}
          xAxis={chartData.xAxis}
          height={height}
          margin={{ left: 40, right: 40, top: 40, bottom: 40 }}
        />
      </Box>
    </Paper>
  )
})

export default ChartComponent
```

### ❌ FORBIDDEN Chart Patterns

- **NO** third-party chart libraries (use MUI X Charts only)
- **NO** charts without loading states
- **NO** charts without error handling
- **NO** hardcoded dimensions
- **NO** charts without memoization

---

## 🔗 IMPORT/EXPORT RULES

### ✅ REQUIRED Import Order

```javascript
// MANDATORY: Follow this exact import order
// 1. React imports
import React, { useState, useEffect } from 'react'

// 2. Third-party libraries
import { Box, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'

// 3. Internal imports (relative paths)
import { useChartStore } from '../../shared/store/chartStore'
import { formatData } from '../../shared/utils/formatData'
import Button from '../ui/Button'

// 4. Type imports (if using TypeScript)
import type { ChartData } from '../../types/chart'
```

### ✅ REQUIRED Export Pattern

```javascript
// MANDATORY: Use default exports for components
export default ComponentName

// MANDATORY: Use named exports for utilities
export { formatData, validateData }

// MANDATORY: Use index.js for clean imports
// src/components/ui/index.js
export { default as Button } from './Button'
export { default as Input } from './Input'
export { default as Card } from './Card'
```

### ❌ FORBIDDEN Import/Export Patterns

- **NO** wildcard imports: `import * as React from 'react'`
- **NO** default + named exports in same file
- **NO** circular dependencies
- **NO** relative imports going up more than 2 levels

---

## 🎯 PERFORMANCE RULES

### ✅ REQUIRED Performance Optimizations

```javascript
// MANDATORY: Use these hooks for performance
import { useCallback, useMemo, memo } from 'react'

const Component = memo(({ data, onUpdate }) => {
  // REQUIRED: Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, processed: true }))
  }, [data])
  
  // REQUIRED: Memoize callbacks
  const handleClick = useCallback((id) => {
    onUpdate(id)
  }, [onUpdate])
  
  // REQUIRED: Memoize static objects
  const chartConfig = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
  }), [])
  
  return <div>Component content</div>
})
```

### ❌ FORBIDDEN Performance Patterns

- **NO** components without React.memo
- **NO** inline functions in props
- **NO** creating objects in render
- **NO** useEffect without dependencies
- **NO** unnecessary re-renders

---

## 🔄 STATE MANAGEMENT BEST PRACTICES

### ✅ REQUIRED State Organization Rules

```javascript
// MANDATORY: State structure hierarchy
// 1. UI State (local) - useState
// 2. Feature State (feature-level) - Zustand
// 3. Global State (app-level) - Zustand
// 4. Server State (cached) - React Query/SWR

// GOOD: Local UI state
const [isOpen, setIsOpen] = useState(false)
const [inputValue, setInputValue] = useState('')

// GOOD: Feature state
const { chartData, setChartData } = useChartStore()

// GOOD: Global state
const { user, theme, setTheme } = useGlobalStore()
```

### ✅ REQUIRED State Naming Conventions

```javascript
// MANDATORY: State variable naming
const [isLoading, setIsLoading] = useState(false)    // Boolean: is/has/should prefix
const [userList, setUserList] = useState([])         // Array: plural or "List" suffix
const [userData, setUserData] = useState({})         // Object: descriptive noun
const [currentPage, setCurrentPage] = useState(1)    // Number: descriptive noun
const [errorMessage, setErrorMessage] = useState('') // String: descriptive noun

// MANDATORY: Store action naming
const useUserStore = create((set) => ({
  // State
  users: [],
  isLoading: false,
  error: null,
  
  // Actions - use verb prefixes
  fetchUsers: async () => {},     // fetch* for API calls
  addUser: (user) => {},          // add* for additions
  updateUser: (id, data) => {},   // update* for modifications
  deleteUser: (id) => {},         // delete* for removals
  setLoading: (loading) => {},    // set* for state updates
  clearError: () => {},           // clear* for resets
  resetStore: () => {},           // reset* for full resets
}))
```

### ✅ REQUIRED State Validation Rules

```javascript
// MANDATORY: Input validation in stores
const useFormStore = create((set, get) => ({
  formData: {
    email: '',
    password: '',
  },
  errors: {},
  
  // REQUIRED: Validate before setting state
  setEmail: (email) => {
    const errors = get().errors
    if (!email.includes('@')) {
      set({ errors: { ...errors, email: 'Invalid email format' } })
      return false
    }
    set({ 
      formData: { ...get().formData, email },
      errors: { ...errors, email: null }
    })
    return true
  },
  
  // REQUIRED: Batch state updates
  updateFormData: (data) => {
    set(state => ({
      formData: { ...state.formData, ...data }
    }))
  }
}))
```

### ✅ REQUIRED State Persistence Rules

```javascript
// MANDATORY: Use middleware for persistence
import { persist } from 'zustand/middleware'

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      toggleTheme: () => set(state => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
    }),
    {
      name: 'user-settings', // REQUIRED: unique name
      partialize: (state) => ({ // REQUIRED: only persist necessary data
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)
```

### ❌ FORBIDDEN State Patterns

- **NO** mutating state directly: `state.users.push(user)` ❌
- **NO** storing derived data: `calculatedTotal` ❌
- **NO** storing components in state ❌
- **NO** large objects in useState ❌
- **NO** state for server data without caching ❌

---

## 🎨 MUI ADVANCED RULES

### ✅ REQUIRED MUI Component Patterns

```javascript
// MANDATORY: Use sx prop for styling
// GOOD
<Box sx={{ 
  display: 'flex', 
  flexDirection: 'column',
  gap: 2,
  p: 2 
}}>
  <Typography variant="h6">Title</Typography>
</Box>

// BAD
<Box style={{ display: 'flex' }}>  // ❌ Don't use style prop
<Box className="custom-box">       // ❌ Don't use className
```

### ✅ REQUIRED MUI Theme Integration

```javascript
// MANDATORY: Use theme values in components
const CustomComponent = () => {
  const theme = useTheme()
  
  return (
    <Box sx={{
      backgroundColor: theme.palette.background.paper,  // GOOD: Use theme
      padding: theme.spacing(2),                        // GOOD: Use theme spacing
      [theme.breakpoints.down('md')]: {                // GOOD: Use theme breakpoints
        padding: theme.spacing(1),
      },
    }}>
      Content
    </Box>
  )
}
```

### ✅ REQUIRED MUI Responsive Patterns

```javascript
// MANDATORY: Use theme breakpoints
<Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    <Card />
  </Grid>
</Grid>

// MANDATORY: Use sx responsive syntax
<Typography sx={{
  fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
  textAlign: { xs: 'center', md: 'left' }
}}>
  Responsive Text
</Typography>
```

### ✅ REQUIRED MUI Performance Rules

```javascript
// MANDATORY: Optimize MUI components
import { styled } from '@mui/material/styles'

// GOOD: Use styled for complex styles
const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  transition: theme.transitions.create(['box-shadow']),
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}))

// GOOD: Memoize theme objects
const useStyles = () => {
  const theme = useTheme()
  
  return useMemo(() => ({
    container: {
      backgroundColor: theme.palette.background.paper,
      padding: theme.spacing(2),
    },
    title: {
      color: theme.palette.text.primary,
      marginBottom: theme.spacing(1),
    },
  }), [theme])
}
```

### ✅ REQUIRED MUI Accessibility Rules

```javascript
// MANDATORY: Include accessibility props
<Button
  variant="contained"
  color="primary"
  aria-label="Add new item"           // REQUIRED
  aria-describedby="add-help-text"    // REQUIRED if has description
  disabled={isLoading}
>
  {isLoading ? 'Adding...' : 'Add Item'}
</Button>

// MANDATORY: Use proper heading hierarchy
<Typography variant="h1" component="h1">Main Title</Typography>
<Typography variant="h2" component="h2">Section Title</Typography>
<Typography variant="h3" component="h3">Subsection Title</Typography>
```

### ✅ REQUIRED MUI Component Hierarchy Rules

```javascript
// MANDATORY: Understand component purposes
/*
Box      - Layout container, flexbox, spacing
Paper    - Elevated surface with shadow
Card     - Content container with predefined styling
Container - Page-level container with max-width
Grid     - Layout system for responsive design
Stack    - One-dimensional layout (vertical/horizontal)
*/

// GOOD: Proper nesting hierarchy
<Container maxWidth="xl">           {/* Page container */}
  <Grid container spacing={2}>      {/* Layout grid */}
    <Grid item xs={12} md={6}>      {/* Grid item */}
      <Paper elevation={2}>         {/* Surface */}
        <Card>                      {/* Content container */}
          <Box sx={{ p: 2 }}>       {/* Inner layout */}
            <Typography>Content</Typography>
          </Box>
        </Card>
      </Paper>
    </Grid>
  </Grid>
</Container>

// BAD: Unnecessary nesting
<Box>                               {/* ❌ Unnecessary wrapper */}
  <Paper>
    <Card>                          {/* ❌ Card inside Paper (redundant) */}
      <Box>                         {/* ❌ Unnecessary Box */}
        <Box>                       {/* ❌ Double Box nesting */}
          <Typography>Content</Typography>
        </Box>
      </Box>
    </Card>
  </Paper>
</Box>
```

### ✅ REQUIRED Component Selection Rules

```javascript
// MANDATORY: When to use each component

// 1. Use Box for: Layout, spacing, flexbox
<Box sx={{ display: 'flex', gap: 2, p: 2 }}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Box>

// 2. Use Paper for: Elevated surfaces, backgrounds
<Paper elevation={1} sx={{ p: 2 }}>
  <Typography>Elevated content</Typography>
</Paper>

// 3. Use Card for: Content cards with actions
<Card>
  <CardContent>
    <Typography>Card content</Typography>
  </CardContent>
  <CardActions>
    <Button>Action</Button>
  </CardActions>
</Card>

// 4. Use Container for: Page-level containers
<Container maxWidth="lg">
  <Typography>Page content</Typography>
</Container>

// 5. Use Grid for: Responsive layouts
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    <Paper>Item 1</Paper>
  </Grid>
  <Grid item xs={12} md={6}>
    <Paper>Item 2</Paper>
  </Grid>
</Grid>

// 6. Use Stack for: One-dimensional layouts
<Stack direction="row" spacing={2}>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Stack>
```

### ✅ REQUIRED Anti-Nesting Patterns

```javascript
// MANDATORY: Avoid these common nesting mistakes

// ❌ BAD: Card inside Paper (redundant elevation)
<Paper elevation={2}>
  <Card>                    // Both provide surface styling
    <Typography>Content</Typography>
  </Card>
</Paper>

// ✅ GOOD: Choose one based on need
<Card>                      // Use Card for content with actions
  <CardContent>
    <Typography>Content</Typography>
  </CardContent>
  <CardActions>
    <Button>Action</Button>
  </CardActions>
</Card>

// OR

<Paper elevation={2} sx={{ p: 2 }}>  // Use Paper for simple elevated surface
  <Typography>Content</Typography>
</Paper>

// ❌ BAD: Unnecessary Box nesting
<Box>
  <Box>
    <Box>
      <Typography>Over-nested content</Typography>
    </Box>
  </Box>
</Box>

// ✅ GOOD: Single Box with combined styling
<Box sx={{ 
  display: 'flex', 
  flexDirection: 'column', 
  gap: 2,
  p: 2 
}}>
  <Typography>Properly nested content</Typography>
</Box>

// ❌ BAD: Grid inside Grid unnecessarily
<Grid container>
  <Grid item xs={12}>
    <Grid container>        // Unnecessary nesting
      <Grid item xs={6}>
        <Paper>Content</Paper>
      </Grid>
    </Grid>
  </Grid>
</Grid>

// ✅ GOOD: Flatten grid structure
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    <Paper>Content</Paper>
  </Grid>
  <Grid item xs={12} md={6}>
    <Paper>Content</Paper>
  </Grid>
</Grid>
```

### ✅ REQUIRED Performance Optimization for Nesting

```javascript
// MANDATORY: Optimize nested components

// ❌ BAD: Multiple styled components
<Box sx={{ p: 2 }}>
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex' }}>
      <Typography>Content</Typography>
    </Box>
  </Box>
</Box>

// ✅ GOOD: Single component with combined styles
<Box sx={{ 
  p: 2,
  mb: 2,
  display: 'flex',
  '& .content': {
    // Nested styles if needed
  }
}}>
  <Typography className="content">Content</Typography>
</Box>

// ✅ GOOD: Use Stack for simple layouts
<Stack spacing={2} sx={{ p: 2 }}>
  <Typography>Item 1</Typography>
  <Typography>Item 2</Typography>
  <Typography>Item 3</Typography>
</Stack>
```

### ✅ REQUIRED Component Composition Rules

```javascript
// MANDATORY: Proper component composition

// Chart Container Pattern
const ChartContainer = ({ children, title, actions }) => (
  <Paper elevation={1} sx={{ height: '100%' }}>
    <Box sx={{ p: 2, pb: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{title}</Typography>
        {actions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {actions}
          </Box>
        )}
      </Stack>
    </Box>
    <Box sx={{ p: 2, pt: 1, height: 'calc(100% - 64px)' }}>
      {children}
    </Box>
  </Paper>
)

// Dashboard Layout Pattern
const DashboardLayout = ({ children }) => (
  <Container maxWidth="xl" sx={{ py: 2 }}>
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Container>
)

// Usage
<DashboardLayout>
  <Grid item xs={12} md={6}>
    <ChartContainer 
      title="Revenue Chart" 
      actions={<Button>Export</Button>}
    >
      <LineChart data={revenueData} />
    </ChartContainer>
  </Grid>
</DashboardLayout>
```

### ✅ REQUIRED Semantic Component Usage

```javascript
// MANDATORY: Use components for their semantic purpose

// ❌ BAD: Using Box for everything
<Box>
  <Box>Header</Box>
  <Box>
    <Box>Navigation</Box>
    <Box>Main Content</Box>
  </Box>
</Box>

// ✅ GOOD: Semantic HTML with MUI
<Box component="header">
  <Typography variant="h1">Header</Typography>
</Box>
<Box component="main">
  <Box component="nav">
    <Typography variant="h2">Navigation</Typography>
  </Box>
  <Box component="section">
    <Typography>Main Content</Typography>
  </Box>
</Box>

// ✅ GOOD: Use appropriate MUI components
<AppBar position="static">          {/* For headers */}
  <Toolbar>
    <Typography variant="h6">App Name</Typography>
  </Toolbar>
</AppBar>

<Drawer variant="permanent">        {/* For navigation */}
  <List>
    <ListItem>
      <ListItemText primary="Home" />
    </ListItem>
  </List>
</Drawer>
```

### ✅ REQUIRED Conditional Rendering Rules

```javascript
// MANDATORY: Avoid unnecessary wrappers in conditionals

// ❌ BAD: Unnecessary wrapper
<Box>
  {isLoading ? (
    <Box>                           // Unnecessary wrapper
      <CircularProgress />
    </Box>
  ) : (
    <Box>                           // Unnecessary wrapper
      <Typography>Content</Typography>
    </Box>
  )}
</Box>

// ✅ GOOD: Direct conditional rendering
<Box>
  {isLoading ? (
    <CircularProgress />
  ) : (
    <Typography>Content</Typography>
  )}
</Box>

// ✅ GOOD: Conditional wrapper only when needed
<Box>
  {isLoading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  ) : (
    <Stack spacing={2}>
      <Typography>Content</Typography>
      <Button>Action</Button>
    </Stack>
  )}
</Box>
```

### ✅ REQUIRED Nesting Depth Rules

```javascript
// MANDATORY: Maximum nesting depth = 3 levels

// ❌ BAD: Too deep nesting (4+ levels)
<Container>                         // Level 1
  <Box>                            // Level 2
    <Paper>                        // Level 3
      <Box>                        // Level 4 ❌
        <Card>                     // Level 5 ❌
          <Typography>Content</Typography>
        </Card>
      </Box>
    </Paper>
  </Box>
</Container>

// ✅ GOOD: Proper nesting (max 3 levels)
<Container>                         // Level 1
  <Grid container spacing={2}>      // Level 2
    <Grid item xs={12}>            // Level 3
      <Card>
        <CardContent>
          <Typography>Content</Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
</Container>

// ✅ GOOD: Use composition to reduce nesting
const ContentCard = ({ children }) => (
  <Card>
    <CardContent>
      {children}
    </CardContent>
  </Card>
)

// Usage - reduces nesting
<Container>
  <Grid container spacing={2}>
    <Grid item xs={12}>
      <ContentCard>
        <Typography>Content</Typography>
      </ContentCard>
    </Grid>
  </Grid>
</Container>
```

### ❌ FORBIDDEN MUI Nesting Patterns

- **NO** Card inside Paper (redundant elevation) ❌
- **NO** Box inside Box without purpose ❌
- **NO** Grid inside Grid unnecessarily ❌
- **NO** Container inside Container ❌
- **NO** More than 3 levels of nesting ❌
- **NO** Using Box when semantic HTML is better ❌
- **NO** Wrapping single elements unnecessarily ❌

### ❌ FORBIDDEN MUI Patterns

- **NO** inline styles: `style={{ color: 'red' }}` ❌
- **NO** CSS classes: `className="custom-style"` ❌
- **NO** hardcoded values: `padding: 16` ❌
- **NO** !important unless absolutely necessary ❌
- **NO** non-MUI components for UI elements ❌

---

## 📱 RESPONSIVE DESIGN RULES

### ✅ REQUIRED Breakpoint Usage

```javascript
// MANDATORY: Use MUI breakpoints only
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,      // Mobile
      sm: 600,    // Tablet
      md: 900,    // Desktop
      lg: 1200,   // Large Desktop
      xl: 1536,   // Extra Large
    },
  },
})

// MANDATORY: Mobile-first approach
<Box sx={{
  // Mobile (xs) - default
  padding: 1,
  fontSize: '0.875rem',
  
  // Tablet (sm) and up
  [theme.breakpoints.up('sm')]: {
    padding: 2,
    fontSize: '1rem',
  },
  
  // Desktop (md) and up
  [theme.breakpoints.up('md')]: {
    padding: 3,
    fontSize: '1.125rem',
  },
}}>
```

### ✅ REQUIRED Layout Patterns

```javascript
// MANDATORY: Responsive grid system
<Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
  <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
    <Grid item xs={12} sm={6} md={4}>
      <Card />
    </Grid>
    <Grid item xs={12} sm={6} md={8}>
      <Card />
    </Grid>
  </Grid>
</Container>

// MANDATORY: Responsive typography
<Typography 
  variant="h1" 
  sx={{
    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
    lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
    textAlign: { xs: 'center', md: 'left' }
  }}
>
  Responsive Heading
</Typography>
```

### ✅ REQUIRED Media Query Rules

```javascript
// MANDATORY: Use theme breakpoints in useMediaQuery
import { useMediaQuery } from '@mui/material'

const ResponsiveComponent = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  
  return (
    <Box>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </Box>
  )
}
```

### ✅ REQUIRED Chart Responsiveness

```javascript
// MANDATORY: Responsive chart configuration
const ResponsiveChart = ({ data }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const chartConfig = useMemo(() => ({
    height: isMobile ? 300 : 400,
    margin: isMobile 
      ? { top: 20, right: 20, bottom: 20, left: 20 }
      : { top: 40, right: 40, bottom: 40, left: 40 },
    legend: { position: isMobile ? 'bottom' : 'right' },
  }), [isMobile])
  
  return (
    <Paper sx={{ p: { xs: 1, sm: 2 }, width: '100%' }}>
      <LineChart {...chartConfig} data={data} />
    </Paper>
  )
}
```

### ❌ FORBIDDEN Responsive Patterns

- **NO** hardcoded breakpoints: `@media (max-width: 768px)` ❌
- **NO** pixel values without theme: `padding: 16px` ❌
- **NO** non-responsive components ❌
- **NO** horizontal scrolling on mobile ❌
- **NO** fixed heights without responsive consideration ❌

---

## ⚛️ REACTJS FUNDAMENTAL RULES

### ✅ REQUIRED React Patterns

```javascript
// MANDATORY: Component structure
const ComponentName = React.memo(({ 
  prop1, 
  prop2 = 'default',
  children,
  ...props 
}) => {
  // 1. REQUIRED: Hooks at top (order matters)
  const [state, setState] = useState(initialValue)
  const theme = useTheme()
  const dispatch = useDispatch()
  
  // 2. REQUIRED: Memoized values
  const memoizedValue = useMemo(() => {
    return expensiveCalculation(prop1)
  }, [prop1])
  
  // 3. REQUIRED: Memoized callbacks
  const handleClick = useCallback((event) => {
    // Handle click
  }, [])
  
  // 4. REQUIRED: Effects at bottom
  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    }
  }, [])
  
  // 5. REQUIRED: Early returns
  if (!prop1) return null
  
  // 6. REQUIRED: Main render
  return (
    <div {...props}>
      {children}
    </div>
  )
})
```

### ✅ REQUIRED Hook Rules

```javascript
// MANDATORY: Custom hook patterns
const useCustomHook = (dependency) => {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // REQUIRED: Memoize return value
  const value = useMemo(() => ({
    state,
    loading,
    error,
    refresh: () => {
      // Refresh logic
    }
  }), [state, loading, error])
  
  useEffect(() => {
    // Hook logic
  }, [dependency])
  
  return value
}
```

### ✅ REQUIRED Error Handling Rules

```javascript
// MANDATORY: Error boundary for each feature
class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Feature Error:', error, errorInfo)
    // Log to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          <AlertTitle>Something went wrong</AlertTitle>
          Please refresh the page or contact support.
        </Alert>
      )
    }
    return this.props.children
  }
}

// MANDATORY: Async error handling
const AsyncComponent = () => {
  const [error, setError] = useState(null)
  
  const handleAsync = async () => {
    try {
      setError(null)
      await riskyOperation()
    } catch (err) {
      setError(err.message)
      console.error('Async error:', err)
    }
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>
  }
  
  return <div>Component content</div>
}
```

### ✅ REQUIRED Lifecycle Management

```javascript
// MANDATORY: Proper cleanup
const ComponentWithCleanup = () => {
  useEffect(() => {
    const subscription = subscribe()
    const timer = setInterval(() => {}, 1000)
    const listener = addEventListener('resize', handler)
    
    // REQUIRED: Cleanup function
    return () => {
      subscription.unsubscribe()
      clearInterval(timer)
      removeEventListener('resize', handler)
    }
  }, [])
  
  return <div>Component</div>
}
```

### ✅ REQUIRED Prop Validation

```javascript
// MANDATORY: Comprehensive PropTypes
import PropTypes from 'prop-types'

Component.propTypes = {
  // Required props
  id: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  
  // Optional props with defaults
  title: PropTypes.string,
  isLoading: PropTypes.bool,
  
  // Complex props
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
  }),
  
  // Function props
  onUpdate: PropTypes.func,
  onClick: PropTypes.func,
  
  // Array of specific types
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })),
  
  // One of specific values
  status: PropTypes.oneOf(['loading', 'success', 'error']),
  
  // Custom validation
  customProp: (props, propName, componentName) => {
    if (props[propName] && props[propName].length < 3) {
      return new Error(
        `Invalid prop \`${propName}\` of length ${props[propName].length} ` +
        `supplied to \`${componentName}\`, expected length >= 3.`
      )
    }
  },
}
```

### ❌ FORBIDDEN React Patterns

- **NO** class components (use functional only) ❌
- **NO** direct DOM manipulation ❌
- **NO** mutating props or state directly ❌
- **NO** using index as key in dynamic lists ❌
- **NO** useEffect without cleanup ❌
- **NO** components without PropTypes ❌
- **NO** inline object/array creation in props ❌

---

## 🧪 TESTING RULES

### ✅ REQUIRED Test Structure

```javascript
// MANDATORY: Every component must have tests
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../theme'
import ComponentName from './ComponentName'

// REQUIRED: Wrapper for theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('ComponentName', () => {
  // REQUIRED: Basic render test
  it('renders without crashing', () => {
    renderWithTheme(<ComponentName />)
  })
  
  // REQUIRED: Props test
  it('displays correct props', () => {
    renderWithTheme(<ComponentName title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  // REQUIRED: Interaction test
  it('handles click events', () => {
    const mockClick = jest.fn()
    renderWithTheme(<ComponentName onClick={mockClick} />)
    // Test click interaction
  })
})
```

### ❌ FORBIDDEN Test Patterns

- **NO** components without tests
- **NO** snapshot tests only
- **NO** testing implementation details
- **NO** tests without proper assertions

---

## 🔍 CODE REVIEW CHECKLIST

### ✅ REQUIRED Before Code Submission

- [ ] **Folder structure** follows exact pattern
- [ ] **File naming** follows conventions
- [ ] **Components** use React.memo
- [ ] **Props** have PropTypes
- [ ] **State** uses Zustand pattern
- [ ] **Performance** optimizations applied
- [ ] **Tests** written and passing
- [ ] **Imports** follow order rules
- [ ] **No forbidden patterns** used
- [ ] **MUI theme** properly used

### ❌ AUTOMATIC REJECTION Criteria

- Using wrong folder structure
- Missing PropTypes
- Not using React.memo
- Creating CSS files
- Using forbidden libraries
- Missing tests
- Wrong naming conventions
- Performance violations

---

## 🤖 AI AGENT INSTRUCTIONS

### For AI Developers/Assistants:

1. **ALWAYS** check this document before writing code
2. **NEVER** deviate from the structure rules
3. **ALWAYS** use the required patterns shown
4. **NEVER** suggest forbidden approaches
5. **ALWAYS** include PropTypes and React.memo
6. **NEVER** create files without proper naming
7. **ALWAYS** ask if unsure about placement
8. **NEVER** mix concerns between folders

### Quick AI Validation Commands:

```bash
# Check if following structure
ls -la src/components/ui/
ls -la src/features/
ls -la src/shared/

# Check naming conventions
find src/ -name "*.js" | grep -E "(snake_case|UPPERCASE)"

# Check for forbidden patterns
grep -r "class extends" src/
grep -r "styled-components" src/
```

---

## 📞 ENFORCEMENT

### Violations Will Result In:
- **Code rejection** in reviews
- **Immediate refactoring** required
- **Team discussion** for repeated violations
- **Documentation update** if rules need clarification

### Questions?
1. Check this document first
2. Ask team lead for clarification
3. Update document if needed
4. Communicate changes to all team members

---

## 🔄 DOCUMENT UPDATES

**Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Schedule regular reviews]

**Remember**: This document is **LIVING** - update as project evolves, but maintain consistency!