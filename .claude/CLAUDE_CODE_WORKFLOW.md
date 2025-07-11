# Claude Code Auto-Context Workflow

## Overview
This system automatically maintains context memory for Claude Code, ensuring it always has up-to-date knowledge of your project's features, components, and implementation status.

## Quick Start

### 1. Initialize the Workflow
```bash
# Initialize knowledge base
npm run claude:init

# Scan existing codebase  
npm run claude:auto-scan

# Check status
npm run claude:auto-status
```

### 2. Get Context for Claude Code
```bash
# Generate context injection (copy this output to Claude Code)
npm run claude:auto-inject
```

### 3. After Claude Code Implementation
```bash
# Scan for new changes
npm run claude:auto-scan

# Or analyze specific file
npm run claude:auto-analyze src/components/NewComponent.jsx

# Mark feature as complete
npm run claude:auto-feature authentication complete
```

## Workflow Commands

### Auto-Context Commands
- `npm run claude:auto-scan` - Full codebase scan and context update
- `npm run claude:auto-inject` - Generate context for Claude Code
- `npm run claude:auto-analyze [file]` - Analyze specific file or full project
- `npm run claude:auto-feature <name> [complete]` - Analyze or mark feature complete
- `npm run claude:auto-status` - Show current status
- `npm run claude:auto-help` - Show help

### Legacy Commands (still available)
- `npm run claude:init` - Initialize knowledge base
- `npm run claude:update-context` - Update context using old system
- `npm run claude:status` - Legacy status

## Claude Code Integration Workflow

### Before Starting Claude Code Session
1. **Get Current Context**:
   ```bash
   npm run claude:auto-inject
   ```
   
2. **Copy the output** and include it in your Claude Code prompt:
   ```
   Here's my current project context:
   [paste the context injection output]
   
   Please implement [your request] keeping this context in mind.
   ```

### During Claude Code Session
- Claude Code will now have full awareness of:
  - Existing features and their completion status
  - Current components and their complexity
  - Recent implementation history
  - Next priorities and recommendations
  - Code quality metrics

### After Claude Code Implementation
1. **Scan for changes**:
   ```bash
   npm run claude:auto-scan
   ```

2. **Mark features complete** (if applicable):
   ```bash
   npm run claude:auto-feature dashboard complete
   ```

3. **Check updated status**:
   ```bash
   npm run claude:auto-status
   ```

## Context Categories

### Project Summary
- Total features, components, services
- Code quality assessment
- Last update timestamp

### Recent Activity  
- Last 10 implementations
- Type of changes (component/feature/service)
- Timestamp tracking

### Current Features
- Feature completion percentages
- Component counts per feature
- Implementation status

### Next Priorities
- Incomplete features
- Components needing tests
- High complexity components needing refactoring

### Recommendations
- Code quality improvements
- Testing priorities
- Architecture suggestions

## Auto-Detection Rules

The system automatically detects and analyzes:

### New Components
- **Trigger**: `.jsx` files in `src/components/` or `src/features/*/components/`
- **Analysis**: Props, hooks, dependencies, complexity, purpose
- **Context Update**: Component registry, metrics

### New Features
- **Trigger**: New directories in `src/features/`
- **Analysis**: Structure, completeness, components, services
- **Context Update**: Feature map, progress tracking

### API Services
- **Trigger**: Files in `src/*/services/`
- **Analysis**: Endpoints, methods, error handling
- **Context Update**: API registry

### Store Updates
- **Trigger**: Files in `src/*/store/`
- **Analysis**: State structure, actions
- **Context Update**: State management tracking

## Advanced Usage

### Custom Analysis
```bash
# Analyze specific component
npm run claude:auto-analyze src/features/dashboard/components/MainChart.jsx

# Analyze entire feature
npm run claude:auto-feature dashboard
```

### Context Injection Customization
The context injection output can be customized by editing:
- `.claude/knowledge-base/auto-context.json` - Raw context data
- `.claude/scripts/auto-context.js` - Context generation logic

### Integration with Git
The system can be integrated with git hooks for automatic updates:

```bash
# Pre-commit: Update context before commits
# Post-commit: Log commits in context
```

## Troubleshooting

### Context Not Updating
```bash
# Force full scan
npm run claude:auto-scan

# Check for errors
npm run claude:auto-status
```

### Missing Components
```bash
# Re-scan specific directory
npm run claude:auto-analyze src/components/

# Check knowledge base
cat .claude/knowledge-base/auto-context.json
```

### Context Too Large
The system automatically prunes old context to keep it manageable:
- Keeps last 100 implementations
- Keeps last 50 decisions
- Summarizes older data

## Best Practices

### For Claude Code Sessions
1. **Always start with context injection**
2. **Be specific about what you want implemented**
3. **Reference existing patterns** from the context
4. **Scan after implementation** to update context

### For Team Collaboration
1. **Run scan before sharing** context with team
2. **Mark features complete** when done
3. **Use consistent naming** for features and components
4. **Update context regularly** during development

### For Project Maintenance
1. **Weekly context scans** for health checks
2. **Monitor code quality metrics**
3. **Track completion percentages**
4. **Review recommendations regularly**

## Examples

### Starting New Feature Implementation
```bash
# Get current context
npm run claude:auto-inject

# In Claude Code:
"Here's my current project context: [paste output]
Please implement a user authentication feature with login/logout components, 
keeping the existing MUI theme and Zustand store patterns."

# After implementation:
npm run claude:auto-scan
npm run claude:auto-feature authentication complete
```

### Reviewing Project Status
```bash
# Quick status check
npm run claude:auto-status

# Detailed context review
npm run claude:auto-inject

# Check specific feature
npm run claude:auto-feature dashboard
```

### Code Quality Assessment
```bash
# Full analysis
npm run claude:auto-scan

# Check recommendations
npm run claude:auto-inject | grep -A 10 "RECOMMENDATIONS"
```
