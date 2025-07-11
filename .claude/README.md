# Claude Code Automated Workflow System

## 🎯 Overview
This is a comprehensive automated workflow system designed to maintain living memory for Claude Code sessions, track implementation progress against your detailed implementation plan, and automatically manage context and git commits.

## 🏗️ System Components

### 1. Auto-Context Management
**Files**: `scripts/auto-context.js`, `CLAUDE_CODE_WORKFLOW.md`
- **Purpose**: Maintains real-time project context and component inventory
- **Features**: Auto-detection of new components, features, and services
- **Usage**: `npm run claude:auto-inject` to get current context for Claude Code

### 2. Phase Tracking System  
**Files**: `scripts/phase-tracker.js`, `AUTOMATED_PHASE_WORKFLOW.md`
- **Purpose**: Monitors implementation plan progress and auto-commits phase completions
- **Features**: Tracks 6 phases from your implementation plan with file-based detection
- **Usage**: `npm run claude:phase-status` to check progress

### 3. Static Context & Conventions
**Files**: `conventions.md`, `project-context.md`
- **Purpose**: Provides coding standards and project architecture guidelines
- **Features**: Strict rulebook for React, MUI, and project structure
- **Usage**: Reference files for Claude Code implementation standards

### 4. Knowledge Base
**Directory**: `knowledge-base/`
- **Purpose**: Persistent storage for context, progress, and implementation history
- **Features**: Auto-updating JSON context, progress logs, implementation tracking
- **Usage**: Automatically managed by the workflow system

## 🚀 Quick Start Workflow

### 1. Initial Setup (One-time)
```bash
# Setup the entire workflow system
npm run claude:setup-workflow
```

### 2. Before Claude Code Session
```bash
# Get current project context and implementation status
npm run claude:auto-inject

# Check implementation plan progress
npm run claude:phase-status
```

### 3. Using Context with Claude Code
Copy the output from `claude:auto-inject` and include it in your Claude Code prompt:

```
Here's my current project context:
[paste auto-inject output]

Based on this context and the implementation plan in doc/dashboard/main-dashboard/implementation-plan.md, 
please implement Phase 1: Core Infrastructure.

Focus on implementing:
- Data transformation service (transformIssuesForProjectOverview.js)
- Cache management hook (useMainDashboardCache.js)  
- Supporting services (projectOverview.service.js, etc.)

Follow the conventions in .claude/conventions.md for React patterns and MUI usage.
```

### 4. After Claude Code Implementation
```bash
# Check if phase was automatically detected as complete
npm run claude:phase-check

# View updated project status
npm run claude:phase-status

# Update context with any new changes
npm run claude:auto-scan
```

## 📋 Available Commands

### Context Management
- `npm run claude:auto-inject` - Generate context for Claude Code
- `npm run claude:auto-scan` - Scan project and update context  
- `npm run claude:auto-status` - Show current context status
- `npm run claude:auto-analyze [file]` - Analyze specific file or project

### Phase Tracking
- `npm run claude:phase-status` - Show implementation plan progress
- `npm run claude:phase-check` - Check for phase completion
- `npm run claude:phase-watch` - Monitor files for real-time detection
- `npm run claude:phase-report` - Generate detailed JSON report

### Legacy Commands (still available)
- `npm run claude:init` - Initialize knowledge base
- `npm run claude:update-context` - Update context (old system)
- `npm run claude:status` - Legacy status check

## 🎯 Implementation Plan Integration

Your system is configured to track these phases from `doc/dashboard/main-dashboard/implementation-plan.md`:

### Phase 1: Core Infrastructure (Week 1) - Critical
- **Files**: Data transformation, cache management, supporting services
- **Auto-detection**: 7 files + 2 tests required (80% threshold)
- **Dependencies**: None (can start immediately)

### Phase 2: ProjectHealthOverview (Week 2) - High  
- **Files**: Scatter charts, health table components
- **Auto-detection**: 4 files + 2 tests required (75% threshold)
- **Dependencies**: Phase 1 must be completed

### Phase 3: ProjectDelivery (Week 3) - High
- **Files**: Delivery dashboard components  
- **Auto-detection**: 4 files + 2 tests required (75% threshold)
- **Dependencies**: Phase 1 must be completed

### Phase 4: SprintMetrics (Week 4) - Medium
- **Files**: Sprint analytics and charts
- **Auto-detection**: 5 files + 2 tests required (80% threshold)  
- **Dependencies**: Phase 1 must be completed

### Phase 5: Cache UI (Week 5) - Low
- **Files**: Cache management interface
- **Auto-detection**: 2 files + 2 tests required (50% threshold)
- **Dependencies**: Phase 1 must be completed

### Phase 6: Integration (Week 6) - Critical
- **Files**: Main dashboard container and routing
- **Auto-detection**: 2 files + 1 test + route integration (100% threshold)
- **Dependencies**: Phases 2, 3, and 4 must be completed

## 🔄 Automatic Actions

### When Phase Completes
1. **Context Update**: Adds phase completion to knowledge base
2. **Git Commit**: Creates descriptive commit with phase details
3. **Progress Log**: Updates implementation log with completion details
4. **Metrics Update**: Refreshes overall project progress percentages

### Example Auto-Generated Commit
```
feat(dashboard): Complete Phase 1: Core Infrastructure

Data transformation, cache management, and supporting services

✅ Completed: 7/7 files
🧪 Tests: 2/2  
📊 Progress: 100%

Implemented files:
- src/features/dashboard/services/transformIssuesForProjectOverview.js
- src/features/dashboard/hooks/useMainDashboardCache.js
[... more files]

Phase: phase1-infrastructure
Priority: Critical
Timeline: Week 1

Auto-generated by phase-tracker
```

## 📊 Context Enhancement

The auto-context system now provides Claude Code with:

### Static Context (from your existing files)
- Coding conventions and standards
- Project architecture and tech stack
- File naming and structure rules

### Dynamic Context (auto-generated)
- Real-time component and feature inventory
- Implementation plan progress (0-100% per phase)  
- Recent development activity
- Current priorities and recommendations
- Code quality metrics and suggestions

### Combined Context Example
```json
{
  "projectSummary": {
    "totalFeatures": 3,
    "totalComponents": 15,
    "codeQuality": "good"
  },
  "implementationPlan": {
    "overallProgress": 33,
    "currentPhase": "phase2-project-health",
    "completedPhases": ["phase1-infrastructure"],
    "nextPhases": ["phase2-project-health", "phase3-project-delivery"]
  },
  "recentActivity": [
    "completed phase: phase1-infrastructure",
    "created component: useMainDashboardCache",
    "created service: transformIssuesForProjectOverview"
  ]
}
```

## 🎛️ Configuration

### Customize Phase Detection
Edit `.claude/scripts/phase-tracker.js`:
- Modify file requirements per phase
- Adjust completion thresholds (50%-100%)
- Change dependency relationships
- Update timeline expectations

### Customize Auto-Context
Edit `.claude/scripts/auto-context.js`:
- Modify component analysis logic
- Adjust code quality metrics
- Change recommendation algorithms
- Update context injection format

## 🔧 Troubleshooting

### Phase Not Detected
```bash
# Check what files exist vs expected
npm run claude:phase-check

# View detailed missing files
npm run claude:phase-status

# Force complete phase for testing
node .claude/scripts/phase-tracker.js force phase1-infrastructure
```

### Context Missing Implementation Plan Info
```bash
# Update context to include phase data
npm run claude:auto-scan

# Verify phase info is included
npm run claude:auto-inject | grep -A 10 "implementationPlan"
```

### Commands Not Found
```bash
# Verify package.json has all commands
cat package.json | grep claude:

# Reinstall if needed
npm install
```

## 🏆 Benefits

### For Development
- **Zero Manual Context Management** - Everything updates automatically
- **Consistent Implementation** - Claude Code always follows your patterns
- **Progress Visibility** - Clear view of implementation plan status
- **Quality Assurance** - Built-in standards enforcement

### For Project Management  
- **Automatic Documentation** - Self-documenting progress and decisions
- **Audit Trail** - Complete history of what was implemented when
- **Milestone Tracking** - Real-time progress against implementation plan
- **Team Coordination** - Shared context across sessions and team members

### For Code Quality
- **Pattern Enforcement** - Automatic adherence to conventions
- **Test Coverage** - Phase completion requires tests
- **Architecture Consistency** - Structured implementation approach
- **Performance Optimization** - Built-in performance patterns

## 📚 Documentation Files

- `CLAUDE_CODE_WORKFLOW.md` - Basic auto-context workflow
- `AUTOMATED_PHASE_WORKFLOW.md` - Detailed phase tracking system
- `conventions.md` - Strict coding standards and rules
- `project-context.md` - Project overview and tech stack
- `implementation-plan.md` - Your detailed 6-phase implementation plan

---

**🚀 Your Claude Code workflow is now fully automated!** The system will maintain living memory, track progress against your implementation plan, and automatically commit completed phases.
