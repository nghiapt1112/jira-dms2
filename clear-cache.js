/**
 * Utility script to clear IndexedDB cache for testing
 */

// Function to clear the IndexedDB
async function clearDeveloperQualityCache() {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase('indexed-developer-quality-dashboard');
    
    deleteRequest.onsuccess = () => {
      console.log('✅ IndexedDB cache cleared successfully');
      resolve(true);
    };
    
    deleteRequest.onerror = () => {
      console.error('❌ Failed to clear IndexedDB cache');
      reject(deleteRequest.error);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('⚠️ IndexedDB deletion blocked - close other tabs using this database');
    };
  });
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.clearDeveloperQualityCache = clearDeveloperQualityCache;
}

console.log('To clear the cache, run: clearDeveloperQualityCache()');