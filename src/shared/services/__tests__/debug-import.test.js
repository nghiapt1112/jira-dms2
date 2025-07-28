/**
 * Debug test to check module imports
 */

// Try different import methods
const import1 = require('../StoryPointCalculator.js')
const import2 = require('../StoryPointCalculator')
const import3 = require('../StoryPointCalculator').default

console.log('Import 1:', typeof import1, Object.keys(import1 || {}))
console.log('Import 2:', typeof import2, Object.keys(import2 || {}))
console.log('Import 3:', typeof import3, Object.keys(import3 || {}))

describe('Debug Import', () => {
  it('should import something', () => {
    expect(import1).toBeDefined()
    expect(import2).toBeDefined()
    expect(typeof import1).toBe('function')
    expect(typeof import2).toBe('function')
  })
}) 