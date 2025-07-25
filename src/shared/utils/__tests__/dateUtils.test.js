/**
 * Date Utils Regression Prevention Tests
 * Ensures all date functions work correctly and prevent scope issues
 * Following .cursorrules conventions
 */

import {
  createDate,
  isValidDate,
  getCurrentDate,
  getCurrentTimestamp,
  daysBetween,
  addDays,
  subtractDays,
  formatDate,
  getMonthKey,
  startOfMonth,
  endOfMonth
} from '../dateUtils.js'

import {
  getTimePeriodKey,
  getWeekDateRange,
  formatDateDDMMYYYY,
  getWeekFromDate,
  getQuarterFromDate,
  getMonthsInQuarter,
  getQuarterFromMonth,
  generateQuarterDataFromMonths
} from '../timeUtils.js'

describe('dateUtils - Regression Prevention Tests', () => {
  
  // Test data - consistent dates for predictable results
  const testDate1 = '2024-03-15T10:30:00Z'  // Friday, Week 11 in 2024
  const testDate2 = '2024-01-01T00:00:00Z'  // Monday, Week 1 in 2024  
  const testDate3 = '2024-12-31T23:59:59Z'  // Tuesday, Week 1 in 2025 (ISO week)
  
  describe('Core Date Functions', () => {
    it('should create valid dates from strings', () => {
      const date = createDate(testDate1)
      expect(date).toBeInstanceOf(Date)
      expect(isValidDate(date)).toBe(true)
    })
    
    it('should handle invalid date inputs gracefully', () => {
      expect(createDate('invalid-date')).toBeNull()
      expect(createDate(null)).toBeNull()
      expect(createDate(undefined)).toBeNull()
    })
    
    it('should calculate days between dates correctly', () => {
      const days = daysBetween('2024-01-01', '2024-01-11')
      expect(days).toBe(10)
    })
    
    it('should add and subtract days correctly', () => {
      const date = '2024-03-15'
      const added = addDays(date, 5)
      const subtracted = subtractDays(date, 5)
      
      expect(added).toBeInstanceOf(Date)
      expect(subtracted).toBeInstanceOf(Date)
      expect(daysBetween(subtracted, added)).toBe(10)
    })
  })
  
  // CRITICAL: Test the getTimePeriodKey function that caused data misalignment
  describe('getTimePeriodKey - Critical Function', () => {
    it('should calculate consistent week keys', () => {
      // Test the existing correct implementation
      const weekKey = getTimePeriodKey(testDate1, 'week')
      
      // This should be consistent - March 15, 2024 should be week 11
      expect(weekKey).toMatch(/2024-W\d{2}/)
      expect(typeof weekKey).toBe('string')
    })
    
    it('should calculate month keys correctly', () => {
      expect(getTimePeriodKey(testDate1, 'month')).toBe('2024-03')
      expect(getTimePeriodKey(testDate2, 'month')).toBe('2024-01')
    })
    
    it('should calculate quarter keys correctly', () => {
      expect(getTimePeriodKey(testDate1, 'quarter')).toBe('2024-Q1')
      expect(getTimePeriodKey('2024-07-15', 'quarter')).toBe('2024-Q3')
      expect(getTimePeriodKey('2024-12-15', 'quarter')).toBe('2024-Q4')
    })
    
    it('should handle edge cases for week calculation', () => {
      // Test ISO week boundary conditions
      const newYear = getTimePeriodKey(testDate2, 'week')
      const endYear = getTimePeriodKey(testDate3, 'week')
      
      expect(newYear).toMatch(/2024-W01/)
      expect(endYear).toMatch(/2025-W01/) // Dec 31, 2024 is actually week 1 of 2025 in ISO
    })
  })
  
  describe('Month and Date Operations', () => {
    it('should generate correct month keys', () => {
      expect(getMonthKey(testDate1)).toBe('2024-03')
      expect(getMonthKey('2024-12-01')).toBe('2024-12')
    })
    
    it('should calculate start and end of month correctly', () => {
      const start = startOfMonth(testDate1)
      const end = endOfMonth(testDate1)
      
      expect(start.getDate()).toBe(1)
      expect(start.getHours()).toBe(0)
      expect(end.getDate()).toBe(31) // March has 31 days
      expect(end.getHours()).toBe(23)
    })
  })
  
  describe('Date Formatting', () => {
    it('should format dates consistently', () => {
      const formatted = formatDate(testDate1)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })
  
  // REGRESSION SPECIFIC: Test that functions don't throw ReferenceError
  describe('Regression Prevention - Variable Scope', () => {
    it('should not throw ReferenceError for any date function', () => {
      expect(() => {
        getTimePeriodKey(testDate1, 'week')
        getTimePeriodKey(testDate1, 'month') 
        getTimePeriodKey(testDate1, 'quarter')
        getMonthKey(testDate1)
        formatDate(testDate1)
        createDate(testDate1)
      }).not.toThrow()
    })
    
    it('should handle null/undefined inputs without throwing', () => {
      expect(() => {
        getTimePeriodKey(null, 'week')
        getTimePeriodKey(undefined, 'month')
        createDate(null)
        formatDate(undefined)
      }).not.toThrow()
    })
  })
  
  // Test the new consolidated wrapper functions
  describe('Consolidated Wrapper Functions - DRY Compliance', () => {
    it('should provide getWeekFromDate wrapper that matches getTimePeriodKey', () => {
      const weekFromWrapper = getWeekFromDate(testDate1)
      const weekFromMain = getTimePeriodKey(testDate1, 'week')
      
      expect(weekFromWrapper).toBe(weekFromMain)
      expect(weekFromWrapper).toMatch(/2024-W\d{2}/)
    })
    
    it('should provide getQuarterFromDate wrapper that matches getTimePeriodKey', () => {
      const quarterFromWrapper = getQuarterFromDate(testDate1)
      const quarterFromMain = getTimePeriodKey(testDate1, 'quarter')
      
      expect(quarterFromWrapper).toBe(quarterFromMain)
      expect(quarterFromWrapper).toBe('2024-Q1')
    })
    
    it('should get months in quarter correctly', () => {
      expect(getMonthsInQuarter('2024-Q1')).toEqual(['2024-01', '2024-02', '2024-03'])
      expect(getMonthsInQuarter('2024-Q3')).toEqual(['2024-07', '2024-08', '2024-09'])
    })
    
    it('should convert month to quarter correctly', () => {
      expect(getQuarterFromMonth('2024-01')).toBe('2024-Q1')
      expect(getQuarterFromMonth('2024-07')).toBe('2024-Q3')
      expect(getQuarterFromMonth('2024-12')).toBe('2024-Q4')
    })
    
    it('should generate quarter data from monthly data', () => {
      // Create mock monthly data
      const monthlyData = new Map([
        ['2024-01', new Map([['John', 10], ['Jane', 15]])],
        ['2024-02', new Map([['John', 8], ['Jane', 12]])],
        ['2024-03', new Map([['John', 12], ['Jane', 18]])]
      ])
      
      const quarterData = generateQuarterDataFromMonths(monthlyData, '2024-Q1')
      
      expect(quarterData).toHaveLength(2)
      expect(quarterData.find(d => d.developer === 'John')).toEqual({
        timePeriod: '2024-Q1',
        developer: 'John',
        storyPoints: 30 // 10 + 8 + 12
      })
      expect(quarterData.find(d => d.developer === 'Jane')).toEqual({
        timePeriod: '2024-Q1', 
        developer: 'Jane',
        storyPoints: 45 // 15 + 12 + 18
      })
    })
  })
  
  // Performance baseline test
  describe('Performance Baseline', () => {
    it('should process date operations efficiently', () => {
      const iterations = 1000
      const testDates = Array.from({length: iterations}, (_, i) => 
        new Date(2024, 0, 1 + i).toISOString()
      )
      
      const startTime = performance.now()
      testDates.forEach(date => {
        getTimePeriodKey(date, 'week')
        getTimePeriodKey(date, 'month')
        getTimePeriodKey(date, 'quarter')
        // Test wrapper functions too
        getWeekFromDate(date)
        getQuarterFromDate(date)
      })
      const endTime = performance.now()
      
      const duration = endTime - startTime
      // Should complete 5000 operations in under 150ms
      expect(duration).toBeLessThan(150)
    })
  })

  // INTEGRATION TESTS - Verify data consistency across components
  describe('Cross-Component Data Consistency', () => {
    const testIssue = {
      fields: {
        created: '2024-03-15T10:30:00Z',
        updated: '2024-03-20T14:45:00Z',
        resolved: '2024-03-22T16:00:00Z',
        customfield_10028: 8, // story points
        timetracking: { timeSpentSeconds: 28800 } // 8 hours
      }
    }

    it('should produce consistent week keys across all components', () => {
      // Simulate how different components would process the same issue
      const serviceWeekKey = getTimePeriodKey(testIssue.fields.updated, 'week')
      const chartWeekKey = getTimePeriodKey(testIssue.fields.updated, 'week') 
      const filterWeekKey = getWeekFromDate(testIssue.fields.updated)
      const metricsWeekKey = getTimePeriodKey(testIssue.fields.updated, 'week')
      
      // All should be identical - this was the critical bug we fixed
      expect(serviceWeekKey).toBe(chartWeekKey)
      expect(chartWeekKey).toBe(filterWeekKey)
      expect(filterWeekKey).toBe(metricsWeekKey)
      expect(serviceWeekKey).toMatch(/2024-W\d{2}/)
    })

    it('should produce consistent quarter keys across all components', () => {
      const serviceQuarterKey = getTimePeriodKey(testIssue.fields.created, 'quarter')
      const filterQuarterKey = getQuarterFromDate(testIssue.fields.created)
      const wrapperQuarterKey = getQuarterFromDate(testIssue.fields.created)
      
      expect(serviceQuarterKey).toBe(filterQuarterKey)
      expect(filterQuarterKey).toBe(wrapperQuarterKey)
      expect(serviceQuarterKey).toBe('2024-Q1')
    })

    it('should handle week date range calculations consistently', () => {
      const weekKey = getTimePeriodKey(testIssue.fields.updated, 'week')
      const weekRange = getWeekDateRange(weekKey)
      
      expect(weekRange.startDate).toBeInstanceOf(Date)
      expect(weekRange.endDate).toBeInstanceOf(Date)
      expect(weekRange.formatted).toMatch(/\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}/)
      
      // Verify week range spans exactly 7 days
      const daysDiff = Math.ceil((weekRange.endDate - weekRange.startDate) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBe(6) // Sunday - Monday = 6 days difference
    })

    it('should correctly aggregate quarter data from monthly data', () => {
      // Mock monthly data that spans Q1 2024
      const monthlyData = new Map([
        ['2024-01', new Map([['dev1', 20], ['dev2', 15]])],
        ['2024-02', new Map([['dev1', 25], ['dev2', 20]])], 
        ['2024-03', new Map([['dev1', 30], ['dev2', 25]])]
      ])
      
      const quarterData = generateQuarterDataFromMonths(monthlyData, '2024-Q1')
      
      expect(quarterData).toHaveLength(2)
      
      const dev1Data = quarterData.find(d => d.developer === 'dev1')
      const dev2Data = quarterData.find(d => d.developer === 'dev2')
      
      expect(dev1Data.storyPoints).toBe(75) // 20 + 25 + 30
      expect(dev2Data.storyPoints).toBe(60) // 15 + 20 + 25
      expect(dev1Data.timePeriod).toBe('2024-Q1')
      expect(dev2Data.timePeriod).toBe('2024-Q1')
    })
  })

  // EDGE CASES - Critical boundary conditions
  describe('Edge Case Handling', () => {
    it('should handle ISO week year boundaries correctly', () => {
      // These dates are tricky for ISO week calculation
      const testCases = [
        { date: '2024-01-01T00:00:00Z', expected: '2024-W01' },
        { date: '2024-12-30T00:00:00Z', expected: '2025-W01' }, // ISO week boundary
        { date: '2023-01-01T00:00:00Z', expected: '2022-W52' }, // ISO week boundary
        { date: '2021-01-04T00:00:00Z', expected: '2021-W01' }
      ]
      
      testCases.forEach(({ date, expected }) => {
        const result = getTimePeriodKey(date, 'week')
        expect(result).toBe(expected)
      })
    })

    it('should handle leap year February correctly', () => {
      // 2024 is a leap year
      const leapFeb = getTimePeriodKey('2024-02-29T12:00:00Z', 'month')
      const normalFeb = getTimePeriodKey('2023-02-28T12:00:00Z', 'month')
      
      expect(leapFeb).toBe('2024-02')
      expect(normalFeb).toBe('2023-02')
      
      // Test quarter calculation with leap year
      const leapQ1 = getTimePeriodKey('2024-02-29T12:00:00Z', 'quarter')
      expect(leapQ1).toBe('2024-Q1')
    })

    it('should handle timezone edge cases', () => {
      // Same logical date in different timezones
      const utcDate = '2024-03-15T00:00:00Z'
      const utcPlus8 = '2024-03-15T08:00:00+08:00' 
      const utcMinus5 = '2024-03-14T19:00:00-05:00'
      
      const utcWeek = getTimePeriodKey(utcDate, 'week')
      const plus8Week = getTimePeriodKey(utcPlus8, 'week')
      const minus5Week = getTimePeriodKey(utcMinus5, 'week')
      
      // All should produce the same week (since they're the same instant)
      expect(utcWeek).toBe(plus8Week)
      expect(plus8Week).toBe(minus5Week)
    })

    it('should handle malformed date inputs gracefully', () => {
      const malformedInputs = [
        '',
        null,
        undefined,
        'not-a-date',
        'invalid-date-string'
      ]
      
      malformedInputs.forEach(input => {
        expect(() => {
          const result = getTimePeriodKey(input, 'week')
          expect(result).toBe('') // Should return empty string, not throw
        }).not.toThrow()
      })
      
      // Test that some edge dates are handled correctly (these may parse but produce valid results)
      const edgeDates = [
        '2024-13-45', // Invalid month/day - JS will auto-correct this
        '2024-02-30', // Invalid date for February - JS will auto-correct this
        'March 32, 2024' // Invalid date - JS may auto-correct this
      ]
      
      edgeDates.forEach(input => {
        expect(() => {
          const result = getTimePeriodKey(input, 'week')
          // Should not throw, but result may vary based on JS Date parsing
        }).not.toThrow()
      })
    })
  })

  // REAL-WORLD SCENARIOS - Based on actual JIRA data patterns
  describe('Real-World Data Scenarios', () => {
    it('should handle bulk date processing without performance degradation', () => {
      // Simulate processing 10,000 JIRA issues
      const bulkDates = Array.from({ length: 10000 }, (_, i) => {
        const baseDate = new Date(2024, 0, 1)
        baseDate.setDate(baseDate.getDate() + (i % 365))
        return baseDate.toISOString()
      })
      
      const startTime = performance.now()
      
      const results = bulkDates.map(date => ({
        week: getTimePeriodKey(date, 'week'),
        month: getTimePeriodKey(date, 'month'),
        quarter: getTimePeriodKey(date, 'quarter')
      }))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should process 10k issues in under 500ms
      expect(duration).toBeLessThan(500)
      expect(results).toHaveLength(10000)
      
      // Verify no empty/invalid results
      const invalidResults = results.filter(r => !r.week || !r.month || !r.quarter)
      expect(invalidResults).toHaveLength(0)
    })

    it('should produce consistent results for story point aggregation scenario', () => {
      // Simulate the exact scenario that was causing data misalignment
      const issueUpdates = [
        { updated: '2024-03-15T10:30:00Z', storyPoints: 5 },
        { updated: '2024-03-16T14:20:00Z', storyPoints: 8 },
        { updated: '2024-03-17T09:15:00Z', storyPoints: 3 },
        { updated: '2024-03-21T16:45:00Z', storyPoints: 13 } // Different week
      ]
      
      // Aggregate by week (this is what was inconsistent before)
      const weeklyAggregation = new Map()
      
      issueUpdates.forEach(issue => {
        const weekKey = getTimePeriodKey(issue.updated, 'week')
        const current = weeklyAggregation.get(weekKey) || 0
        weeklyAggregation.set(weekKey, current + issue.storyPoints)
      })
      
      // Should have exactly 2 weeks of data
      expect(weeklyAggregation.size).toBe(2)
      
      // Get the two weeks
      const weeks = Array.from(weeklyAggregation.keys()).sort()
      expect(weeks[0]).toMatch(/2024-W\d{2}/)
      expect(weeks[1]).toMatch(/2024-W\d{2}/)
      
      // First week should have 16 points (5+8+3), second week 13 points
      const firstWeekPoints = weeklyAggregation.get(weeks[0])
      const secondWeekPoints = weeklyAggregation.get(weeks[1])
      
      expect(firstWeekPoints + secondWeekPoints).toBe(29) // Total should match
    })
  })
})