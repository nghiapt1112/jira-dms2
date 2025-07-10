export const downloadUtils = {
  // Format bytes to human readable string
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  },
  
  // Calculate download time estimate
  estimateDownloadTime: (fileSizeBytes, speedBytesPerSecond = 1000000) => {
    const timeSeconds = fileSizeBytes / speedBytesPerSecond
    
    if (timeSeconds < 60) {
      return `${Math.ceil(timeSeconds)}s`
    } else if (timeSeconds < 3600) {
      return `${Math.ceil(timeSeconds / 60)}m`
    } else {
      return `${Math.ceil(timeSeconds / 3600)}h`
    }
  },
  
  // Get download speed in human readable format
  formatSpeed: (bytesPerSecond) => {
    return `${downloadUtils.formatBytes(bytesPerSecond)}/s`
  }
}