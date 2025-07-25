/**
 * URL Filter Utils Tests
 * 
 * Comprehensive test suite to validate URL filter sync functionality
 * Tests smart matching, encoding/decoding, and edge cases
 */

// Mock memberConfiguration for testing
const mockMemberConfiguration = {
  developers: [
    { jiraId: "1", name: "Andra Satria", level: "senior" },
    { jiraId: "2", name: "Tuan Hoang", level: "senior" },
    { jiraId: "3", name: "Duy Tang", level: "senior" },
    { jiraId: "4", name: "Asep Mochamad Setyadi (Omat)", level: "middle" },
    { jiraId: "5", name: "Edward Viet Ha Quoc", level: "middle" },
    { jiraId: "6", name: "hung.pham", level: "senior" },
    { jiraId: "7", name: "nhat nguyen", level: "senior" }
  ],
  projects: [
    { key: "BCP", name: "Borderless City Project", pointType: "HOURS_BASE" },
    { key: "CF", name: "Calbee-FfF", pointType: "STORYPOINT_BASE" },
    { key: "DAICO", name: "Daicolo", pointType: "HOURS_BASE" },
    { key: "WON", name: "WonderTable", pointType: "HOURS_BASE" },
    { key: "ENT", name: "Enterprise Team", pointType: "HOURS_BASE" }
  ]
}

// Mock the memberConfiguration import - Fixed path from test directory (4 levels up)
jest.mock('../../../../constants/memberConfiguration', () => ({
  memberConfiguration: mockMemberConfiguration
}))

describe('URL Filter Utils', () => {
  let utils

  beforeAll(async () => {
    // Import after mocking
    utils = await import('../urlFilterUtils')
  })

  describe('Smart Matching', () => {
    test('Developer exact name matching', () => {
      // Exact matches using functional approach
      expect(utils.matchDeveloper('Andra Satria')).toMatchObject({ name: 'Andra Satria' })
      expect(utils.matchDeveloper('andra satria')).toMatchObject({ name: 'Andra Satria' })
      expect(utils.matchDeveloper('ANDRA SATRIA')).toMatchObject({ name: 'Andra Satria' })
    })

    test('Developer partial name matching', () => {
      // First name only
      expect(utils.matchDeveloper('andra')).toMatchObject({ name: 'Andra Satria' })
      expect(utils.matchDeveloper('tuan')).toMatchObject({ name: 'Tuan Hoang' })
      
      // Last name only  
      expect(utils.matchDeveloper('tang')).toMatchObject({ name: 'Duy Tang' })
      expect(utils.matchDeveloper('hoang')).toMatchObject({ name: 'Tuan Hoang' })
      
      // Contains matching
      expect(utils.matchDeveloper('nhat')).toMatchObject({ name: 'nhat nguyen' })
      expect(utils.matchDeveloper('edward')).toMatchObject({ name: 'Edward Viet Ha Quoc' })
    })

    test('Developer username matching', () => {
      // Username format
      expect(utils.matchDeveloper('hung.pham')).toMatchObject({ name: 'hung.pham' })
    })

    test('Developer no match returns null', () => {
      expect(utils.matchDeveloper('nonexistent')).toBeNull()
      expect(utils.matchDeveloper('')).toBeNull()
      expect(utils.matchDeveloper(null)).toBeNull()
    })

    test('Project exact key matching', () => {
      // Exact key matches
      expect(utils.matchProject('BCP')).toMatchObject({ key: 'BCP', name: 'Borderless City Project' })
      expect(utils.matchProject('bcp')).toMatchObject({ key: 'BCP', name: 'Borderless City Project' })
      expect(utils.matchProject('CF')).toMatchObject({ key: 'CF', name: 'Calbee-FfF' })
    })

    test('Project name matching', () => {
      // Exact name matches
      expect(utils.matchProject('Borderless City Project')).toMatchObject({ key: 'BCP' })
      expect(utils.matchProject('wondertable')).toMatchObject({ key: 'WON', name: 'WonderTable' })
      
      // Contains matching
      expect(utils.matchProject('borderless')).toMatchObject({ key: 'BCP' })
      expect(utils.matchProject('enterprise')).toMatchObject({ key: 'ENT' })
    })

    test('Project no match returns null', () => {
      expect(utils.matchProject('nonexistent')).toBeNull()
      expect(utils.matchProject('')).toBeNull()
      expect(utils.matchProject(null)).toBeNull()
    })

    test('Timeframe matching', () => {
      // Exact matches
      expect(utils.matchTimeframe('month')).toBe('month')
      expect(utils.matchTimeframe('week')).toBe('week')
      expect(utils.matchTimeframe('quarter')).toBe('quarter')
      
      // Case insensitive
      expect(utils.matchTimeframe('MONTH')).toBe('month')
      expect(utils.matchTimeframe('Week')).toBe('week')
      
      // Partial matches
      expect(utils.matchTimeframe('m')).toBe('month')
      expect(utils.matchTimeframe('w')).toBe('week')
      expect(utils.matchTimeframe('q')).toBe('quarter')
      
      // Invalid defaults to month
      expect(utils.matchTimeframe('invalid')).toBe('month')
      expect(utils.matchTimeframe('')).toBe('month')
      expect(utils.matchTimeframe(null)).toBe('month')
    })
  })

  describe('URL Encoding/Decoding', () => {
    test('Filter to URL encoding', () => {
      const filters = {
        timeframe: 'week',
        developers: ['Andra Satria', 'Tuan Hoang'],
        projects: ['Borderless City Project', 'Calbee-FfF']
      }
      
      const params = utils.encodeFiltersToUrlParams(filters)
      
      expect(params.get('timeframe')).toBe('week')
      expect(params.get('developers')).toBe('Andra Satria,Tuan Hoang')
      expect(params.get('projects')).toBe('Borderless City Project,Calbee-FfF')
    })

    test('URL to filter decoding with smart matching', () => {
      const params = new URLSearchParams()
      params.set('timeframe', 'w')
      params.set('developers', 'andra,tuan,nonexistent')
      params.set('projects', 'bcp,cf,invalid')
      
      const filters = utils.decodeUrlParamsToFilters(params)
      
      expect(filters.timeframe).toBe('week')
      expect(filters.developers).toEqual(['Andra Satria', 'Tuan Hoang'])
      expect(filters.projects).toEqual(['Borderless City Project', 'Calbee-FfF'])
    })

    test('Empty parameters handling', () => {
      const emptyParams = new URLSearchParams()
      const filters = utils.decodeUrlParamsToFilters(emptyParams)
      
      expect(Object.keys(filters)).toHaveLength(0)
    })

    test('Default timeframe handling', () => {
      const filters = {
        timeframe: 'month',
        developers: [],
        projects: []
      }
      
      const params = utils.encodeFiltersToUrlParams(filters)
      
      // Default timeframe should not be encoded
      expect(params.has('timeframe')).toBe(false)
      expect(params.has('developers')).toBe(false)
      expect(params.has('projects')).toBe(false)
    })
  })

  describe('URL Validation', () => {
    test('Valid parameters pass validation', () => {
      const params = new URLSearchParams()
      params.set('timeframe', 'month')
      params.set('developers', 'andra,tuan')
      params.set('projects', 'bcp,cf')
      
      const validation = utils.validateUrlParams(params)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('Dangerous parameters fail validation', () => {
      const params = new URLSearchParams()
      params.set('__proto__', 'malicious')
      
      const validation = utils.validateUrlParams(params)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors[0]).toContain('Dangerous parameter')
    })

    test('Overly long parameters generate warnings', () => {
      const params = new URLSearchParams()
      const longValue = 'a'.repeat(1001)
      params.set('developers', longValue)
      
      const validation = utils.validateUrlParams(params)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors[0]).toContain('too long')
    })
  })

  describe('Feature Detection', () => {
    test('URL features detection', () => {
      const features = utils.detectUrlFeatures()
      
      expect(features).toHaveProperty('URLSearchParams')
      expect(features).toHaveProperty('URL')
      expect(features).toHaveProperty('pushState')
      expect(features).toHaveProperty('replaceState')
    })
  })

  describe('Shareable URL Creation', () => {
    test('Creates valid shareable URL', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
          pathname: '/developer-quality-dashboard'
        },
        writable: true
      })
      
      const filters = {
        timeframe: 'week',
        developers: ['Andra Satria'],
        projects: ['Borderless City Project']
      }
      
      const url = utils.createShareableUrl(filters)
      
      expect(url).toContain('http://localhost:3000/developer-quality-dashboard')
      expect(url).toContain('timeframe=week')
      expect(url).toContain('developers=Andra+Satria')
      expect(url).toContain('projects=Borderless+City+Project')
    })
  })

  describe('Performance Requirements', () => {
    test('Smart matching completes within performance targets', () => {
      // Test with multiple operations using functional approach
      const startTime = performance.now()
      
      for (let i = 0; i < 100; i++) {
        utils.matchDeveloper('andra')
        utils.matchProject('bcp')
        utils.matchTimeframe('w')
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should complete 300 operations within reasonable time (3ms per operation max)
      expect(totalTime).toBeLessThan(300) // 3ms per operation for 100 iterations is very generous
    })
  })

  describe('Error Handling', () => {
    test('Graceful handling of malformed input', () => {
      // Should not throw errors with malformed input using functional approach
      expect(() => utils.matchDeveloper(undefined)).not.toThrow()
      expect(() => utils.matchProject({})).not.toThrow()
      expect(() => utils.matchTimeframe(123)).not.toThrow()
      
      // Should return safe defaults
      expect(utils.matchDeveloper(undefined)).toBeNull()
      expect(utils.matchProject({})).toBeNull()
      expect(utils.matchTimeframe(123)).toBe('month')
    })

    test('URL encoding handles errors gracefully', () => {
      // Should not throw with malformed filters
      expect(() => utils.encodeFiltersToUrlParams(null)).not.toThrow()
      expect(() => utils.encodeFiltersToUrlParams(undefined)).not.toThrow()
      expect(() => utils.encodeFiltersToUrlParams({})).not.toThrow()
      
      // Should return valid URLSearchParams
      const result = utils.encodeFiltersToUrlParams(null)
      expect(result).toBeInstanceOf(URLSearchParams)
    })

    test('URL decoding handles errors gracefully', () => {
      // Should not throw with malformed parameters
      expect(() => utils.decodeUrlParamsToFilters(null)).not.toThrow()
      expect(() => utils.decodeUrlParamsToFilters(undefined)).not.toThrow()
      
      // Should return safe defaults
      const result = utils.decodeUrlParamsToFilters(null)
      expect(result).toEqual({})
    })
  })
})

// Integration test for real-world URL scenarios
describe('Real-world URL Scenarios', () => {
  let utils

  beforeAll(async () => {
    utils = await import('../urlFilterUtils')
  })

  test('Full URL roundtrip maintains data integrity', () => {
    const originalFilters = {
      timeframe: 'quarter',
      developers: ['Andra Satria', 'Edward Viet Ha Quoc'],
      projects: ['Borderless City Project', 'WonderTable']
    }
    
    // Encode to URL
    const params = utils.encodeFiltersToUrlParams(originalFilters)
    const urlString = params.toString()
    
    // Decode back from URL
    const decodedParams = new URLSearchParams(urlString)
    const decodedFilters = utils.decodeUrlParamsToFilters(decodedParams)
    
    // Should maintain data integrity
    expect(decodedFilters.timeframe).toBe(originalFilters.timeframe)
    expect(decodedFilters.developers).toEqual(originalFilters.developers)
    expect(decodedFilters.projects).toEqual(originalFilters.projects)
  })

  test('Partial name URL works as expected', () => {
    // User types partial names in URL
    const params = new URLSearchParams()
    params.set('timeframe', 'm')
    params.set('developers', 'andra,edward')
    params.set('projects', 'bcp,wonder')
    
    const filters = utils.decodeUrlParamsToFilters(params)
    
    expect(filters.timeframe).toBe('month')
    expect(filters.developers).toContain('Andra Satria')
    expect(filters.developers).toContain('Edward Viet Ha Quoc')
    expect(filters.projects).toContain('Borderless City Project')
    expect(filters.projects).toContain('WonderTable')
  })

  test('Mixed valid and invalid parameters', () => {
    const params = new URLSearchParams()
    params.set('timeframe', 'invalid')
    params.set('developers', 'andra,invaliddev,tuan')
    params.set('projects', 'bcp,invalidproj,cf')
    
    const filters = utils.decodeUrlParamsToFilters(params)
    
    // Invalid timeframe defaults to month
    expect(filters.timeframe).toBe('month')
    
    // Only valid developers included
    expect(filters.developers).toEqual(['Andra Satria', 'Tuan Hoang'])
    
    // Only valid projects included
    expect(filters.projects).toEqual(['Borderless City Project', 'Calbee-FfF'])
  })
})