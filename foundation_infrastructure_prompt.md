# Foundation Infrastructure Setup Prompt
## 🏗️ JIRA DMS Application Foundation

Generate the foundational infrastructure for the JIRA DMS application following strict coding conventions.

## CONTEXT
- Follow .claude/conventions.md STRICTLY
- Follow .claude/project-context.md specifications
- Project: React MUI SPA with analytics dashboards
- Focus: Navigation, API integration, and responsive foundation

---

## 🎯 REQUIREMENTS TO IMPLEMENT

### **1. LEFT SIDEBAR NAVIGATION**
- **Component**: Responsive sidebar with hide/show functionality
- **Structure**: 4 main menus, each with 2 sub-menus
- **Behavior**: Collapsible, mobile-responsive, persistent state

### **2. AXIOS API INTEGRATION**
- **API Flow**: FE → BE API → Pre-signed URLs → S3 Data
- **Features**: JWT interceptor, error handling, loading states
- **Data**: JIRA quarterly snapshots (100K+ records per file)

### **3. RESPONSIVE LAYOUT**
- **Design**: Mobile-first with MUI breakpoints
- **Navigation**: Drawer component with overlay/persistent modes
- **Content**: Dynamic content area that adapts to sidebar state

---

## 📁 REQUIRED FOLDER STRUCTURE

Generate this exact structure following conventions:

```
src/
├── components/
│   ├── navigation/
│   │   ├── Sidebar/
│   │   │   ├── index.js
│   │   │   ├── Sidebar.js
│   │   │   ├── Sidebar.test.js
│   │   │   └── SidebarStyles.js
│   │   ├── NavigationItem/
│   │   │   ├── index.js
│   │   │   ├── NavigationItem.js
│   │   │   └── NavigationItem.test.js
│   │   └── MobileNav/
│   │       ├── index.js
│   │       ├── MobileNav.js
│   │       └── MobileNav.test.js
│   └── ui/
│       ├── LoadingIndicator/
│       ├── ErrorBoundary/
│       └── Layout/
├── shared/
│   ├── services/
│   │   ├── apiService.js
│   │   ├── axiosConfig.js
│   │   ├── jiraDataService.js
│   │   └── authService.js
│   ├── store/
│   │   ├── navigationStore.js
│   │   ├── dataStore.js
│   │   └── uiStore.js
│   ├── hooks/
│   │   ├── useApi.js
│   │   ├── useJiraData.js
│   │   └── useNavigation.js
│   └── utils/
│       ├── apiUtils.js
│       └── navigationUtils.js
├── pages/
│   ├── Layout.js
│   └── Dashboard.js
└── App.js
```

---

## 🧭 NAVIGATION SPECIFICATIONS

### **Sidebar Menu Structure**
Generate this exact menu structure:

```javascript
const NAVIGATION_MENU = [
  {
    id: 'dashboards',
    title: 'Dashboards',
    icon: 'DashboardIcon',
    children: [
      { id: 'main-dashboard', title: 'Main Dashboard', path: '/main-dashboard' },
      { id: 'quality-dashboard', title: 'Quality Dashboard', path: '/quality-dashboard' }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: 'AnalyticsIcon',
    children: [
      { id: 'developer-metrics', title: 'Developer Metrics', path: '/analytics/developers' },
      { id: 'qa-metrics', title: 'QA Metrics', path: '/analytics/qa' }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'AssessmentIcon',
    children: [
      { id: 'sprint-reports', title: 'Sprint Reports', path: '/reports/sprints' },
      { id: 'project-reports', title: 'Project Reports', path: '/reports/projects' }
    ]
  },
  {
    id: 'administration',
    title: 'Administration',
    icon: 'SettingsIcon',
    children: [
      { id: 'user-management', title: 'User Management', path: '/admin/users' },
      { id: 'system-settings', title: 'System Settings', path: '/admin/settings' }
    ]
  }
]
```

### **Sidebar Features**
- **Collapse/Expand**: Toggle button with animation
- **Active State**: Highlight current page
- **Hover Effects**: Interactive feedback
- **Mobile Responsive**: Overlay drawer on mobile
- **Persistent State**: Remember collapsed state
- **Smooth Animations**: MUI transitions

---

## 🌐 API INTEGRATION SPECIFICATIONS

### **Real API Response Structure**
Based on the provided payload, implement handling for:

```javascript
// API Response Structure (from your file)
{
  "success": true,
  "downloadStrategy": "quarterly-snapshots",
  "message": "Using quarterly snapshots for efficient download",
  "data": {
    "snapshots": [
      {
        "year": 2025,
        "quarter": 1,
        "url": "https://jira-dms-store-issues.s3.ap-southeast-1.amazonaws.com/...",
        "recordCount": 101960,
        "fileSize": 101960636,
        "expiresIn": 86400
      }
    ],
    "currentQuarter": {
      "url": "https://jira-dms-store-issues.s3.ap-southeast-1.amazonaws.com/...",
      "recordCount": 5185,
      "fileSize": 5185551,
      "expiresIn": 3600
    }
  },
  "metadata": {
    "fromDate": "2025/01/01",
    "toDate": "2025/07/11",
    "selectedProjects": ["WON", "YUIM", "STU", ...],
    "totalQuarters": 3,
    "estimatedTotalRecords": 246190
  }
}
```

### **API Service Requirements**

#### **1. Axios Configuration (axiosConfig.js)**
```javascript
// REQUIRED: Implement these exact features
- Base URL configuration
- JWT token interceptor (Authorization header)
- Request/Response interceptors
- Error handling interceptor
- Loading state management
- Timeout configuration (30 seconds)
- Retry logic for failed requests
```

#### **2. JIRA Data Service (jiraDataService.js)**
```javascript
// REQUIRED: Implement these exact methods
- fetchJiraSnapshots(): Get snapshot URLs from BE
- downloadSnapshotData(url): Download data from pre-signed URL
- processSnapshotsData(snapshots): Process quarterly data
- getCurrentQuarterData(): Get current quarter data
- mergeQuarterlyData(data): Combine all quarterly data
- cacheSnapshotData(data): Cache large datasets
```

#### **3. Error Handling**
```javascript
// REQUIRED: Handle these specific errors
- Network errors (connection issues)
- Authentication errors (401/403)
- Rate limiting (429)
- Server errors (500+)
- Pre-signed URL expiration
- Large file download failures
- JSON parsing errors
```

#### **4. Loading States**
```javascript
// REQUIRED: Implement these loading states
- Global loading indicator
- Component-level loading (skeleton screens)
- Progress bars for large downloads
- Download progress for 100MB+ files
- Queue status for multiple snapshots
```

---

## 📱 RESPONSIVE DESIGN SPECIFICATIONS

### **Breakpoint Behavior**
```javascript
// REQUIRED: Implement exact responsive behavior
Mobile (xs: 0-600px):
- Sidebar: Temporary drawer (overlay)
- Content: Full width
- Navigation: Hamburger menu

Tablet (sm: 600-900px):
- Sidebar: Temporary drawer (overlay) 
- Content: Full width
- Navigation: Hamburger menu

Desktop (md: 900px+):
- Sidebar: Persistent drawer (side-by-side)
- Content: Adjusts to sidebar width
- Navigation: Always visible
```

### **Sidebar Responsive States**
```javascript
// REQUIRED: Implement these exact states
const SIDEBAR_STATES = {
  CLOSED: 'closed',           // Desktop: collapsed, Mobile: hidden
  OPEN: 'open',              // Desktop: expanded, Mobile: overlay
  MOBILE_OVERLAY: 'overlay'   // Mobile only: temporary overlay
}

const SIDEBAR_WIDTHS = {
  EXPANDED: 280,    // Full sidebar width
  COLLAPSED: 64,    // Icon-only width
  MOBILE: 280       // Mobile overlay width
}
```

---

## 🏪 STATE MANAGEMENT SPECIFICATIONS

### **Navigation Store (Zustand)**
```javascript
// REQUIRED: Implement exact store pattern
export const useNavigationStore = create((set, get) => ({
  // State
  isOpen: false,
  isMobile: false,
  activeItem: null,
  isLoading: false,
  
  // Actions
  toggleSidebar: () => set(state => ({ isOpen: !state.isOpen })),
  setMobile: (isMobile) => set({ isMobile }),
  setActiveItem: (item) => set({ activeItem: item }),
  closeSidebar: () => set({ isOpen: false }),
  openSidebar: () => set({ isOpen: true })
}))
```

### **Data Store (Zustand)**
```javascript
// REQUIRED: Implement exact store pattern
export const useDataStore = create((set, get) => ({
  // State
  snapshots: [],
  currentQuarter: null,
  allIssues: [],
  isLoading: false,
  error: null,
  downloadProgress: {},
  
  // Actions
  setSnapshots: (snapshots) => set({ snapshots }),
  setAllIssues: (issues) => set({ allIssues: issues }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  
  // Async Actions
  fetchJiraData: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await jiraDataService.fetchJiraSnapshots()
      set({ snapshots: response.data.snapshots })
      
      // Download all snapshot data
      const allData = await jiraDataService.processSnapshotsData(response.data)
      set({ allIssues: allData, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  }
}))
```

---

## 🎨 MUI THEME INTEGRATION

### **Sidebar Theme Configuration**
```javascript
// REQUIRED: Add to your theme configuration
const theme = createTheme({
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        },
      },
    },
  },
})
```

---

## 🧪 TESTING REQUIREMENTS

### **Component Tests**
```javascript
// REQUIRED: Generate tests for all components
describe('Sidebar', () => {
  it('renders without crashing', () => {})
  it('toggles open/closed state', () => {})
  it('handles mobile responsive behavior', () => {})
  it('highlights active navigation item', () => {})
  it('renders all menu items correctly', () => {})
})

describe('ApiService', () => {
  it('configures axios with JWT interceptor', () => {})
  it('handles authentication errors', () => {})
  it('retries failed requests', () => {})
  it('downloads large files with progress', () => {})
})
```

---

## ✅ VALIDATION CHECKLIST

Before submitting, verify:
- [ ] **Folder Structure**: Exact structure following conventions
- [ ] **React.memo**: All components wrapped
- [ ] **PropTypes**: All props validated
- [ ] **MUI sx prop**: No style/className props
- [ ] **Zustand stores**: Proper patterns implemented
- [ ] **Responsive design**: All breakpoints working
- [ ] **API integration**: JWT, error handling, loading states
- [ ] **Tests**: Comprehensive coverage
- [ ] **Navigation**: 4 menus × 2 sub-menus working
- [ ] **File downloads**: Large file handling (100MB+)

---

## 🚀 GENERATION ORDER

Generate in this exact order:
1. **Zustand stores** (navigation, data, ui)
2. **Axios configuration** and services
3. **Sidebar component** with responsive behavior
4. **Navigation items** and mobile handling
5. **Layout component** integrating sidebar
6. **API hooks** for data fetching
7. **Loading and error components**
8. **Tests** for all components
9. **App.js** integration
10. **Documentation** and usage examples

---

## 🎯 SUCCESS CRITERIA

The foundation is complete when:
- Sidebar slides in/out smoothly
- Mobile responsive (drawer overlay)
- API downloads 240K+ records successfully
- JWT authentication working
- Error handling prevents crashes
- Loading states provide user feedback
- All 8 navigation items render correctly
- Responsive breakpoints function properly

Generate: Complete foundation infrastructure following all conventions and specifications above.