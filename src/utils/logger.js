// Logger utility for debugging
class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Prevent memory issues
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  log(level, component, message, data = null) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };

    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with emoji for easy scanning
    const emoji = {
      'DEBUG': '🔍',
      'INFO': 'ℹ️',
      'WARN': '⚠️',
      'ERROR': '❌',
      'HEATMAP': '🔥',
      'FILTER': '🔧'
    };

    console.log(`${emoji[level] || '📝'} [${timestamp}] ${component}: ${message}`, data || '');
  }

  debug(component, message, data) {
    this.log('DEBUG', component, message, data);
  }

  info(component, message, data) {
    this.log('INFO', component, message, data);
  }

  warn(component, message, data) {
    this.log('WARN', component, message, data);
  }

  error(component, message, data) {
    this.log('ERROR', component, message, data);
  }

  heatmap(component, message, data) {
    this.log('HEATMAP', component, message, data);
  }

  filter(component, message, data) {
    this.log('FILTER', component, message, data);
  }

  // Export logs to downloadable file
  exportLogs() {
    const logText = this.logs.map(entry => {
      const dataStr = entry.data ? `\nData: ${entry.data}` : '';
      return `[${entry.timestamp}] ${entry.level} - ${entry.component}: ${entry.message}${dataStr}`;
    }).join('\n\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get logs for a specific component
  getComponentLogs(component) {
    return this.logs.filter(entry => entry.component === component);
  }

  // Clear all logs
  clear() {
    this.logs = [];
    console.clear();
  }

  // Get logs as formatted string for reading
  getLogsAsString() {
    return this.logs.map(entry => {
      const dataStr = entry.data ? `\nData: ${entry.data}` : '';
      return `[${entry.timestamp}] ${entry.level} - ${entry.component}: ${entry.message}${dataStr}`;
    }).join('\n\n');
  }
}

// Create singleton instance
const logger = new Logger();

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  window.logger = logger;
}

export default logger;