// Run this in browser console to inspect cache
console.log('🔍 Inspecting all cache data...')

// Check localStorage
console.log('📋 localStorage keys:')
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  const value = localStorage.getItem(key)
  console.log(`  ${key}: ${value.length} chars`)
  
  // Check if it might contain JIRA data
  try {
    const parsed = JSON.parse(value)
    if (parsed.data && Array.isArray(parsed.data)) {
      console.log(`    └─ Array with ${parsed.data.length} items`)
      if (parsed.data.length > 0) {
        console.log(`    └─ Sample item keys:`, Object.keys(parsed.data[0]))
      }
    }
    if (parsed.timestamp) {
      console.log(`    └─ Timestamp: ${new Date(parsed.timestamp).toISOString()}`)
    }
  } catch (e) {
    // Not JSON
  }
}

// Function to search for JIRA issues in all storage
function searchForJiraData() {
  console.log('🔍 Searching for JIRA issues in all storage...')
  
  // Check localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const value = localStorage.getItem(key)
    
    try {
      const parsed = JSON.parse(value)
      
      // Look for arrays that might contain JIRA issues
      if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 1000) {
        console.log(`🎯 Found large array in localStorage[${key}]: ${parsed.data.length} items`)
        
        // Check if it looks like JIRA data
        if (parsed.data[0] && (parsed.data[0].key || parsed.data[0].fields)) {
          console.log(`✅ This looks like JIRA data!`)
          return { storage: 'localStorage', key, data: parsed.data }
        }
      }
      
      // Also check direct arrays
      if (Array.isArray(parsed) && parsed.length > 1000) {
        console.log(`🎯 Found large direct array in localStorage[${key}]: ${parsed.length} items`)
        if (parsed[0] && (parsed[0].key || parsed[0].fields)) {
          console.log(`✅ This looks like JIRA data!`)
          return { storage: 'localStorage', key, data: parsed }
        }
      }
      
    } catch (e) {
      // Not JSON
    }
  }
  
  console.log('❌ No large JIRA data arrays found in localStorage')
  return null
}

// Run the search
const found = searchForJiraData()
if (found) {
  console.log('🎉 Found JIRA data:', found)
} else {
  console.log('💀 No JIRA data found in localStorage')
}