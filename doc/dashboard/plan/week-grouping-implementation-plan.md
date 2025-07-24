# Week Grouping Implementation Plan for Detailed Issue Breakdown

## Overview
Modify the "Detailed Issue Breakdown" table in EffortEffectivenessChart to group issues by time periods (week/month/quarter) similar to "Team Contribution by Story Points".

## Current Analysis ✅ COMPLETED

### Existing Infrastructure
- **Time Grouping**: EffortEffectivenessChart already groups issues by time period using `getTimePeriodKey()`
- **Data Structure**: `timeGroups` Map contains `{period, storyPoints, timeSpent, issues: []}`
- **Consistent Naming**: Uses same format as Team Contribution (`YYYY-WNN` for weeks)
- **Filter Integration**: Already respects statusFilter for "delivered" issues

### Current Implementation (Lines 175-194)
```javascript
// Group issues by time period
const timeGroups = new Map()

deliveredIssues.forEach(issue => {
  if (issue.created) {
    const periodKey = getTimePeriodKey(issue.created, timeframe)
    if (!timeGroups.has(periodKey)) {
      timeGroups.set(periodKey, {
        period: periodKey,
        storyPoints: 0,
        timeSpent: 0,
        issues: []  // ← This is what we need!
      })
    }
    const group = timeGroups.get(periodKey)
    group.storyPoints += issue.storyPoints || 0
    group.timeSpent += issue.timeSpentHours || 0
    group.issues.push(issue)  // ← Perfect for table display
  }
})
```

## Implementation Plan

### Phase 1: Data Restructuring ✅ (No changes needed)
- **Status**: The data is already perfectly structured
- **timeGroups**: Contains issues grouped by time period
- **Sorted**: Already sorted chronologically

### Phase 2: Table UI Redesign 🚧 IN PROGRESS

#### Current Table Structure (Lines 565-647)
```jsx
<TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Issue Key</TableCell>
        <TableCell>Story Points</TableCell>
        <TableCell>Time Spent</TableCell>
        <TableCell>Efficiency</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Created</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {timeBasedData.issuesData.map(issue => ...)}  // Flat list
    </TableBody>
  </Table>
</TableContainer>
```

#### New Grouped Table Structure
```jsx
<TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Issue Key</TableCell>
        <TableCell>Story Points</TableCell>
        <TableCell>Time Spent</TableCell>
        <TableCell>Efficiency</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Created</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {sortedPeriods.map(periodGroup => (
        <>
          {/* Period Header Row */}
          <TableRow key={`period-${periodGroup.period}`} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
            <TableCell colSpan={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={() => togglePeriod(periodGroup.period)}>
                  {expandedPeriods.has(periodGroup.period) ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {periodGroup.period} ({periodGroup.issues.length} issues)
                </Typography>
                <Chip label={`${periodGroup.storyPoints} SP`} size="small" color="primary" />
                <Chip label={`${periodGroup.timeSpent.toFixed(1)}h`} size="small" color="secondary" />
              </Box>
            </TableCell>
          </TableRow>
          
          {/* Issues for this period (collapsible) */}
          {expandedPeriods.has(periodGroup.period) && periodGroup.issues.map(issue => (
            <TableRow key={issue.issueKey} hover>
              {/* Existing issue row content */}
            </TableRow>
          ))}
        </>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Phase 3: State Management
```javascript
// Add state for expand/collapse
const [expandedPeriods, setExpandedPeriods] = useState(new Set())

// Toggle function
const togglePeriod = (period) => {
  setExpandedPeriods(prev => {
    const newSet = new Set(prev)
    if (newSet.has(period)) {
      newSet.delete(period)
    } else {
      newSet.add(period)
    }
    return newSet
  })
}

// Auto-expand most recent period
useEffect(() => {
  if (sortedPeriods.length > 0) {
    setExpandedPeriods(new Set([sortedPeriods[sortedPeriods.length - 1].period]))
  }
}, [sortedPeriods])
```

## Benefits
1. **Consistency**: Same time period grouping as Team Contribution
2. **Better UX**: Week-by-week review as requested
3. **Inherited Logic**: Reuses existing data processing
4. **Performance**: No additional data processing needed
5. **Flexibility**: Works with week/month/quarter timeframes

## Implementation Steps
1. ✅ Analyze existing data structure (COMPLETED)
2. 🚧 Add expand/collapse state management
3. 🚧 Modify table JSX structure
4. 🚧 Add period header rows with summaries
5. 🚧 Style the grouped sections
6. ⏳ Test with different timeframes
7. ⏳ Ensure consistent behavior with Team Contribution

## Technical Details
- **File**: `/src/features/developer-quality-dashboard/components/EffortEffectivenessChart/EffortEffectivenessChart.jsx`
- **Lines to modify**: 565-647 (Table structure)
- **New imports needed**: `ExpandMore`, `ExpandLess`, `IconButton`
- **State additions**: `expandedPeriods`, `togglePeriod`