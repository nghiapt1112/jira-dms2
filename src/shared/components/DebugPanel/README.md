# Debug Panel - Global Debugging Component

## Overview

The Debug Panel is a comprehensive debugging component that provides global access to debugging functionality across all routes. It includes Export Logs and Fresh Data capabilities with a modern MUI-based interface.

## Features

### 🐛 **Global Access**
- **Floating Action Button (FAB)**: Always visible debug button on bottom-right (desktop only)
- **Zustand State Management**: Shared state across all routes and components
- **MUI Drawer Interface**: Professional, responsive debugging panel

### 📥 **Export Logs**
- **Comprehensive Log Export**: Downloads JSON file with:
  - Browser console logs
  - Application state (JIRA data, developer quality data)
  - Performance metrics (memory usage, timing)
  - Local/session storage contents (sensitive data filtered)
  - User agent and environment info
- **Downloadable File**: `debug-logs-YYYY-MM-DD-timestamp.json`
- **Secure**: Automatically filters out tokens, passwords, secrets

### 🔄 **Fresh Data**
- **Complete Data Refresh**: Calls `/issues/v3` API endpoint
- **Full Pipeline**: Download → Process → Cache → Update all stores
- **Progress Tracking**: Real-time progress with stage descriptions
- **Error Handling**: Comprehensive error reporting and recovery
- **Multi-Store Update**: Refreshes JIRA data + dependent stores

## Components

### 1. DebugStore (`/src/shared/store/debugStore.js`)
- **Zustand store** for global debug state management
- **Export functionality** with browser log capture
- **Refresh functionality** with progress tracking
- **Console access**: `window.debugStore` for browser debugging

### 2. DebugPanel (`/src/shared/components/DebugPanel/DebugPanel.jsx`)
- **MUI Drawer** with professional design
- **Progress indicators** for operations
- **Status overview** with timestamps
- **Debug information** display (memory, browser, etc.)

### 3. DebugFab (`/src/shared/components/DebugPanel/DebugFab.jsx`)
- **Floating Action Button** for global access
- **Visual indicators**: Colors and badges show status
- **Animations**: Rotating icon during operations
- **Responsive**: Hidden on mobile to avoid clutter

## Integration

### Layout Integration
The debug components are integrated in the main Layout component:

```jsx
// src/components/ui/Layout/Layout.js
import { DebugPanel, DebugFab } from '../../../shared/components/DebugPanel'

// Added after GlobalCachePopover
<DebugPanel />
<DebugFab />
```

This ensures global availability across all routes that use the Layout component.

## Usage

### For Users
1. **Access**: Click the debug FAB button (bottom-right corner)
2. **Export Logs**: Click "Export Logs" to download debug information
3. **Fresh Data**: Click "Fresh Data" to force complete data refresh
4. **Monitor Progress**: Watch real-time progress bars and status updates

### For Developers
```javascript
// Browser console access
window.debugStore.getState().exportLogs()
window.debugStore.getState().refreshData()
window.debugStore.getState().getSummary()
```

## State Management

### Debug Store State
```javascript
{
  isOpen: false,           // Panel open/closed
  isExporting: false,      // Export in progress
  isRefreshing: false,     // Refresh in progress
  refreshProgress: 0,      // 0-100 progress
  refreshStage: null,      // Current operation description
  lastExport: null,        // Last export timestamp
  lastRefresh: null,       // Last refresh timestamp
  error: null              // Current error message
}
```

### Actions Available
- `open()`, `close()`, `toggle()` - Panel control
- `exportLogs()` - Export debug information
- `refreshData()` - Force data refresh
- `clearError()` - Clear error state
- `getSummary()` - Get status summary

## Security Features

### Data Filtering
- **Sensitive Data**: Automatically excludes tokens, passwords, secrets
- **Safe Export**: Only exports non-sensitive debugging information
- **Local Processing**: All data processing happens client-side

### Error Handling
- **Graceful Degradation**: Continues operation if some data unavailable
- **Comprehensive Logging**: Captures errors for debugging
- **User Feedback**: Clear error messages with recovery options

## Performance

### Optimizations
- **Lazy Loading**: Dynamic imports to avoid circular dependencies
- **Memory Management**: Limited log retention (1000 entries max)
- **Efficient Rendering**: React.memo and useCallback optimizations
- **Responsive Design**: Mobile-friendly with appropriate hiding

### Resource Usage
- **Minimal Impact**: Only active when panel is open
- **Background Processing**: Non-blocking operations
- **Memory Conscious**: Automatic cleanup of old logs

## Development Notes

### Architecture Decisions
- **Zustand**: Chosen for simplicity and global state management
- **MUI Drawer**: Professional, accessible, responsive interface
- **Dynamic Imports**: Prevents circular dependencies with other stores
- **Floating Access**: Always available but unobtrusive

### File Structure
```
src/shared/components/DebugPanel/
├── README.md              # This documentation
├── index.js              # Component exports
├── DebugPanel.jsx        # Main drawer component
└── DebugFab.jsx          # Floating action button

src/shared/store/
└── debugStore.js         # Zustand store
```

### Dependencies
- **Zustand**: State management
- **Material-UI**: UI components
- **react-hot-toast**: Notifications
- **Browser APIs**: Performance, storage access

## Troubleshooting

### Common Issues
1. **Export Not Working**: Check browser permissions for file downloads
2. **Refresh Failing**: Verify API endpoint accessibility and authentication
3. **Panel Not Opening**: Check for JavaScript errors in console
4. **Missing Data**: Ensure required stores are properly initialized

### Browser Console Debugging
```javascript
// Check debug store state
window.debugStore.getState()

// Manually trigger operations
window.debugStore.getState().exportLogs()
window.debugStore.getState().refreshData()

// Check for errors
console.log(window.debugStore.getState().error)
```

## Future Enhancements

- Real-time log streaming
- Advanced filtering options
- Performance profiling integration
- Network request monitoring
- Custom debug commands

---

**Global Access** | **Professional UI** | **Comprehensive Logging** | **Secure & Performant**