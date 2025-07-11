# Phase-by-Phase Claude Code Workflow

## Overview
This workflow captures **complete implementation context** for each phase, including:
- 📝 **Conversation history** with Claude Code
- 🔧 **Code changes** and git state
- 💡 **Implementation decisions** made
- 🎯 **Patterns identified** during development
- 📊 **Automatic context updates** and commits

## 🚀 Complete Phase Implementation Workflow

### Step 1: Start a Phase Session
```bash
npm run claude:start-session <phaseId> "<implementation request>"
```

**Example:**
```bash
npm run claude:start-session phase1-infrastructure "Implement data transformation service and cache management system according to implementation plan"
```

**This will:**
- 📊 Generate enhanced prompt with project context
- 📁 Create session tracking
- 🔍 Capture current git state
- 📋 Include implementation plan details
- 🎯 Provide specific technical requirements

### Step 2: Use Enhanced Prompt with Claude Code
The system generates a comprehensive prompt like:

```
# Claude Code Implementation Request

## 📋 Phase Information
Phase: phase1-infrastructure - Data transformation, cache management, supporting services
Session ID: phase1-infrastructure-abc12345
Priority: Critical
Timeline: Week 1

## 🎯 Implementation Request
Implement data transformation service and cache management system according to implementation plan

## 📊 Current Project Context
[Auto-generated current project state]

## 🏗️ Phase Implementation Plan
[Specific phase requirements from implementation-plan.md]

## 📚 Implementation History
[Previous sessions and patterns]

## 🔧 Technical Requirements
[Detailed coding standards and patterns]

## 📋 Expected Deliverables
[Phase-specific deliverables]

## 📝 Session Tracking
[Instructions for ending session]
```

### Step 3: Copy Prompt to Claude Code
1. **Copy the entire enhanced prompt**
2. **Paste it to Claude Code**
3. **Let Claude Code implement the phase**

### Step 4: End Session and Capture Results
```bash
npm run claude:end-session <sessionId> "conversation notes" "implementation summary"
```

**Example:**
```bash
npm run claude:end-session phase1-infrastructure-abc12345 "Claude implemented cache hook with performance monitoring and data transformation service with quality metrics calculation" "Successfully implemented useMainDashboardCache hook and transformIssuesForProjectOverview service with comprehensive error handling and performance optimization"
```

**This will:**
- 📊 Analyze code changes since session start
- 📝 Create intelligent commit message
- 🔍 Extract implementation patterns
- 💡 Document decisions made
- 🏷️ Auto-commit with rich context
- 📈 Update knowledge base

## 🎯 Detailed Example: Phase 1 Implementation

### 1. Start Phase 1 Session
```bash
npm run claude:start-session phase1-infrastructure "Implement the core infrastructure including data transformation service, cache management hook, and supporting services for project overview, quality, and delivery metrics"
```

**Output:**
```
🚀 Starting Claude Code session for phase1-infrastructure
📝 Session ID: phase1-infrastructure-a7b8c9d0

📋 ENHANCED PROMPT FOR CLAUDE CODE:
================================================================================
# Claude Code Implementation Request

## 📋 Phase Information
**Phase**: phase1-infrastructure - Data transformation, cache management, supporting services
**Session ID**: phase1-infrastructure-a7b8c9d0
**Priority**: Critical
**Timeline**: Week 1

## 🎯 Implementation Request
Implement the core infrastructure including data transformation service, cache management hook, and supporting services for project overview, quality, and delivery metrics

## 📊 Current Project Context
Features: 3
Components: 1
Code Quality: fair
Recent Activity: index, index, index

## 🏗️ Phase Implementation Plan
**Requirements**: FR-MD-001, FR-MD-002, PR-MD-001, IR-MD-002

**Tasks**:
1. Implement project data transformation logic
2. Calculate quality metrics with bug severity weighting
3. Compute delivery performance metrics
4. Generate sprint metrics (timeliness, scope creep)
5. Apply health score calculations (Quality 40%, Bug Rate 30%, Progress 30%)
6. Implement cache key generation based on project selection
7. Create cache invalidation logic
8. Add performance monitoring and statistics
9. Build manual cache management controls
10. Target: <10ms cache hit response time

**Expected Files**:
- src/features/dashboard/services/transformIssuesForProjectOverview.js
- src/features/dashboard/hooks/useMainDashboardCache.js
- src/features/dashboard/services/projectOverview.service.js
- src/features/dashboard/services/projectQuality.service.js
- src/features/dashboard/services/projectDelivery.service.js
- src/features/dashboard/services/sprintMetricsData.service.js
- src/features/dashboard/services/sprintMetricsDetails.service.js

## 🔧 Technical Requirements
- Follow conventions in .claude/conventions.md
- Use React 18+ with hooks and memo
- Material-UI v6 components with sx prop only
- Zustand for state management
- File extension: .jsx for React components, .js for utilities
- Include PropTypes for all components
- Add tests in __tests__ directory

## 🎨 Code Quality Standards
- React.memo for all components
- PropTypes validation
- Performance optimization with useMemo/useCallback
- Responsive design with MUI breakpoints
- Error handling and loading states
- Clean, readable code with proper naming

## 📋 Expected Deliverables
1. Data transformation service with quality metrics
2. Cache management hook with performance monitoring
3. Supporting services for project overview, quality, delivery
4. Sprint metrics processing services
5. Unit tests for all services and hooks
6. Error handling implementation
7. Performance optimizations targeting <10ms cache hits

## 📝 Session Tracking
Please implement the requested functionality. After completion, run:
```bash
npm run claude:end-session phase1-infrastructure-a7b8c9d0 "conversation summary" "implementation summary"
```

---
**🤖 This request is being tracked for automatic context updates and git commits.**
================================================================================

📌 Copy the above prompt to Claude Code
📁 Session tracking: phase1-infrastructure-a7b8c9d0
```

### 2. Claude Code Implementation
You would copy this prompt to Claude Code, which would then:
- Implement all the required files
- Follow the coding standards
- Add proper error handling
- Include tests
- Optimize for performance

### 3. End Session with Results
```bash
npm run claude:end-session phase1-infrastructure-a7b8c9d0 "Claude successfully implemented all core infrastructure components. Created data transformation service with comprehensive quality metrics calculation, cache management hook with performance monitoring, and all supporting services. Included comprehensive error handling and achieved target performance goals." "Implemented useMainDashboardCache hook with <10ms cache hits, transformIssuesForProjectOverview service with health score calculations (Quality 40%, Bug Rate 30%, Progress 30%), and supporting services for project overview, quality, delivery, and sprint metrics. Added unit tests for all services and performance monitoring capabilities."
```

**Output:**
```
🏁 Ending Claude Code session: phase1-infrastructure-a7b8c9d0
✅ Session completed successfully
📊 Files modified: 12
📈 Lines added: 1,247
📉 Lines removed: 0
⏱️  Duration: 35 minutes
📝 Auto-committed: feat(services,hooks): implement core infrastructure services

Phase: phase1-infrastructure - Data transformation, cache management, supporting services
Session: phase1-infrastructure-a7b8c9d0
Duration: 35min
Files: 12 modified
Lines: +1247/-0

Implementation Summary:
Implemented useMainDashboardCache hook with <10ms cache hits, transformIssuesForProjectOverview service with health score calculations (Quality 40%, Bug Rate 30%, Progress 30%), and supporting services for project overview, quality, delivery, and sprint metrics. Added unit tests for all services and performance monitoring capabilities.

Patterns Identified:
- Service layer architecture
- Custom hooks usage
- Performance optimization with React.memo
- Comprehensive error handling

Decisions Made:
- Implemented caching strategy
- Applied performance optimizations
- Added comprehensive unit tests

Co-authored-by: Claude Code <claude@anthropic.com>
```

## 🔄 Monitoring and Status

### Check Session Status
```bash
npm run claude:session-status
```

**Output:**
```
📊 CONVERSATION TRACKER STATUS

🚀 Active Sessions: 0
✅ Completed Sessions: 1
📁 Total Phases: 1

🕒 Last Session: phase1-infrastructure-a7b8c9d0 (completed)
```

### View Implementation History
```bash
npm run claude:session-history phase1-infrastructure
```

**Output:**
```
📚 PHASE HISTORY: phase1-infrastructure

Sessions: 1
Completed: 1
Total Duration: 35min
Code Changes: 12

  📝 phase1-infrastructure-a7b8c9d0
     Status: completed
     Files: 12
     Duration: 35min
```

### View Overall Progress
```bash
npm run claude:auto-status
```

This shows updated project status including the new implementations.

## 🎯 Benefits of This Workflow

### 1. **Complete Context Capture**
- Every implementation session is fully documented
- Code changes are linked to conversations
- Implementation decisions are preserved
- Patterns are automatically identified

### 2. **Intelligent Git History**
- Rich commit messages with full context
- Co-authored commits with Claude Code
- Implementation rationale preserved
- Easy to trace decisions and changes

### 3. **Knowledge Building**
- Each session builds project knowledge
- Patterns emerge and get documented
- Decisions create institutional memory
- Context improves with each phase

### 4. **Workflow Continuity**
- Sessions can be resumed or referenced
- Implementation history informs future work
- Context injection gets smarter over time
- Team knowledge is preserved

## 📋 Available Commands

### Session Management
```bash
# Start new session
npm run claude:start-session <phaseId> "<request>"

# End session
npm run claude:end-session <sessionId> "<notes>" "<summary>"

# Check status
npm run claude:session-status

# View history
npm run claude:session-history [phaseId]

# Help
npm run claude:session-help
```

### Context Management
```bash
# Full project scan
npm run claude:auto-scan

# Get context injection
npm run claude:auto-inject

# Check project status
npm run claude:auto-status
```

## 🔮 Future Enhancements

This workflow can be extended to:
- **Integrate with Jira** for automatic ticket updates
- **Generate documentation** from implementation sessions
- **Create performance benchmarks** from implementation data
- **Build AI training data** from successful patterns
- **Automated code review** based on session context

## 💡 Best Practices

1. **Be descriptive in session start requests**
2. **Provide detailed conversation notes when ending sessions**
3. **Include implementation rationale in summaries**
4. **Review generated commit messages before accepting**
5. **Use session history to inform future implementations**
6. **Monitor phase progress regularly**

This workflow creates a **living documentation system** that grows smarter with each implementation, preserving not just the code but the entire context and reasoning behind every development decision.
