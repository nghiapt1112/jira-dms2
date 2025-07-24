# Merge Duplicate memberConfiguration.js Files - Action Plan

## 🚨 Current Situation

**Two memberConfiguration.js files exist:**
1. `/src/constants/memberConfiguration.js` - OLD (26,105 bytes)
   - ❌ Missing: level, pointType fields
   - ✅ Being imported by: 12 files

2. `/src/shared/constants/memberConfiguration.js` - NEW (26,313 bytes)  
   - ✅ Has: level fields for developers
   - ✅ Has: pointType fields for projects
   - ❌ Not being imported by any files!

## 🎯 Merge Strategy

### Option A: Update Import Paths (Safest)
1. Keep the updated file in `/src/shared/constants/`
2. Update all 12 import statements to use the shared location
3. Delete the old file
4. Add missing performance configuration

### Option B: Move Updates to Original Location (Minimal Changes)
1. Copy updates from shared to constants location
2. Delete the shared file
3. No import changes needed
4. Add missing performance configuration

## 📋 Recommended Approach: Option B

**Rationale**: Less risky, fewer files to change, maintains existing import structure

### Execution Steps:

#### Step 1: Backup Current State
```bash
# Create backup
cp /src/constants/memberConfiguration.js /src/constants/memberConfiguration.backup.js
cp /src/shared/constants/memberConfiguration.js /src/shared/constants/memberConfiguration.backup.js
```

#### Step 2: Merge Configuration
1. Copy the developer `level` fields from shared to constants
2. Copy the project `pointType` fields from shared to constants
3. Ensure all other configurations match

#### Step 3: Add Missing Performance Configuration
```javascript
// Add to memberConfiguration object:
performanceTargets: {
  HOURS_BASE: {
    all: {
      totalPointWeekTarget: 35,
      totalPointMonthTarget: 140,
      totalPointQuarterTarget: 420
    }
  },
  STORYPOINT_BASE: {
    middle: {
      totalPointWeekTarget: 25,
      totalPointMonthTarget: 100,
      totalPointQuarterTarget: 300
    },
    senior: {
      totalPointWeekTarget: 30,
      totalPointMonthTarget: 90,
      totalPointQuarterTarget: 270
    }
  }
},

targetLineConfig: {
  HOURS_BASE: {
    all: {
      color: '#ff9800',
      borderWidth: 2,
      borderDash: [5, 5],
      label: 'Target (All)'
    }
  },
  STORYPOINT_BASE: {
    middle: {
      color: '#2196f3',
      borderWidth: 2,
      borderDash: [5, 5],
      label: 'Target (Middle)'
    },
    senior: {
      color: '#4caf50',
      borderWidth: 2,
      borderDash: [5, 5],
      label: 'Target (Senior)'
    }
  }
}
```

#### Step 4: Delete Duplicate
```bash
rm /src/shared/constants/memberConfiguration.js
```

#### Step 5: Test
- Run dev server
- Verify configuration loads
- Check developer quality dashboard

## ⚠️ Important Notes

1. **Case Sensitivity**: The shared version has `level: "Senior"` (capital S) but our code expects `level: "senior"` (lowercase)
2. **Performance Config**: Still needs to be added regardless of which file we keep
3. **Git History**: Check if either file has important git history to preserve

## 🎯 Decision Required

Should we:
1. **Proceed with Option B** (merge to original location)?
2. **Use Option A** (update all imports)?
3. **Wait for your manual merge**?

The configuration duplication is blocking the Point Performance Filter implementation!