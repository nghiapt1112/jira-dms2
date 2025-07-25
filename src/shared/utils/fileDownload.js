/**
 * File download utility - Reusable download functionality
 * Follows DRY principle by centralizing file download logic
 */

/**
 * Downloads data as a JSON file
 * @param {Object} data - Data to download
 * @param {string} filename - Filename for download
 * @returns {Promise<{success: boolean, filename: string, size: number}>}
 */
export const downloadAsJson = async (data, filename) => {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return {
      success: true,
      filename,
      size: blob.size
    }
  } catch (error) {
    console.error('File download failed:', error)
    throw new Error(`Download failed: ${error.message}`)
  }
}

/**
 * Downloads text content as a file
 * @param {string} content - Text content to download
 * @param {string} filename - Filename for download
 * @param {string} mimeType - MIME type for the file
 * @returns {Promise<{success: boolean, filename: string, size: number}>}
 */
export const downloadAsText = async (content, filename, mimeType = 'text/plain') => {
  try {
    const blob = new Blob([content], { type: mimeType })
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return {
      success: true,
      filename,
      size: blob.size
    }
  } catch (error) {
    console.error('File download failed:', error)
    throw new Error(`Download failed: ${error.message}`)
  }
}

/**
 * Generates a timestamped filename
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension (without dot)
 * @returns {string} Timestamped filename
 */
export const generateTimestampedFilename = (prefix, extension) => {
  const timestamp = new Date().toISOString().split('T')[0]
  const timeMs = Date.now()
  return `${prefix}-${timestamp}-${timeMs}.${extension}`
}