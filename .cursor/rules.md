# Cursor AI Rules - React MUI Analytics Dashboard

## 🎯 Project Overview

This is a React SPA analytics dashboard with MUI components, focusing on performance and responsive design. The project uses Zustand for state management and MUI X Charts for data visualization.

## 📋 Tech Stack Requirements

- **React**: 18+ with hooks and functional components only
- **UI Library**: MUI v6 + MUI X Charts (NO other chart libraries)
- **State Management**: Zustand only (NO Redux, Context API)
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library
- **File Extensions**: `.jsx` for components, `.js` for utilities

## 🏗️ Architecture Patterns

### Folder Structure (STRICT)
```
src/
├── components/
│   ├── ui/[ComponentName]/           # Reusable UI components
│   │   ├── index.js                  # Export only
│   │   ├── ComponentName.jsx         # Main component
│   │   └── ComponentName.test.js     # Tests
│   └── charts/[ChartName]/           # Chart components
│       ├── index.js
│       ├── ChartName.jsx
│       └── ChartName.test.js
├── features/[feature-name]/          # Feature modules (kebab-case)
│   ├── components/                   # Feature-specific components
│   ├── hooks/                        # Feature hooks
│   ├── services/                     # API services
│   └── store/                        # Feature state
├── shared/                           # Global shared code
│   ├── components/                   # Global components
│   ├── hooks/                        # Global hooks
│   ├── services/                     # Global services
│   ├── store/                        # Global state
│   └── utils/                        # Utilities
├── theme/                            # MUI theme configuration
└── pages/                            # Page components
```

### Component Template (MANDATORY)
```javascript
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper } from '@mui/material'

const ComponentName = React.memo(({ 
  requiredProp, 
  optionalProp = 'default',
  ...props 
}) => {
  // 1. State hooks
  const [localState, setLocalState] = useState(null)
  
  // 2. External hooks
  const storeData = useStore(state => state.data)
  
  // 3. Memoized values
  const processedData = useMemo(() => {
    if (!requiredProp) return []
    return requiredProp.map(item => ({
      ...item,
      processed: true
    }))
  }, [requiredProp])
  
  // 4. Callbacks
  const handleClick = useCallback((event) => {
    // Handle click logic
  }, [])
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, [requiredProp])
  
  // 6. Early returns
  if (!requiredProp) {
    return <Typography>No data available</Typography>
  }
  
  // 7. Render
  return (
    <Box {...props}>
      <Typography variant="h6">{optionalProp}</Typography>
      {processedData.map(item => (
        <Paper key={item.id} sx={{ p: 2, mb: 1 }}>
          {item.name}
        </Paper>
      ))}
    </Box>
  )
})

ComponentName.propTypes = {
  requiredProp: PropTypes.arrayOf(PropTypes.object).isRequired,
  optionalProp: PropTypes.string,
}

export default ComponentName
```

### Zustand Store Pattern (MANDATORY)
```javascript
import { create } from 'zustand'

export const useFeatureStore = create((set, get) => ({
  // State
  data: [],
  isLoading: false,
  error: null,
  filters: {},
  
  // Computed values (getters)
  filteredData: () => {
    const { data, filters } = get()
    return data.filter(item => 
      Object.entries(filters).every(([key, value]) => 
        item[key] === value
      )
    )
  },
  
  // Actions
  setData: (data) => set({ data }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set({ filters }),
  
  // Async actions
  fetchData: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/data?${new URLSearchParams(params)}`)
      const data = await response.json()
      set({ data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Reset
  reset: () => set({ data: [], isLoading: false, error: null, filters: {} })
}))
```

### MUI Chart Component Pattern (MANDATORY)
```javascript
import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Paper, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'

const CustomLineChart = React.memo(({ 
  data, 
  title, 
  height = 400,
  ...props 
}) => {
  const chartConfig = useMemo(() => ({
    series: [{
      data: data.values,
      label: data.label,
      color: '#1976d2'
    }],
    xAxis: [{
      data: data.labels,
      scaleType: 'point'
    }]
  }), [data])
  
  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ height, width: '100%' }}>
        <LineChart
          series={chartConfig.series}
          xAxis={chartConfig.xAxis}
          height={height}
          margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
        />
      </Box>
    </Paper>
  )
})

CustomLineChart.propTypes = {
  data: PropTypes.shape({
    values: PropTypes.arrayOf(PropTypes.number).isRequired,
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    label: PropTypes.string.isRequired
  }).isRequired,
  title: PropTypes.string.isRequired,
  height: PropTypes.number
}

export default CustomLineChart
```

## 🎨 MUI Styling Guidelines

### Responsive Design Pattern
```javascript
// Mobile-first approach
<Box sx={{
  // Base (mobile)
  p: 1,
  fontSize: '0.875rem',
  
  // Small screens (600px+)
  [theme.breakpoints.up('sm')]: {
    p: 2,
    fontSize: '1rem',
  },
  
  // Medium screens (900px+)
  [theme.breakpoints.up('md')]: {
    p: 3,
    fontSize: '1.125rem',
  },
  
  // Large screens (1200px+)
  [theme.breakpoints.up('lg')]: {
    p: 4,
    fontSize: '1.25rem',
  }
}}>
```

### Grid Layout Pattern
```javascript
<Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
  <Grid item xs={12} sm={6} md={4}>
    <Paper sx={{ p: 2, height: '100%' }}>
      Content
    </Paper>
  </Grid>
</Grid>
```

### Theme Integration
```javascript
// Always use theme values
<Box sx={{
  backgroundColor: 'background.paper',
  color: 'text.primary',
  borderRadius: 1,
  border: '1px solid',
  borderColor: 'divider',
  p: theme => theme.spacing(2),
  mt: theme => theme.spacing(1)
}}>
```

## 🧪 Testing Requirements

### Component Test Template
```javascript
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../theme'
import ComponentName from './ComponentName'

const renderWithTheme = (component) => 
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)

describe('ComponentName', () => {
  const mockProps = {
    requiredProp: [{ id: 1, name: 'Test' }]
  }

  it('renders without crashing', () => {
    renderWithTheme(<ComponentName {...mockProps} />)
  })

  it('displays required content', () => {
    renderWithTheme(<ComponentName {...mockProps} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles user interactions', () => {
    const mockCallback = jest.fn()
    renderWithTheme(
      <ComponentName {...mockProps} onClick={mockCallback} />
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('handles edge cases', () => {
    renderWithTheme(<ComponentName requiredProp={[]} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })
})
```

### Store Test Template
```javascript
import { renderHook, act } from '@testing-library/react'
import { useFeatureStore } from './featureStore'

describe('useFeatureStore', () => {
  beforeEach(() => {
    useFeatureStore.getState().reset()
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useFeatureStore())
    
    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('updates state correctly', () => {
    const { result } = renderHook(() => useFeatureStore())
    
    act(() => {
      result.current.setData([{ id: 1, name: 'Test' }])
    })
    
    expect(result.current.data).toEqual([{ id: 1, name: 'Test' }])
  })
})
```

## 🚫 Forbidden Patterns

### ❌ NEVER DO THIS:
```javascript
// Wrong file extension
import Component from './Component.js' // Should be .jsx

// Wrong folder structure
import Button from '../../../ui/Button' // Max 2 levels up

// Missing React.memo
const Component = ({ prop }) => <div>{prop}</div>

// Missing PropTypes
const Component = React.memo(({ prop }) => <div>{prop}</div>)

// Using style prop
<Box style={{ padding: 16 }}>

// Using className
<Box className="my-class">

// Inline objects (no memoization)
<Component config={{ option: 'value' }} />

// Wrong state management
const [data, setData] = useContext(DataContext)

// Wrong nesting
<Paper>
  <Card>
    <CardContent>
      <Paper> // Card inside Paper is forbidden
```

### ✅ CORRECT PATTERNS:
```javascript
// Correct file extension
import Component from './Component.jsx'

// Correct folder structure
import Button from '../ui/Button'

// Always use React.memo
const Component = React.memo(({ prop }) => <div>{prop}</div>)

// Always include PropTypes
Component.propTypes = {
  prop: PropTypes.string.isRequired
}

// Use sx prop only
<Box sx={{ p: 2 }}>

// Memoize objects
const config = useMemo(() => ({ option: 'value' }), [])
<Component config={config} />

// Use Zustand
const data = useStore(state => state.data)

// Correct nesting
<Paper>
  <Box sx={{ p: 2 }}>
    <Typography>Content</Typography>
  </Box>
</Paper>
```

## 📝 Code Review Checklist

Before submitting any code, verify:

- [ ] **File Structure**: Correct folder placement and naming
- [ ] **Component**: Uses React.memo and PropTypes
- [ ] **Performance**: Memoized values and callbacks
- [ ] **Styling**: Only sx prop, no style/className
- [ ] **Responsive**: Mobile-first breakpoints
- [ ] **State**: Zustand for state management
- [ ] **Testing**: Component tests included
- [ ] **Imports**: Correct order and no deep nesting
- [ ] **Charts**: MUI X Charts only
- [ ] **Nesting**: Maximum 3 levels deep

## 🔧 Development Workflow

1. **Create Feature**: Start with folder structure
2. **Component**: Follow template pattern
3. **Store**: Use Zustand pattern
4. **Styling**: MUI sx prop only
5. **Testing**: Write tests immediately
6. **Performance**: Add memoization
7. **Review**: Check against forbidden patterns

## 🎯 Performance Optimization

### Always Use:
- `React.memo` for all components
- `useMemo` for expensive calculations
- `useCallback` for event handlers
- `useMemo` for object props

### Never Use:
- Inline objects in JSX
- Anonymous functions in JSX
- Direct mutations
- Unnecessary re-renders

Remember: This is a **STRICT RULEBOOK**. Any deviation from these patterns will result in code rejection. 