# Point Performance Filter - Execution Tasks

## 🎯 Ready-to-Execute Tasks

### **Prerequisites**
- [ ] Project pointType assignments for all 27+ projects
- [ ] Developer level assignments for all developers (middle/senior)
- [ ] Confirm performance target values
- [ ] Dev server running (`npm run dev`)

### **Task 1: Configuration Setup** (30 min)
```bash
# Files to modify:
# - /src/constants/memberConfiguration.js

# Add to memberConfiguration:
# 1. pointType field to all projects
# 2. level field to all developers  
# 3. performanceTargets section
# 4. targetLineConfig section
```

**Execution Steps**:
1. ✅ Open `/src/constants/memberConfiguration.js`
2. ✅ Add `pointType: "HOURS_BASE"|"STORYPOINT_BASE"` to each project
3. ✅ Add `level: "middle"|"senior"` to each developer
4. ✅ Add `performanceTargets` configuration section
5. ✅ Add `targetLineConfig` visual styling section
6. ✅ Test configuration loading in dev tools

**Acceptance**: Configuration loads without errors, all required fields present

---

### **Task 2: Target Calculation Service** (45 min)
```bash
# File to create:
# - /src/features/developer-quality-dashboard/services/targetCalculationService.js
```

**Execution Steps**:
1. ✅ Create new service file
2. ✅ Implement `getTargetForPeriod()` method
3. ✅ Implement `getProjectTargets()` method  
4. ✅ Implement `getDeveloperLevel()` method
5. ✅ Add JSDoc documentation
6. ✅ Export service functions

**Acceptance**: Service calculates correct targets for both project types

---

### **Task 3: Extend Single-Loop Processing** (60 min)
```bash
# File to modify:
# - /src/features/developer-quality-dashboard/services/developerQualityService.js
```

**Execution Steps**:
1. ✅ Locate existing `processJiraIssuesForDeveloperQuality()` method
2. ✅ Add `performanceMetadata` structure initialization
3. ✅ Extend existing forEach loop with performance metadata collection
4. ✅ Add performance metadata to return object
5. ✅ Test with small dataset (1K issues)
6. ✅ Verify IndexedDB storage includes metadata

**Acceptance**: Performance metadata collected without processing time increase

---

### **Task 4: Performance Toggle Component** (30 min)
```bash
# File to create:
# - /src/features/developer-quality-dashboard/components/TeamContributionChart/PerformanceToggle.jsx
```

**Execution Steps**:
1. ✅ Create React component with `React.memo`
2. ✅ Implement MUI Switch with proper styling
3. ✅ Add PropTypes validation
4. ✅ Follow .cursorrules conventions
5. ✅ Test component in isolation
6. ✅ Add to component exports

**Acceptance**: Toggle component renders and functions correctly

---

### **Task 5: Performance Filter Component** (45 min)
```bash
# File to create:
# - /src/features/developer-quality-dashboard/components/TeamContributionChart/PerformanceFilter.jsx
```

**Execution Steps**:
1. ✅ Create React component with `React.memo`
2. ✅ Implement MUI Autocomplete with 3 options
3. ✅ Add disabled state handling
4. ✅ Add PropTypes validation
5. ✅ Test dropdown functionality
6. ✅ Add to component exports

**Acceptance**: Filter dropdown shows correct options and handles state changes

---

### **Task 6: Update TeamContributionChart** (45 min)
```bash
# File to modify:
# - /src/features/developer-quality-dashboard/components/TeamContributionChart/TeamContributionChart.jsx
```

**Execution Steps**:
1. ✅ Add new state variables (`showTargetLines`, `performanceFilter`)
2. ✅ Import new toggle and filter components
3. ✅ Add single-project detection logic
4. ✅ Add controls to chart header
5. ✅ Pass new props to TeamOverviewChart
6. ✅ Test UI layout and interactions

**Acceptance**: Controls appear in header, single-project detection works

---

### **Task 7: Add Target Lines to TeamOverviewChart** (90 min)
```bash
# File to modify:
# - /src/features/developer-quality-dashboard/components/TeamContributionChart/TeamOverviewChart.jsx
```

**Execution Steps**:
1. ✅ Add `generateTargetLines` memoized function
2. ✅ Implement target line datasets for Chart.js
3. ✅ Handle HOURS_BASE (single line) vs STORYPOINT_BASE (dual lines)
4. ✅ Add target lines to chart datasets
5. ✅ Update Chart.js configuration for mixed charts
6. ✅ Test target line display and styling

**Acceptance**: Target lines display correctly for different project types

---

### **Task 8: On-Demand Performance Filtering** (75 min)
```bash
# File to modify:
# - /src/features/developer-quality-dashboard/services/filterService.js
```

**Execution Steps**:
1. ✅ Add `applyPerformanceFilter()` method to filterService
2. ✅ Implement per-time-period performance calculation
3. ✅ Create sparse chart data (0-height bars for filtered periods)
4. ✅ Optimize for ~1,500 aggregated data points
5. ✅ Test filtering performance with timer
6. ✅ Integrate with chart data generation

**Acceptance**: Filtering completes in <1ms, creates correct sparse chart data

---

### **Task 9: Chart Integration** (60 min)
```bash
# File to modify:
# - /src/features/developer-quality-dashboard/components/TeamContributionChart/TeamOverviewChart.jsx
```

**Execution Steps**:
1. ✅ Integrate performance filtering with chart data
2. ✅ Update chartData useMemo with filtering logic
3. ✅ Handle mixed datasets (bars + velocity + targets)
4. ✅ Test chart rendering with different filter states
5. ✅ Verify performance with different project types
6. ✅ Test responsive behavior

**Acceptance**: Charts render correctly with all features integrated

---

### **Task 10: Testing with Real Data** (45 min)
```bash
# Test files available:
# - /Users/brendanpham/data/source/Q3-2025-all-tickets.json (72MB)
# - /Users/brendanpham/data/source/Q2-2025-all-tickets.json (118MB)
```

**Execution Steps**:
1. ✅ Start with Q3 data (smaller file)
2. ✅ Load data through application UI
3. ✅ Test all feature functionality
4. ✅ Monitor performance metrics
5. ✅ Test with single project selections
6. ✅ Verify filtering performance benchmarks

**Acceptance**: Feature works with large datasets, meets performance targets

---

## 🚀 Quick Start Commands

### **Development Environment**
```bash
# Start dev server
npm run dev

# Open dev tools and monitor:
# - Console for errors/warnings  
# - Performance tab for timing
# - Application tab for IndexedDB
```

### **Testing Commands**
```bash
# Create test data subsets (if needed)
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/Users/brendanpham/data/source/Q3-2025-all-tickets.json', 'utf8'));
fs.writeFileSync('test-data-1k.json', JSON.stringify(data.slice(0, 1000), null, 2));
console.log('Created test-data-1k.json with 1000 issues');
"

# Performance benchmarking
# Add to browser console:
# console.time('Processing'); [load data]; console.timeEnd('Processing');
```

### **File Locations Quick Reference**
```bash
# Configuration
/src/constants/memberConfiguration.js

# Services  
/src/features/developer-quality-dashboard/services/
├── developerQualityService.js (extend)
├── filterService.js (extend)
└── targetCalculationService.js (new)

# Components
/src/features/developer-quality-dashboard/components/TeamContributionChart/
├── TeamContributionChart.jsx (extend)
├── TeamOverviewChart.jsx (extend)
├── PerformanceToggle.jsx (new)
└── PerformanceFilter.jsx (new)
```

## ⚠️ Before Starting

1. **Confirm Prerequisites**: Ensure all configuration data is available
2. **Backup Current State**: Commit current working state to git
3. **Start Dev Server**: `npm run dev` and verify current functionality
4. **Clear IndexedDB**: Clear cache to start with fresh data processing

## 📊 Success Metrics

- [ ] Target lines display correctly for single projects
- [ ] Performance filtering works per time period  
- [ ] Filtering completes in <1ms
- [ ] Charts render without performance degradation
- [ ] Feature works with 72MB+ data files
- [ ] All tests pass and code follows .cursorrules

**Ready to execute tasks in order!** 🎯

**Next Step**: Please provide the missing configuration data (project pointTypes, developer levels) to begin Task 1.