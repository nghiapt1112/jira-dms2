# Point Performance Filter - Testing Strategy

## 🎯 Testing Approach with Large Data Files

### **Available Test Data**
- **Q1-2025**: 96MB (~50K+ issues)
- **Q2-2025**: 118MB (~65K+ issues) 
- **Q3-2025**: 72MB (~35K+ issues) ⭐️ **Start here**

### **Progressive Testing Strategy**

#### **Phase 1: Development Testing (Small Subset)**
```bash
# Create smaller test file from Q3 data (first 1000 issues)
head -n 1000 /Users/brendanpham/data/source/Q3-2025-all-tickets.json > test-data-1k.json
```
- **Purpose**: Rapid development iteration
- **Size**: ~1K issues
- **Focus**: Feature functionality, UI behavior
- **Expected Performance**: Instant (<10ms)

#### **Phase 2: Performance Validation (Medium Dataset)**
```bash
# Create medium test file (first 10,000 issues)
head -n 10000 /Users/brendanpham/data/source/Q3-2025-all-tickets.json > test-data-10k.json
```
- **Purpose**: Performance characteristics validation
- **Size**: ~10K issues (similar to current production)
- **Focus**: Single-loop processing, filtering performance
- **Expected Performance**: <1ms filtering, <2s processing

#### **Phase 3: Scale Testing (Full Files)**
```bash
# Test with full Q3 file (smallest full dataset)
cp /Users/brendanpham/data/source/Q3-2025-all-tickets.json test-data-full-q3.json
```
- **Purpose**: Full-scale performance validation
- **Size**: 72MB (~35K+ issues)
- **Focus**: Memory usage, IndexedDB performance, browser stability
- **Expected Performance**: <1ms filtering, <5s processing

#### **Phase 4: Stress Testing (Largest Dataset)**
```bash
# Test with Q2 file (largest dataset)
cp /Users/brendanpham/data/source/Q2-2025-all-tickets.json test-data-stress-q2.json
```
- **Purpose**: Maximum load validation
- **Size**: 118MB (~65K+ issues)
- **Focus**: System limits, memory constraints
- **Expected Performance**: <2ms filtering, <8s processing

## 🔧 Testing Implementation

### **Test Data Preparation Script**
```javascript
// create-test-data.js
const fs = require('fs');

function createTestDataSubset(sourceFile, outputFile, maxIssues) {
  const data = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const subset = data.slice(0, maxIssues);
  fs.writeFileSync(outputFile, JSON.stringify(subset, null, 2));
  console.log(`Created ${outputFile} with ${subset.length} issues`);
}

// Create test data subsets
createTestDataSubset('/Users/brendanpham/data/source/Q3-2025-all-tickets.json', 'test-data-1k.json', 1000);
createTestDataSubset('/Users/brendanpham/data/source/Q3-2025-all-tickets.json', 'test-data-10k.json', 10000);
```

### **Performance Benchmarking**
```javascript
// performance-test.js
const performanceTest = {
  testSingleLoopProcessing: async (dataSize) => {
    const start = performance.now();
    const result = await developerQualityService.processJiraIssuesForDeveloperQuality(testData);
    const end = performance.now();
    
    console.log(`Processing ${dataSize} issues: ${(end - start).toFixed(2)}ms`);
    return { processingTime: end - start, result };
  },
  
  testPerformanceFiltering: async (chartData, filterType) => {
    const start = performance.now();
    const filtered = filterService.applyPerformanceFilter(chartData, filterType, 'STORYPOINT_BASE', 'week', metadata);
    const end = performance.now();
    
    console.log(`Filtering ${chartData.length} periods: ${(end - start).toFixed(2)}ms`);
    return { filteringTime: end - start, filtered };
  },
  
  testIndexedDBPerformance: async (cacheData) => {
    const start = performance.now();
    await indexedDBCache.setCachedData('test_performance', cacheData);
    const stored = await indexedDBCache.getCachedData('test_performance');
    const end = performance.now();
    
    console.log(`IndexedDB round-trip: ${(end - start).toFixed(2)}ms`);
    return { storageTime: end - start, stored };
  }
};
```

### **Memory Usage Monitoring**
```javascript
// memory-test.js
const memoryTest = {
  measureMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  },
  
  testMemoryWithDataSize: async (dataSize) => {
    const before = memoryTest.measureMemoryUsage();
    
    // Load and process data
    const result = await performanceTest.testSingleLoopProcessing(dataSize);
    
    const after = memoryTest.measureMemoryUsage();
    
    console.log(`Memory usage for ${dataSize}:`, {
      before: `${before.used}MB`,
      after: `${after.used}MB`,
      increase: `${after.used - before.used}MB`
    });
    
    return { before, after, increase: after.used - before.used };
  }
};
```

## 📊 Performance Targets

### **Processing Benchmarks**
| Data Size | Processing Time | Memory Usage | Filter Time |
|-----------|----------------|--------------|-------------|
| 1K issues | <100ms | <5MB | <0.1ms |
| 10K issues | <2s | <20MB | <1ms |
| 35K issues (Q3) | <5s | <50MB | <1ms |
| 65K issues (Q2) | <8s | <80MB | <2ms |

### **Failure Thresholds**
- **Processing Time**: >10s for any dataset
- **Memory Usage**: >150MB heap increase
- **Filter Time**: >5ms for any aggregated dataset
- **Browser Stability**: Any crashes or unresponsive UI

## 🚨 Testing Checklist

### **Before Each Test Run**
- [ ] Clear browser cache and IndexedDB
- [ ] Monitor memory usage baseline
- [ ] Prepare performance measurement tools
- [ ] Backup current configuration

### **During Testing**
- [ ] Monitor browser dev tools Performance tab
- [ ] Watch for memory leaks
- [ ] Test feature toggle on/off
- [ ] Verify chart responsiveness
- [ ] Check console for errors/warnings

### **After Testing**
- [ ] Document performance metrics
- [ ] Clear test data from IndexedDB
- [ ] Report any issues found
- [ ] Update performance benchmarks

## 🎯 Test Scenarios

### **Functional Tests**
1. **Single Project Target Lines**
   - HOURS_BASE project: Single orange target line
   - STORYPOINT_BASE project: Dual target lines (blue/green)

2. **Performance Filtering**
   - All developers (no filtering)
   - Under performance (sparse chart)
   - Over performance (sparse chart)

3. **Time Period Variations**
   - Week view with target lines
   - Month view with target lines  
   - Quarter view with target lines

### **Edge Cases**
1. **Missing Configuration**
   - Project without pointType
   - Developer without level
   - Missing target values

2. **Data Variations**
   - Projects with 0 story points
   - Developers with no assignments
   - Time periods with no data

3. **Performance Edge Cases**
   - Very sparse data (few developers)
   - Very dense data (many developers)
   - Long time period ranges

## 📝 Test Results Template

```markdown
### Test Run: [Date/Time]
**Data Size**: [1K/10K/35K/65K issues]
**Test Type**: [Functional/Performance/Stress]

**Results**:
- Processing Time: [X]ms
- Memory Usage: [X]MB increase
- Filter Performance: [X]ms
- Chart Render Time: [X]ms

**Issues Found**:
- [List any issues]

**Status**: [PASS/FAIL/ISSUES]
```

## 🔧 Quick Test Commands

```bash
# Start with development testing
npm run dev
# Load small test data via UI
# Test feature functionality

# Performance testing
npm run test:performance
# Automated performance benchmarking

# Memory testing  
npm run test:memory
# Monitor memory usage patterns
```

**Ready for progressive testing from 1K → 10K → 35K → 65K issues!** 🚀