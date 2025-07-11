#!/usr/bin/env node
/**
 * Conversation Tracker for Claude Code Implementation
 * Captures conversations, code changes, and implementation context per phase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class ConversationTracker {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.kbPath = path.join(__dirname, '../knowledge-base');
    this.conversationsPath = path.join(this.kbPath, 'conversations');
    this.contextPath = path.join(this.kbPath, 'implementation-context.json');
    
    this.ensureDirectories();
    this.loadImplementationContext();
  }

  ensureDirectories() {
    [this.conversationsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadImplementationContext() {
    if (fs.existsSync(this.contextPath)) {
      this.context = JSON.parse(fs.readFileSync(this.contextPath, 'utf8'));
    } else {
      this.context = {
        sessions: {},
        phases: {},
        conversations: {},
        codeChanges: {},
        patterns: {},
        decisions: {},
        lastSession: null
      };
    }
  }

  // Start a new Claude Code session for a specific phase
  startPhaseSession(phaseId, phaseDescription, userPrompt) {
    const sessionId = this.generateSessionId(phaseId);
    const timestamp = new Date().toISOString();
    
    console.log(`🚀 Starting Claude Code session for ${phaseId}`);
    console.log(`📝 Session ID: ${sessionId}`);
    
    // Capture current git state
    const gitState = this.captureGitState();
    
    // Generate current context injection
    const contextInjection = this.getProjectContext();
    
    // Create session record
    const session = {
      sessionId,
      phaseId,
      phaseDescription,
      timestamp,
      status: 'active',
      userPrompt,
      contextInjection,
      gitStateBefore: gitState,
      gitStateAfter: null,
      codeChanges: [],
      conversationLog: [],
      implementationDecisions: [],
      patternsIdentified: [],
      issuesEncountered: [],
      duration: null,
      filesModified: [],
      linesAdded: 0,
      linesRemoved: 0
    };

    // Save session
    this.context.sessions[sessionId] = session;
    this.context.lastSession = sessionId;
    
    // Update phase tracking
    if (!this.context.phases[phaseId]) {
      this.context.phases[phaseId] = {
        sessions: [],
        totalSessions: 0,
        completedSessions: 0,
        totalDuration: 0,
        codeChanges: [],
        patterns: [],
        decisions: []
      };
    }
    
    this.context.phases[phaseId].sessions.push(sessionId);
    this.context.phases[phaseId].totalSessions++;
    
    // Save session file
    this.saveSessionFile(session);
    this.saveContext();
    
    // Generate enhanced prompt for Claude Code
    const enhancedPrompt = this.generateEnhancedPrompt(session);
    
    console.log('\n📋 ENHANCED PROMPT FOR CLAUDE CODE:');
    console.log('='.repeat(80));
    console.log(enhancedPrompt);
    console.log('='.repeat(80));
    console.log('\n📌 Copy the above prompt to Claude Code');
    console.log(`📁 Session tracking: ${sessionId}`);
    
    return { sessionId, enhancedPrompt };
  }

  // End Claude Code session and capture results
  endPhaseSession(sessionId, conversationNotes = '', implementationSummary = '') {
    if (!this.context.sessions[sessionId]) {
      console.error(`❌ Session ${sessionId} not found`);
      return;
    }

    console.log(`🏁 Ending Claude Code session: ${sessionId}`);
    
    const session = this.context.sessions[sessionId];
    const endTime = new Date().toISOString();
    
    // Capture final git state
    const gitStateAfter = this.captureGitState();
    
    // Analyze code changes
    const codeChanges = this.analyzeCodeChanges(session.gitStateBefore, gitStateAfter);
    
    // Update session
    session.status = 'completed';
    session.endTime = endTime;
    session.duration = new Date(endTime) - new Date(session.timestamp);
    session.gitStateAfter = gitStateAfter;
    session.codeChanges = codeChanges.changes;
    session.filesModified = codeChanges.filesModified;
    session.linesAdded = codeChanges.linesAdded;
    session.linesRemoved = codeChanges.linesRemoved;
    session.conversationNotes = conversationNotes;
    session.implementationSummary = implementationSummary;
    
    // Extract patterns and decisions
    session.patternsIdentified = this.extractPatterns(codeChanges, conversationNotes);
    session.implementationDecisions = this.extractDecisions(implementationSummary, codeChanges);
    
    // Update phase tracking
    const phase = this.context.phases[session.phaseId];
    phase.completedSessions++;
    phase.totalDuration += session.duration;
    phase.codeChanges.push(...codeChanges.changes);
    phase.patterns.push(...session.patternsIdentified);
    phase.decisions.push(...session.implementationDecisions);
    
    // Create intelligent commit message
    const commitMessage = this.generateIntelligentCommitMessage(session);
    
    // Auto-commit if requested
    const shouldAutoCommit = this.shouldAutoCommit(session);
    if (shouldAutoCommit) {
      this.createIntelligentCommit(session, commitMessage);
    }
    
    // Update session file
    this.saveSessionFile(session);
    this.saveContext();
    
    // Update knowledge base
    this.updateKnowledgeBase(session);
    
    console.log(`✅ Session completed successfully`);
    console.log(`📊 Files modified: ${session.filesModified.length}`);
    console.log(`📈 Lines added: ${session.linesAdded}`);
    console.log(`📉 Lines removed: ${session.linesRemoved}`);
    console.log(`⏱️  Duration: ${Math.round(session.duration / 1000 / 60)} minutes`);
    
    if (shouldAutoCommit) {
      console.log(`📝 Auto-committed: ${commitMessage}`);
    }
    
    return session;
  }

  // Generate enhanced prompt with phase context
  generateEnhancedPrompt(session) {
    const phaseInfo = this.getPhaseInfo(session.phaseId);
    const projectContext = this.getProjectContext();
    const implementationHistory = this.getImplementationHistory(session.phaseId);
    
    return `# Claude Code Implementation Request

## 📋 Phase Information
**Phase**: ${session.phaseId} - ${session.phaseDescription}
**Session ID**: ${session.sessionId}
**Priority**: ${phaseInfo.priority || 'Medium'}
**Timeline**: ${phaseInfo.timeline || 'TBD'}

## 🎯 Implementation Request
${session.userPrompt}

## 📊 Current Project Context
${session.contextInjection}

## 🏗️ Phase Implementation Plan
${phaseInfo.implementationDetails || 'See doc/dashboard/main-dashboard/implementation-plan.md'}

## 📚 Implementation History
${implementationHistory}

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
1. Implementation files as per phase plan
2. Unit tests for components/services
3. Documentation comments in code
4. Error handling implementation
5. Performance optimizations

## 📝 Session Tracking
Please implement the requested functionality. After completion, run:
\`\`\`bash
npm run claude:end-session ${session.sessionId} "conversation summary" "implementation summary"
\`\`\`

---
**🤖 This request is being tracked for automatic context updates and git commits.**`;
  }

  // Capture current git state
  captureGitState() {
    try {
      return {
        branch: execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.projectRoot, encoding: 'utf8' }).trim(),
        commit: execSync('git rev-parse HEAD', { cwd: this.projectRoot, encoding: 'utf8' }).trim(),
        shortCommit: execSync('git rev-parse --short HEAD', { cwd: this.projectRoot, encoding: 'utf8' }).trim(),
        status: execSync('git status --porcelain', { cwd: this.projectRoot, encoding: 'utf8' }).trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message, timestamp: new Date().toISOString() };
    }
  }

  // Analyze code changes between git states
  analyzeCodeChanges(beforeState, afterState) {
    try {
      const diffOutput = execSync(`git diff ${beforeState.commit} ${afterState.commit} --stat`, {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      
      const detailedDiff = execSync(`git diff ${beforeState.commit} ${afterState.commit} --name-status`, {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      const changes = [];
      const filesModified = [];
      let linesAdded = 0;
      let linesRemoved = 0;

      // Parse diff output
      detailedDiff.split('\n').forEach(line => {
        if (line.trim()) {
          const [status, filePath] = line.split('\t');
          changes.push({ status, filePath, timestamp: new Date().toISOString() });
          filesModified.push(filePath);
        }
      });

      // Extract line counts
      const statMatch = diffOutput.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
      if (statMatch) {
        linesAdded = parseInt(statMatch[2] || '0');
        linesRemoved = parseInt(statMatch[3] || '0');
      }

      return {
        changes,
        filesModified,
        linesAdded,
        linesRemoved,
        diffSummary: diffOutput,
        detailedDiff
      };
    } catch (error) {
      return {
        error: error.message,
        changes: [],
        filesModified: [],
        linesAdded: 0,
        linesRemoved: 0
      };
    }
  }

  // Generate intelligent commit message
  generateIntelligentCommitMessage(session) {
    const phaseInfo = this.getPhaseInfo(session.phaseId);
    const changedFiles = session.filesModified.length;
    const linesChanged = session.linesAdded + session.linesRemoved;
    
    // Determine commit type
    let commitType = 'feat';
    if (session.phaseId.includes('test')) commitType = 'test';
    if (session.phaseId.includes('refactor')) commitType = 'refactor';
    if (session.phaseId.includes('fix')) commitType = 'fix';
    
    // Create descriptive message
    const scope = this.extractScope(session.filesModified);
    const description = this.generateCommitDescription(session);
    
    const commitMessage = `${commitType}(${scope}): ${description}

Phase: ${session.phaseId} - ${session.phaseDescription}
Session: ${session.sessionId}
Duration: ${Math.round(session.duration / 1000 / 60)}min
Files: ${changedFiles} modified
Lines: +${session.linesAdded}/-${session.linesRemoved}

Implementation Summary:
${session.implementationSummary || 'Claude Code implementation'}

Patterns Identified:
${session.patternsIdentified.map(p => `- ${p}`).join('\n') || '- Standard React patterns'}

Decisions Made:
${session.implementationDecisions.map(d => `- ${d}`).join('\n') || '- Follow existing conventions'}

Co-authored-by: Claude Code <claude@anthropic.com>`;

    return commitMessage;
  }

  // Extract scope from modified files
  extractScope(filesModified) {
    const scopes = new Set();
    
    filesModified.forEach(file => {
      if (file.includes('components/')) scopes.add('components');
      if (file.includes('services/')) scopes.add('services');
      if (file.includes('hooks/')) scopes.add('hooks');
      if (file.includes('utils/')) scopes.add('utils');
      if (file.includes('dashboard/')) scopes.add('dashboard');
      if (file.includes('__tests__/')) scopes.add('tests');
    });
    
    return Array.from(scopes).join(',') || 'core';
  }

  // Generate commit description
  generateCommitDescription(session) {
    const keyFiles = session.filesModified
      .filter(f => !f.includes('__tests__'))
      .map(f => path.basename(f, path.extname(f)))
      .slice(0, 3);
    
    if (keyFiles.length === 1) {
      return `implement ${keyFiles[0]}`;
    } else if (keyFiles.length <= 3) {
      return `implement ${keyFiles.join(', ')}`;
    } else {
      return `implement ${session.phaseDescription.toLowerCase()}`;
    }
  }

  // Extract patterns from implementation
  extractPatterns(codeChanges, conversationNotes) {
    const patterns = [];
    
    // Analyze file patterns
    const componentFiles = codeChanges.filesModified.filter(f => f.endsWith('.jsx'));
    const serviceFiles = codeChanges.filesModified.filter(f => f.includes('service'));
    const hookFiles = codeChanges.filesModified.filter(f => f.includes('hook'));
    
    if (componentFiles.length > 0) patterns.push('React component implementation');
    if (serviceFiles.length > 0) patterns.push('Service layer architecture');
    if (hookFiles.length > 0) patterns.push('Custom hooks usage');
    
    // Analyze from conversation notes
    if (conversationNotes.toLowerCase().includes('memo')) patterns.push('Performance optimization with React.memo');
    if (conversationNotes.toLowerCase().includes('zustand')) patterns.push('Zustand state management');
    if (conversationNotes.toLowerCase().includes('mui')) patterns.push('Material-UI component usage');
    
    return patterns;
  }

  // Extract decisions from implementation
  extractDecisions(implementationSummary, codeChanges) {
    const decisions = [];
    
    if (implementationSummary) {
      // Common decision patterns
      if (implementationSummary.includes('cache')) decisions.push('Implemented caching strategy');
      if (implementationSummary.includes('performance')) decisions.push('Applied performance optimizations');
      if (implementationSummary.includes('responsive')) decisions.push('Implemented responsive design');
      if (implementationSummary.includes('error')) decisions.push('Added error handling');
    }
    
    // Analyze from file types
    const hasTests = codeChanges.filesModified.some(f => f.includes('__tests__'));
    if (hasTests) decisions.push('Added comprehensive unit tests');
    
    return decisions;
  }

  // Generate session ID
  generateSessionId(phaseId) {
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${phaseId}-${timestamp}`).digest('hex').slice(0, 8);
    return `${phaseId}-${hash}`;
  }

  // Get phase info from implementation plan
  getPhaseInfo(phaseId) {
    // This could be enhanced to parse the actual implementation-plan.md
    const phaseMap = {
      'phase1-infrastructure': {
        priority: 'Critical',
        timeline: 'Week 1',
        implementationDetails: 'Data transformation, cache management, supporting services'
      },
      'phase2-project-health': {
        priority: 'High',
        timeline: 'Week 2',
        implementationDetails: 'Scatter charts and project health table'
      },
      'phase3-project-delivery': {
        priority: 'High',
        timeline: 'Week 3',
        implementationDetails: 'Delivery summary, efficiency charts, recent deliveries'
      },
      'phase4-sprint-metrics': {
        priority: 'Medium',
        timeline: 'Week 4',
        implementationDetails: 'Sprint metrics with timeliness and scope creep'
      },
      'phase5-cache-ui': {
        priority: 'Low',
        timeline: 'Week 5',
        implementationDetails: 'Cache performance monitor and management UI'
      },
      'phase6-integration': {
        priority: 'Critical',
        timeline: 'Week 6',
        implementationDetails: 'Main dashboard integration and routing'
      }
    };
    
    return phaseMap[phaseId] || { priority: 'Medium', timeline: 'TBD' };
  }

  // Get current project context
  getProjectContext() {
    try {
      const AutoContextWorkflow = require('./auto-context.js');
      const workflow = new AutoContextWorkflow();
      const contextInjection = workflow.generateContextInjection();
      
      return `Features: ${contextInjection.projectSummary.totalFeatures}
Components: ${contextInjection.projectSummary.totalComponents}
Code Quality: ${contextInjection.projectSummary.codeQuality}
Recent Activity: ${contextInjection.recentActivity.slice(0, 3).map(a => a.name).join(', ')}`;
    } catch (error) {
      return 'Context unavailable';
    }
  }

  // Get implementation history for phase
  getImplementationHistory(phaseId) {
    const phase = this.context.phases[phaseId];
    if (!phase || phase.sessions.length === 0) {
      return 'No previous implementation history for this phase.';
    }
    
    const history = phase.sessions.map(sessionId => {
      const session = this.context.sessions[sessionId];
      return `- ${session.timestamp}: ${session.status} (${session.filesModified?.length || 0} files)`;
    }).join('\n');
    
    return `Previous sessions:\n${history}`;
  }

  // Check if should auto-commit
  shouldAutoCommit(session) {
    // Auto-commit if significant changes were made
    return session.filesModified.length > 0 && session.linesAdded > 10;
  }

  // Create intelligent commit
  createIntelligentCommit(session, commitMessage) {
    try {
      // Stage all changes
      execSync('git add .', { cwd: this.projectRoot });
      
      // Create commit
      execSync(`git commit -m "${commitMessage}"`, { cwd: this.projectRoot });
      
      console.log('📝 Auto-commit created successfully');
    } catch (error) {
      console.error('❌ Auto-commit failed:', error.message);
    }
  }

  // Save session file
  saveSessionFile(session) {
    const sessionFile = path.join(this.conversationsPath, `${session.sessionId}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
  }

  // Save implementation context
  saveContext() {
    fs.writeFileSync(this.contextPath, JSON.stringify(this.context, null, 2));
  }

  // Update knowledge base
  updateKnowledgeBase(session) {
    // Integration with existing auto-context system
    try {
      const AutoContextWorkflow = require('./auto-context.js');
      const workflow = new AutoContextWorkflow();
      
      // Update with session information
      workflow.logImplementation('session', session.sessionId, 'completed', {
        phaseId: session.phaseId,
        duration: session.duration,
        filesModified: session.filesModified.length,
        linesAdded: session.linesAdded,
        patterns: session.patternsIdentified,
        decisions: session.implementationDecisions
      });
      
      workflow.saveContext();
    } catch (error) {
      console.warn('⚠️  Could not update auto-context:', error.message);
    }
  }

  // CLI interface
  static cli() {
    const tracker = new ConversationTracker();
    const [,, command, ...args] = process.argv;

    const commands = {
      start: () => {
        const [phaseId, ...promptParts] = args;
        const userPrompt = promptParts.join(' ');
        
        if (!phaseId || !userPrompt) {
          console.error('Usage: start <phaseId> <prompt>');
          console.error('Example: start phase1-infrastructure "Implement data transformation service"');
          return;
        }
        
        const phaseInfo = tracker.getPhaseInfo(phaseId);
        tracker.startPhaseSession(phaseId, phaseInfo.implementationDetails, userPrompt);
      },
      
      end: () => {
        const [sessionId, conversationNotes, implementationSummary] = args;
        
        if (!sessionId) {
          console.error('Usage: end <sessionId> [conversationNotes] [implementationSummary]');
          return;
        }
        
        tracker.endPhaseSession(sessionId, conversationNotes, implementationSummary);
      },
      
      status: () => {
        const sessions = Object.values(tracker.context.sessions);
        const activeSessions = sessions.filter(s => s.status === 'active');
        const completedSessions = sessions.filter(s => s.status === 'completed');
        
        console.log('\n📊 CONVERSATION TRACKER STATUS\n');
        console.log(`🚀 Active Sessions: ${activeSessions.length}`);
        console.log(`✅ Completed Sessions: ${completedSessions.length}`);
        console.log(`📁 Total Phases: ${Object.keys(tracker.context.phases).length}`);
        
        if (activeSessions.length > 0) {
          console.log('\n🔄 Active Sessions:');
          activeSessions.forEach(session => {
            const elapsed = Date.now() - new Date(session.timestamp);
            console.log(`  - ${session.sessionId}: ${session.phaseId} (${Math.round(elapsed/1000/60)}min ago)`);
          });
        }
        
        if (tracker.context.lastSession) {
          const lastSession = tracker.context.sessions[tracker.context.lastSession];
          console.log(`\n🕒 Last Session: ${lastSession.sessionId} (${lastSession.status})`);
        }
      },
      
      history: () => {
        const [phaseId] = args;
        
        if (phaseId) {
          // Show history for specific phase
          const phase = tracker.context.phases[phaseId];
          if (!phase) {
            console.error(`Phase ${phaseId} not found`);
            return;
          }
          
          console.log(`\n📚 PHASE HISTORY: ${phaseId}\n`);
          console.log(`Sessions: ${phase.sessions.length}`);
          console.log(`Completed: ${phase.completedSessions}`);
          console.log(`Total Duration: ${Math.round(phase.totalDuration/1000/60)}min`);
          console.log(`Code Changes: ${phase.codeChanges.length}`);
          
          phase.sessions.forEach(sessionId => {
            const session = tracker.context.sessions[sessionId];
            console.log(`\n  📝 ${session.sessionId}`);
            console.log(`     Status: ${session.status}`);
            console.log(`     Files: ${session.filesModified?.length || 0}`);
            console.log(`     Duration: ${Math.round((session.duration || 0)/1000/60)}min`);
          });
        } else {
          // Show overall history
          console.log('\n📚 IMPLEMENTATION HISTORY\n');
          Object.entries(tracker.context.phases).forEach(([phaseId, phase]) => {
            console.log(`📁 ${phaseId}: ${phase.sessions.length} sessions, ${phase.completedSessions} completed`);
          });
        }
      },
      
      help: () => {
        console.log(`
🤖 Conversation Tracker for Claude Code

Commands:
  start <phaseId> <prompt>     - Start new Claude Code session
  end <sessionId> [notes] [summary] - End session and capture results
  status                       - Show current tracker status
  history [phaseId]           - Show implementation history
  help                        - Show this help

Examples:
  npm run claude:start-session phase1-infrastructure "Implement cache management"
  npm run claude:end-session phase1-abc123 "Implemented cache" "Added useCache hook"
  npm run claude:session-status
  npm run claude:session-history phase1-infrastructure
`);
      }
    };

    if (commands[command]) {
      commands[command]();
    } else {
      console.log('❌ Unknown command. Use "help" to see available commands.');
      commands.help();
    }
  }
}

module.exports = ConversationTracker;

// Run CLI if called directly
if (require.main === module) {
  ConversationTracker.cli();
}
