#!/usr/bin/env node
/**
 * Setup Auto-Context Workflow for Claude Code
 * One-time setup script to initialize the workflow system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class WorkflowSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.claudeDir = path.join(__dirname, '..');
    this.kbPath = path.join(this.claudeDir, 'knowledge-base');
  }

  async setup() {
    console.log('🚀 Setting up Claude Code Auto-Context Workflow...\n');

    try {
      // Step 1: Create directory structure
      this.createDirectories();
      
      // Step 2: Initialize knowledge base
      this.initializeKnowledgeBase();
      
      // Step 3: Run initial scan
      this.runInitialScan();
      
      // Step 4: Setup git hooks (optional)
      this.setupGitHooks();
      
      // Step 5: Create workflow configuration
      this.createWorkflowConfig();
      
      // Step 6: Test the system
      this.testWorkflow();
      
      console.log('\n✅ Auto-Context Workflow setup complete!\n');
      this.printUsageInstructions();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  createDirectories() {
    console.log('📁 Creating directory structure...');
    
    const dirs = [
      this.kbPath,
      path.join(this.kbPath, 'features'),
      path.join(this.kbPath, 'components'),
      path.join(this.kbPath, 'services'),
      path.join(this.kbPath, 'backups')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✓ Created ${path.relative(this.projectRoot, dir)}`);
      } else {
        console.log(`  • ${path.relative(this.projectRoot, dir)} already exists`);
      }
    });
  }

  initializeKnowledgeBase() {
    console.log('\n📚 Initializing knowledge base...');
    
    try {
      execSync('npm run claude:init', { cwd: this.projectRoot, stdio: 'inherit' });
      console.log('  ✓ Knowledge base initialized');
    } catch (error) {
      console.log('  • Knowledge base already exists or init failed');
    }
  }

  runInitialScan() {
    console.log('\n🔍 Running initial codebase scan...');
    
    try {
      execSync('npm run claude:auto-scan', { cwd: this.projectRoot, stdio: 'inherit' });
      console.log('  ✓ Initial scan complete');
    } catch (error) {
      console.error('  ❌ Initial scan failed:', error.message);
    }
  }

  setupGitHooks() {
    console.log('\n🎣 Setting up Git hooks...');
    
    const hooksDir = path.join(this.projectRoot, '.git/hooks');
    
    if (!fs.existsSync(hooksDir)) {
      console.log('  • No .git directory found, skipping git hooks');
      return;
    }

    // Pre-commit hook
    const preCommitHook = `#!/bin/sh
# Auto-update context before commit
echo "🔄 Updating Claude Code context..."
npm run claude:auto-scan --silent
echo "✅ Context updated"
`;

    // Post-commit hook  
    const postCommitHook = `#!/bin/sh
# Log commit in Claude Code context
echo "📝 Logging commit in Claude Code context..."
COMMIT_MSG=$(git log -1 --pretty=%B)
echo "Commit: $COMMIT_MSG" >> .claude/knowledge-base/commit-log.txt
echo "✅ Commit logged"
`;

    try {
      // Write hooks
      fs.writeFileSync(path.join(hooksDir, 'pre-commit'), preCommitHook);
      fs.writeFileSync(path.join(hooksDir, 'post-commit'), postCommitHook);
      
      // Make executable
      execSync('chmod +x .git/hooks/pre-commit .git/hooks/post-commit', { cwd: this.projectRoot });
      console.log('  ✓ Git hooks installed');
    } catch (error) {
      console.log('  ⚠️  Could not setup git hooks:', error.message);
    }
  }

  createWorkflowConfig() {
    console.log('\n⚙️  Creating workflow configuration...');
    
    const config = {
      version: "1.0.0",
      setupDate: new Date().toISOString(),
      project: {
        name: "jira-dms2",
        type: "React SPA",
        framework: "React + MUI + Vite"
      },
      workflow: {
        autoScanEnabled: true,
        gitHooksEnabled: true,
        contextInjectionEnabled: true,
        maxContextSize: "50MB",
        retentionDays: 30
      },
      triggers: {
        newComponent: true,
        newFeature: true,
        apiService: true,
        storeUpdate: true,
        configChange: true
      },
      notifications: {
        onFeatureComplete: true,
        onQualityChange: true,
        onErrorDetected: true
      }
    };

    const configPath = path.join(this.kbPath, 'workflow-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('  ✓ Workflow configuration created');
  }

  testWorkflow() {
    console.log('\n🧪 Testing workflow...');
    
    try {
      // Test status command
      execSync('npm run claude:auto-status', { cwd: this.projectRoot, stdio: 'pipe' });
      console.log('  ✓ Status command works');
      
      // Test inject command  
      execSync('npm run claude:auto-inject', { cwd: this.projectRoot, stdio: 'pipe' });
      console.log('  ✓ Context injection works');
      
      console.log('  ✓ All tests passed');
    } catch (error) {
      console.log('  ⚠️  Some tests failed, but setup is complete');
    }
  }

  printUsageInstructions() {
    console.log(`
🎯 USAGE INSTRUCTIONS

1. 📋 Get context for Claude Code:
   npm run claude:auto-inject

2. 🔍 Scan after changes:
   npm run claude:auto-scan

3. ✅ Mark features complete:
   npm run claude:auto-feature <name> complete

4. 📊 Check status:
   npm run claude:auto-status

📖 For detailed instructions, see:
   .claude/CLAUDE_CODE_WORKFLOW.md

🚀 Your Claude Code workflow is ready!
   The system will now automatically track your project context.
`);
  }
}

// CLI interface
const [,, command] = process.argv;

if (command === 'setup' || !command) {
  const setup = new WorkflowSetup();
  setup.setup();
} else {
  console.log('Usage: node setup-workflow.js [setup]');
}

module.exports = WorkflowSetup;
