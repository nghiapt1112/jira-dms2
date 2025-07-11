# Current State Map

## Existing Features (What's Actually Built)

### ✅ Feature: [Feature Name from /features folder]
- **Location**: `src/features/[feature-name]/`
- **Components Found**: 
  - [ ] ComponentName.jsx (has PropTypes: ✓/✗, has React.memo: ✓/✗)
  - [ ] AnotherComponent.jsx (has PropTypes: ✓/✗, has React.memo: ✓/✗)
- **Services**: 
  - [ ] serviceName.js - [brief description of what it does]
- **Store**: 
  - [ ] storeName.js - State: [list main state properties]
- **Hooks**: 
  - [ ] useHookName.js - [what it's used for]
- **Status**: Working/Broken/Incomplete
- **Convention Compliance**: 
  - [ ] Follows folder structure
  - [ ] All components have .jsx extension
  - [ ] PropTypes on all components
  - [ ] React.memo on all components
- **TODOs Found**: [count]
- **Issues/Observations**: [any problems noticed]

### 🚧 Feature: [Another Feature] 
[Repeat structure above]

## Shared Components Status

### UI Components (`src/components/ui/`)
- [ ] Component1 - [description] (PropTypes: ✓/✗, React.memo: ✓/✗)
- [ ] Component2 - [description] (PropTypes: ✓/✗, React.memo: ✓/✗)

### Chart Components (`src/components/charts/`)
- [ ] ChartComponent1 - [description] (uses MUI X Charts: ✓/✗)
- [ ] ChartComponent2 - [description] (uses MUI X Charts: ✓/✗)

## Convention Violations Found
1. **Wrong Extensions**: [List .js files that should be .jsx]
2. **Missing PropTypes**: [List components]
3. **Missing React.memo**: [List components]
4. **Wrong Chart Library**: [List if using non-MUI X Charts]
5. **Style/ClassName Usage**: [List violations]
6. **Deep Nesting**: [List locations >3 levels]

## Data Flow Observations
- **API Pattern**: [How services are structured]
- **State Pattern**: [How Zustand stores are organized]
- **Component Communication**: [How data flows between components]
