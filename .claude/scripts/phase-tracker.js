#!/usr/bin/env node
/**
 * Phase Tracker for Implementation Plan
 * Automatically detects phase completion and manages git commits
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PhaseTracker {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.kbPath = path.join(__dirname, '../knowledge-base');
    this.planPath = path.join(this.projectRoot, 'doc/dashboard/main-dashboard/implementation-plan.md');
    this.phaseStatusPath = path.join(this.kbPath, 'phase-status.json');
    
    this.loadPhaseDefinitions();
    this.loadPhaseStatus();
  }

  // Define phase completion criteria based on your implementation plan
  loadPhaseDefinitions() {
    this.phases = {
      'phase1-infrastructure': {
        name: 'Phase 1: Core Infrastructure',
        description: 'Data transformation, cache management, and supporting services',
        priority: 'Critical',
        timeline: 'Week 1',
        files: [
          'src/features/dashboard/services/transformIssuesForProjectOverview.js',
          'src/features/dashboard/hooks/useMainDashboardCache.js',
          'src/features/dashboard/services/projectOverview.service.js',
          'src/features/dashboard/services/projectQuality.service.js',
          'src/features/dashboard/services/projectDelivery.service.js',
          'src/features/dashboard/services/sprintMetricsData.service.js',
          'src/features/dashboard/services/sprintMetricsDetails.service.js'
        ],
        tests: [
          'src/features/dashboard/services/__tests__/transformIssuesForProjectOverview.test.js',
          'src/features/dashboard/hooks/__tests__/useMainDashboardCache.test.js'
        ],
        completionThreshold: 0.8 // 80% of files must exist
      },

      'phase2-project-health': {
        name: 'Phase 2: ProjectHealthOverview Component',
        description: 'Scatter charts and project health table implementation',
        priority: 'High',
        timeline: 'Week 2',
        dependencies: ['phase1-infrastructure'],
        files: [
          'src/features/dashboard/components/ProjectHealthOverview/QualityVsDeliveryChart.jsx',
          'src/features/dashboard/components/ProjectHealthOverview/QualityVsHealthChart.jsx',
          'src/features/dashboard/components/ProjectHealthOverview/ProjectHealthTable.jsx',
          'src/features/dashboard/components/ProjectHealthOverview/index.js'
        ],
        tests: [
          'src/features/dashboard/components/ProjectHealthOverview/__tests__/QualityVsDeliveryChart.test.jsx',
          'src/features/dashboard/components/ProjectHealthOverview/__tests__/ProjectHealthTable.test.jsx'
        ],
        completionThreshold: 0.75
      },

      'phase3-project-delivery': {
        name: 'Phase 3: ProjectDelivery Component',
        description: 'Delivery summary, efficiency charts, and recent deliveries',
        priority: 'High',
        timeline: 'Week 3',
        dependencies: ['phase1-infrastructure'],
        files: [
          'src/features/dashboard/components/ProjectDelivery/DeliverySummaryCircular.jsx',
          'src/features/dashboard/components/ProjectDelivery/DeliveryEfficiencyChart.jsx',
          'src/features/dashboard/components/ProjectDelivery/RecentDeliveriesGrid.jsx',
          'src/features/dashboard/components/ProjectDelivery/index.js'
        ],
        tests: [
          'src/features/dashboard/components/ProjectDelivery/__tests__/DeliverySummaryCircular.test.jsx',
          'src/features/dashboard/components/ProjectDelivery/__tests__/DeliveryEfficiencyChart.test.jsx'
        ],
        completionThreshold: 0.75
      },

      'phase4-sprint-metrics': {
        name: 'Phase 4: SprintMetricsChartsDashboard Component',
        description: 'Sprint metrics charts with timeliness and scope creep analysis',
        priority: 'Medium',
        timeline: 'Week 4',
        dependencies: ['phase1-infrastructure'],
        files: [
          'src/features/dashboard/components/SprintMetricsChartsDashboard/SprintMetricsCharts.jsx',
          'src/features/dashboard/components/SprintMetricsChartsDashboard/TimelinessCharts.jsx',
          'src/features/dashboard/components/SprintMetricsChartsDashboard/ScopeCreepCharts.jsx',
          'src/features/dashboard/components/SprintMetricsChartsDashboard/SprintMetricsDetailsPopup.jsx',
          'src/features/dashboard/components/SprintMetricsChartsDashboard/index.js'
        ],
        tests: [
          'src/features/dashboard/components/SprintMetricsChartsDashboard/__tests__/SprintMetricsCharts.test.jsx',
          'src/features/dashboard/components/SprintMetricsChartsDashboard/__tests__/TimelinessCharts.test.jsx'
        ],
        completionThreshold: 0.8
      },

      'phase5-cache-ui': {
        name: 'Phase 5: Cache Management UI',
        description: 'Cache performance monitor and management interface',
        priority: 'Low',
        timeline: 'Week 5',
        dependencies: ['phase1-infrastructure'],
        files: [
          'src/features/dashboard/utils/CachePerformanceMonitor.jsx',
          'src/features/dashboard/utils/CacheManager.jsx'
        ],
        tests: [
          'src/features/dashboard/utils/__tests__/CachePerformanceMonitor.test.jsx',
          'src/features/dashboard/utils/__tests__/CacheManager.test.jsx'
        ],
        completionThreshold: 0.5
      },

      'phase6-integration': {
        name: 'Phase 6: Main Dashboard Integration',
        description: 'Main dashboard container and route integration',
        priority: 'Critical',
        timeline: 'Week 6',
        dependencies: ['phase2-project-health', 'phase3-project-delivery', 'phase4-sprint-metrics'],
        files: [
          'src/features/dashboard/components/MainDashboard.jsx',
          'src/features/dashboard/index.js'
        ],
        routeFiles: [
          'src/App.js' // Check for main-dashboard route
        ],
        tests: [
          'src/features/dashboard/components/__tests__/MainDashboard.test.jsx'
        ],
        completionThreshold: 1.0 // 100% for final integration
      }
    };
  }

  // Load existing phase status
  loadPhaseStatus() {
    if (fs.existsSync(this.phaseStatusPath)) {
      this.phaseStatus = JSON.parse(fs.readFileSync(this.phaseStatusPath, 'utf8'));
    } else {
      this.phaseStatus = {
        lastCheck: new Date().toISOString(),
        phases: {},
        overallProgress: 0,
        currentPhase: 'phase1-infrastructure',
        completedPhases: [],
        nextPhases: []
      };
    }
  }

  // Check current phase completion status
  checkPhaseCompletion() {
    console.log('🔍 Checking implementation plan progress...\n');

    let totalProgress = 0;
    const phaseResults = {};

    Object.entries(this.phases).forEach(([phaseId, phase]) => {
      const result = this.analyzePhase(phaseId, phase);
      phaseResults[phaseId] = result;
      
      // Update phase status
      const wasCompleted = this.phaseStatus.phases[phaseId]?.completed || false;
      this.phaseStatus.phases[phaseId] = result;

      // Check if phase just completed
      if (result.completed && !wasCompleted) {
        this.handlePhaseCompletion(phaseId, phase, result);
      }

      totalProgress += result.progress;
      
      console.log(`${result.completed ? '✅' : '🚧'} ${phase.name}`);
      console.log(`   Progress: ${Math.round(result.progress * 100)}%`);
      console.log(`   Files: ${result.filesCompleted}/${result.totalFiles}`);
      if (result.blockedBy.length > 0) {
        console.log(`   🚫 Blocked by: ${result.blockedBy.join(', ')}`);
      }
      console.log('');
    });

    // Update overall status
    this.phaseStatus.overallProgress = totalProgress / Object.keys(this.phases).length;
    this.phaseStatus.lastCheck = new Date().toISOString();
    this.phaseStatus.completedPhases = Object.keys(phaseResults).filter(id => phaseResults[id].completed);
    this.phaseStatus.currentPhase = this.determineCurrentPhase(phaseResults);
    this.phaseStatus.nextPhases = this.determineNextPhases(phaseResults);

    this.savePhaseStatus();
    this.updateAutoContext();

    console.log(`📊 Overall Progress: ${Math.round(this.phaseStatus.overallProgress * 100)}%`);
    console.log(`🎯 Current Phase: ${this.phases[this.phaseStatus.currentPhase]?.name || 'Unknown'}`);
    console.log(`🔄 Completed: ${this.phaseStatus.completedPhases.length}/${Object.keys(this.phases).length} phases`);
  }

  // Analyze individual phase completion
  analyzePhase(phaseId, phase) {
    const result = {
      phaseId,
      name: phase.name,
      progress: 0,
      completed: false,
      filesCompleted: 0,
      totalFiles: 0,
      existingFiles: [],
      missingFiles: [],
      testsCompleted: 0,
      totalTests: phase.tests?.length || 0,
      blockedBy: [],
      canStart: true,
      estimatedCompletion: null
    };

    // Check dependencies
    if (phase.dependencies) {
      phase.dependencies.forEach(depId => {
        if (!this.phaseStatus.phases[depId]?.completed) {
          result.blockedBy.push(this.phases[depId]?.name || depId);
          result.canStart = false;
        }
      });
    }

    // Check file completion
    const allFiles = [...(phase.files || []), ...(phase.routeFiles || [])];
    result.totalFiles = allFiles.length;

    allFiles.forEach(filePath => {
      const fullPath = path.join(this.projectRoot, filePath);
      if (fs.existsSync(fullPath)) {
        result.existingFiles.push(filePath);
        result.filesCompleted++;
      } else {
        result.missingFiles.push(filePath);
      }
    });

    // Check test completion
    if (phase.tests) {
      phase.tests.forEach(testPath => {
        const fullPath = path.join(this.projectRoot, testPath);
        if (fs.existsSync(fullPath)) {
          result.testsCompleted++;
        }
      });
    }

    // Calculate progress
    const fileProgress = result.totalFiles > 0 ? result.filesCompleted / result.totalFiles : 0;
    const testProgress = result.totalTests > 0 ? result.testsCompleted / result.totalTests : 1;
    result.progress = (fileProgress * 0.8) + (testProgress * 0.2); // 80% files, 20% tests

    // Check completion
    result.completed = result.progress >= (phase.completionThreshold || 0.8) && result.canStart;

    return result;
  }

  // Handle phase completion
  handlePhaseCompletion(phaseId, phase, result) {
    console.log(`\n🎉 PHASE COMPLETED: ${phase.name}`);
    
    // Update context
    this.logPhaseCompletion(phaseId, phase, result);
    
    // Create git commit
    this.createPhaseCommit(phaseId, phase, result);
    
    // Send notifications (if configured)
    this.notifyPhaseCompletion(phaseId, phase, result);
  }

  // Log phase completion to context
  logPhaseCompletion(phaseId, phase, result) {
    const AutoContextWorkflow = require('./auto-context.js');
    const workflow = new AutoContextWorkflow();
    
    // Log as implementation
    workflow.logImplementation('phase', phaseId, 'completed', {
      phaseName: phase.name,
      description: phase.description,
      priority: phase.priority,
      timeline: phase.timeline,
      filesCompleted: result.filesCompleted,
      totalFiles: result.totalFiles,
      testsCompleted: result.testsCompleted,
      totalTests: result.totalTests,
      completionDate: new Date().toISOString(),
      implementedFiles: result.existingFiles
    });
    
    workflow.saveContext();
    console.log(`   📝 Context updated for ${phase.name}`);
  }

  // Create git commit for phase completion
  createPhaseCommit(phaseId, phase, result) {
    try {
      // Add all files for this phase
      const filesToAdd = result.existingFiles.map(file => path.join(this.projectRoot, file));
      
      // Stage files
      filesToAdd.forEach(file => {
        if (fs.existsSync(file)) {
          execSync(`git add "${file}"`, { cwd: this.projectRoot });
        }
      });

      // Also add any test files
      if (phase.tests) {
        phase.tests.forEach(testPath => {
          const fullPath = path.join(this.projectRoot, testPath);
          if (fs.existsSync(fullPath)) {
            execSync(`git add "${fullPath}"`, { cwd: this.projectRoot });
          }
        });
      }

      // Create commit message
      const commitMessage = this.generateCommitMessage(phaseId, phase, result);
      
      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { cwd: this.projectRoot });
      
      console.log(`   🔄 Git commit created: ${commitMessage.split('\n')[0]}`);
      
    } catch (error) {
      console.log(`   ⚠️  Could not create git commit: ${error.message}`);
    }
  }

  // Generate descriptive commit message
  generateCommitMessage(phaseId, phase, result) {
    const summary = `feat(dashboard): Complete ${phase.name}`;
    
    const details = [
      '',
      phase.description,
      '',
      `✅ Completed: ${result.filesCompleted}/${result.totalFiles} files`,
      `🧪 Tests: ${result.testsCompleted}/${result.totalTests}`,
      `📊 Progress: ${Math.round(result.progress * 100)}%`,
      '',
      'Implemented files:',
      ...result.existingFiles.map(file => `- ${file}`),
      '',
      `Phase: ${phaseId}`,
      `Priority: ${phase.priority}`,
      `Timeline: ${phase.timeline}`,
      '',
      'Auto-generated by phase-tracker'
    ];

    return summary + details.join('\n');
  }

  // Send notifications for phase completion
  notifyPhaseCompletion(phaseId, phase, result) {
    // Log to implementation log
    const logPath = path.join(this.kbPath, 'implementation-log.md');
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];
    
    const entry = `
## ${date} ${time} - Phase Completed: ${phase.name}
- **Phase ID**: ${phaseId}
- **Priority**: ${phase.priority}
- **Timeline**: ${phase.timeline}
- **Files Completed**: ${result.filesCompleted}/${result.totalFiles}
- **Tests Completed**: ${result.testsCompleted}/${result.totalTests}
- **Progress**: ${Math.round(result.progress * 100)}%
- **Description**: ${phase.description}
- **Auto-completed by**: Phase Tracker

### Implemented Files:
${result.existingFiles.map(file => `- ${file}`).join('\n')}

---
`;

    if (fs.existsSync(logPath)) {
      fs.appendFileSync(logPath, entry);
    } else {
      fs.writeFileSync(logPath, '# Implementation Log\n\n' + entry);
    }
  }

  // Determine current active phase
  determineCurrentPhase(phaseResults) {
    // Find first non-completed phase that can start
    for (const [phaseId, result] of Object.entries(phaseResults)) {
      if (!result.completed && result.canStart) {
        return phaseId;
      }
    }
    
    // If all phases completed, return the last one
    const phaseIds = Object.keys(this.phases);
    return phaseIds[phaseIds.length - 1];
  }

  // Determine next available phases
  determineNextPhases(phaseResults) {
    const nextPhases = [];
    
    for (const [phaseId, result] of Object.entries(phaseResults)) {
      if (!result.completed && result.canStart) {
        nextPhases.push({
          phaseId,
          name: result.name,
          priority: this.phases[phaseId].priority,
          progress: Math.round(result.progress * 100)
        });
      }
    }
    
    return nextPhases.slice(0, 3); // Return top 3 next phases
  }

  // Update auto-context with phase information
  updateAutoContext() {
    try {
      const AutoContextWorkflow = require('./auto-context.js');
      const workflow = new AutoContextWorkflow();
      
      // Add phase information to context
      workflow.context.implementationPlan = {
        planPath: 'doc/dashboard/main-dashboard/implementation-plan.md',
        overallProgress: Math.round(this.phaseStatus.overallProgress * 100),
        currentPhase: this.phaseStatus.currentPhase,
        currentPhaseName: this.phases[this.phaseStatus.currentPhase]?.name,
        completedPhases: this.phaseStatus.completedPhases.map(id => ({
          id,
          name: this.phases[id]?.name,
          priority: this.phases[id]?.priority
        })),
        nextPhases: this.phaseStatus.nextPhases,
        lastCheck: this.phaseStatus.lastCheck,
        phaseDetails: Object.entries(this.phases).reduce((acc, [id, phase]) => {
          const status = this.phaseStatus.phases[id] || {};
          acc[id] = {
            name: phase.name,
            progress: Math.round((status.progress || 0) * 100),
            completed: status.completed || false,
            filesCompleted: status.filesCompleted || 0,
            totalFiles: (phase.files?.length || 0) + (phase.routeFiles?.length || 0),
            canStart: status.canStart !== false
          };
          return acc;
        }, {})
      };
      
      // Force context scan to include new files
      workflow.scanCodebase();
      workflow.saveContext();
      
    } catch (error) {
      console.log(`   ⚠️  Could not update auto-context: ${error.message}`);
    }
  }

  // Save phase status to file
  savePhaseStatus() {
    fs.writeFileSync(this.phaseStatusPath, JSON.stringify(this.phaseStatus, null, 2));
  }

  // Watch for file changes in real-time
  startFileWatcher() {
    const chokidar = require('chokidar');
    
    // Watch all potential phase files
    const watchPatterns = [];
    Object.values(this.phases).forEach(phase => {
      watchPatterns.push(...(phase.files || []));
      watchPatterns.push(...(phase.tests || []));
      watchPatterns.push(...(phase.routeFiles || []));
    });

    const watcher = chokidar.watch(watchPatterns.map(p => path.join(this.projectRoot, p)), {
      persistent: true,
      ignoreInitial: true
    });

    console.log('👀 Watching for phase completion...');
    console.log('   Press Ctrl+C to stop\n');

    let checkTimeout;
    watcher.on('all', (event, filePath) => {
      console.log(`📁 Detected ${event}: ${path.relative(this.projectRoot, filePath)}`);
      
      // Debounce checks
      clearTimeout(checkTimeout);
      checkTimeout = setTimeout(() => {
        this.checkPhaseCompletion();
      }, 2000);
    });

    // Keep process alive
    process.stdin.resume();
  }

  // Generate progress report
  generateProgressReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overallProgress: Math.round(this.phaseStatus.overallProgress * 100),
      summary: {
        totalPhases: Object.keys(this.phases).length,
        completedPhases: this.phaseStatus.completedPhases.length,
        currentPhase: this.phases[this.phaseStatus.currentPhase]?.name,
        nextPhases: this.phaseStatus.nextPhases.length
      },
      phases: {}
    };

    Object.entries(this.phases).forEach(([phaseId, phase]) => {
      const status = this.phaseStatus.phases[phaseId];
      report.phases[phaseId] = {
        name: phase.name,
        priority: phase.priority,
        timeline: phase.timeline,
        progress: status ? Math.round(status.progress * 100) : 0,
        completed: status?.completed || false,
        canStart: status?.canStart !== false,
        blockedBy: status?.blockedBy || [],
        filesCompleted: status?.filesCompleted || 0,
        totalFiles: (phase.files?.length || 0) + (phase.routeFiles?.length || 0)
      };
    });

    return report;
  }

  // CLI interface
  static cli() {
    const tracker = new PhaseTracker();
    const [,, command, ...args] = process.argv;

    const commands = {
      check: () => {
        tracker.checkPhaseCompletion();
      },
      
      watch: () => {
        tracker.checkPhaseCompletion();
        tracker.startFileWatcher();
      },
      
      status: () => {
        const report = tracker.generateProgressReport();
        console.log('\n📊 IMPLEMENTATION PLAN STATUS\n');
        console.log(`🎯 Overall Progress: ${report.overallProgress}%`);
        console.log(`📋 Current Phase: ${report.summary.currentPhase}`);
        console.log(`✅ Completed: ${report.summary.completedPhases}/${report.summary.totalPhases} phases`);
        console.log(`🔄 Next Available: ${report.summary.nextPhases} phases`);
        
        console.log('\n📋 Phase Details:');
        Object.entries(report.phases).forEach(([phaseId, phase]) => {
          const status = phase.completed ? '✅' : phase.canStart ? '🚧' : '⏸️';
          console.log(`  ${status} ${phase.name} (${phase.progress}%)`);
          if (phase.blockedBy.length > 0) {
            console.log(`      🚫 Blocked by: ${phase.blockedBy.join(', ')}`);
          }
        });
      },
      
      report: () => {
        const report = tracker.generateProgressReport();
        console.log(JSON.stringify(report, null, 2));
      },
      
      force: () => {
        const [phaseId] = args;
        if (phaseId && tracker.phases[phaseId]) {
          console.log(`🔄 Force completing phase: ${phaseId}`);
          const phase = tracker.phases[phaseId];
          const result = tracker.analyzePhase(phaseId, phase);
          result.completed = true;
          tracker.handlePhaseCompletion(phaseId, phase, result);
        } else {
          console.log('❌ Invalid phase ID. Available phases:');
          Object.keys(tracker.phases).forEach(id => {
            console.log(`  - ${id}: ${tracker.phases[id].name}`);
          });
        }
      },
      
      help: () => {
        console.log(`
📋 Phase Tracker for Implementation Plan

Commands:
  check                    - Check current phase completion status
  watch                   - Watch files and auto-check completion
  status                  - Show detailed progress status
  report                  - Generate JSON progress report
  force <phase-id>        - Force mark phase as complete
  help                    - Show this help message

Examples:
  npm run claude:phase-check
  npm run claude:phase-watch
  npm run claude:phase-status
  npm run claude:phase-force phase1-infrastructure

Phase IDs:
${Object.entries(tracker.phases).map(([id, phase]) => `  - ${id}: ${phase.name}`).join('\n')}
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

module.exports = PhaseTracker;

// Run CLI if called directly
if (require.main === module) {
  PhaseTracker.cli();
}