# Observable Patterns & Decisions

## Patterns I Can See in the Code

### State Management Pattern
- **Pattern**: Each feature has its own Zustand store
- **Example**: `features/[feature]/store/[feature]Store.js`
- **Observable Benefits**: Feature isolation, easy testing
- **Follows Convention**: Yes/No

### API/Service Pattern  
- **Pattern**: [Describe how API calls are structured]
- **Example**: `features/[feature]/services/[service].js`
- **Common Methods**: fetch[Entity], create[Entity], update[Entity]
- **Error Handling**: [How errors are handled]

### Component Patterns
- **Naming**: PascalCase with .jsx extension
- **Structure**: Hooks → Memos → Callbacks → Early returns → Render
- **Props**: All have PropTypes defined
- **Performance**: All wrapped in React.memo

### Chart Implementation
- **Library Used**: MUI X Charts (or note violations)
- **Common Pattern**: Data in useMemo, fixed heights
- **Container**: Usually Paper with elevation={1}

### Responsive Design Pattern
- **Breakpoints**: Using theme.breakpoints
- **Grid System**: MUI Grid with responsive props
- **Mobile First**: xs → sm → md progression

## Technical Decisions (Inferred from Code)

### Why Zustand?
- **Evidence**: All state management uses Zustand
- **Benefits Observed**: Simple API, no providers needed
- **Pattern**: One store per feature

### Why MUI X Charts?
- **Evidence**: Convention requires it exclusively
- **Benefits**: Consistent with MUI ecosystem
- **Usage**: LineChart, BarChart, PieChart components

### Why .jsx Extension?
- **Evidence**: Vite configuration requires it
- **Reason**: Proper JSX parsing and hot reload

### Performance Optimizations
- **Evidence**: All components use React.memo
- **Pattern**: Heavy use of useMemo/useCallback
- **Reason**: Large datasets mentioned in context

## Unknowns (Need Clarification)

### Business Context
- What type of analytics does this dashboard show?
- Who are the end users?
- What's the data source?
- How often is data updated?

### Technical Context  
- Deployment environment?
- Authentication method?
- API endpoint structure?
- Performance targets?

### Development Process
- Git branching strategy?
- Code review process?
- Testing requirements beyond unit tests?
- CI/CD pipeline?
