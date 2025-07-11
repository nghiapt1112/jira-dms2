#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class KnowledgeBaseUpdater {
  constructor() {
    this.kbPath = path.join(__dirname, '../knowledge-base');
    this.ensureKnowledgeBaseExists();
  }

  ensureKnowledgeBaseExists() {
    if (!fs.existsSync(this.kbPath)) {
      fs.mkdirSync(this.kbPath, { recursive: true });
      console.log('📁 Created knowledge-base directory');
    }
  }

  // Update progress for a component/feature
  updateProgress(component, status, notes) {
    const logPath = path.join(this.kbPath, 'implementation-log.md');
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];
    
    const entry = `
## ${date} ${time} - ${component}
- **Status**: ${status}
- **Type**: Component/Feature Update
- **Notes**: ${notes || 'No additional notes'}
- **Updated by**: Claude Code

`;
    
    // Create file if it doesn't exist
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '# Implementation Log\n\n');
    }
    
    // Append entry
    fs.appendFileSync(logPath, entry);
    
    // Update current progress
    this.updateCurrentProgress(component, status);
    
    console.log(`✅ Updated progress for ${component}`);
    console.log(`   Status: ${status}`);
    if (notes) console.log(`   Notes: ${notes}`);
  }

  // Update current progress tracking
  updateCurrentProgress(component, status) {
    const progressPath = path.join(this.kbPath, 'current-progress.md');
    
    let content = '';
    if (fs.existsSync(progressPath)) {
      content = fs.readFileSync(progressPath, 'utf8');
    } else {
      content = `# Current Progress\n\nLast Updated: ${new Date().toISOString()}\n\n## Components\n\n`;
    }
    
    // Update last updated
    content = content.replace(
      /Last Updated: .*/,
      `Last Updated: ${new Date().toISOString()}`
    );
    
    // Check if component already exists
    const componentRegex = new RegExp(`- \\[.\\] ${component}.*`, 'g');
    if (content.match(componentRegex)) {
      // Update existing
      if (status.toLowerCase() === 'completed') {
        content = content.replace(
          componentRegex,
          `- [x] ${component} ✅ (${new Date().toISOString().split('T')[0]})`
        );
      }
    } else {
      // Add new component
      const checkbox = status.toLowerCase() === 'completed' ? 'x' : ' ';
      const statusEmoji = status.toLowerCase() === 'completed' ? '✅' : '🚧';
      const newEntry = `- [${checkbox}] ${component} ${statusEmoji}`;
      
      // Find components section and add
      if (content.includes('## Components')) {
        content = content.replace(
          '## Components\n',
          `## Components\n${newEntry}\n`
        );
      } else {
        content += `\n## Components\n${newEntry}\n`;
      }
    }
    
    fs.writeFileSync(progressPath, content);
  }

  // Update context by scanning the codebase
  async updateContext() {
    console.log('🔍 Scanning codebase for context update...');
    
    const contextPath = path.join(this.kbPath, 'current-context.json');
    const srcPath = path.join(__dirname, '../../src');
    
    const context = {
      lastUpdated: new Date().toISOString(),
      features: {},
      components: [],
      services: [],
      stores: [],
      hooks: [],
      utils: [],
      pendingTodos: [],
      recentChanges: []
    };
    
    // Scan features directory
    const featuresPath = path.join(srcPath, 'features');
    if (fs.existsSync(featuresPath)) {
      const features = fs.readdirSync(featuresPath).filter(f => 
        fs.statSync(path.join(featuresPath, f)).isDirectory()
      );
      
      features.forEach(feature => {
        context.features[feature] = this.analyzeFeature(path.join(featuresPath, feature));
      });
    }
    
    // Scan for TODOs
    context.pendingTodos = this.findTodos(srcPath);
    
    // Count components, services, etc.
    Object.values(context.features).forEach(feature => {
      context.components.push(...(feature.components || []));
      context.services.push(...(feature.services || []));
      context.stores.push(...(feature.stores || []));
      context.hooks.push(...(feature.hooks || []));
    });
    
    // Save context
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
    
    // Generate summary
    this.generateContextSummary(context);
    
    console.log('✅ Context updated successfully');
    console.log(`📊 Found: ${context.components.length} components, ${context.services.length} services, ${context.stores.length} stores`);
    console.log(`📝 ${context.pendingTodos.length} TODOs found`);
  }

  // Analyze a feature directory
  analyzeFeature(featurePath) {
    const feature = {
      name: path.basename(featurePath),
      components: [],
      services: [],
      stores: [],
      hooks: [],
      utils: []
    };
    
    // Check each subdirectory
    const subdirs = ['components', 'services', 'store', 'hooks', 'utils'];
    
    subdirs.forEach(subdir => {
      const subdirPath = path.join(featurePath, subdir);
      if (fs.existsSync(subdirPath)) {
        const files = this.getJSFiles(subdirPath);
        
        switch(subdir) {
          case 'components':
            feature.components = files.map(f => ({
              name: path.basename(f, '.js'),
              path: f,
              hasTests: fs.existsSync(f.replace('.js', '.test.js'))
            }));
            break;
          case 'services':
            feature.services = files.map(f => path.basename(f, '.js'));
            break;
          case 'store':
            feature.stores = files.map(f => path.basename(f, '.js'));
            break;
          case 'hooks':
            feature.hooks = files.map(f => path.basename(f, '.js'));
            break;
          case 'utils':
            feature.utils = files.map(f => path.basename(f, '.js'));
            break;
        }
      }
    });
    
    return feature;
  }

  // Get all JS files recursively
  getJSFiles(dir) {
    const files = [];
    
    const scan = (directory) => {
      fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.startsWith('.')) {
          scan(fullPath);
        } else if (file.endsWith('.js') && !file.includes('.test.') && !file.includes('.spec.')) {
          files.push(fullPath);
        }
      });
    };
    
    scan(dir);
    return files;
  }

  // Find all TODOs in the codebase
  findTodos(dir) {
    const todos = [];
    
    const scan = (directory) => {
      fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scan(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes('TODO:') || line.includes('FIXME:') || line.includes('@TODO')) {
              todos.push({
                file: path.relative(path.join(__dirname, '../../src'), fullPath),
                line: index + 1,
                content: line.trim().replace(/.*(?:TODO:|FIXME:|@TODO)\s*/, '')
              });
            }
          });
        }
      });
    };
    
    scan(dir);
    return todos;
  }

  // Generate context summary
  generateContextSummary(context) {
    const summaryPath = path.join(this.kbPath, 'context-summary.md');
    
    const summary = `# Context Summary

Generated: ${context.lastUpdated}

## Overview

- **Total Features**: ${Object.keys(context.features).length}
- **Total Components**: ${context.components.length}
- **Total Services**: ${context.services.length}
- **Total Stores**: ${context.stores.length}
- **Total Hooks**: ${context.hooks.length}
- **Pending TODOs**: ${context.pendingTodos.length}

## Features

${Object.entries(context.features).map(([name, feature]) => `
### ${name}
- Components: ${feature.components.length}
- Services: ${feature.services.length}
- Stores: ${feature.stores.length}
- Hooks: ${feature.hooks.length}
`).join('\n')}

## Component Coverage

${context.components.map(comp => 
  `- ${comp.name} ${comp.hasTests ? '✅ (tested)' : '⚠️  (no tests)'}`
).join('\n')}

## Pending TODOs

${context.pendingTodos.slice(0, 10).map(todo => 
  `- ${todo.content} (${todo.file}:${todo.line})`
).join('\n')}
${context.pendingTodos.length > 10 ? `\n... and ${context.pendingTodos.length - 10} more` : ''}
`;
    
    fs.writeFileSync(summaryPath, summary);
  }

  // Document an architecture decision
  documentDecision(title, rationale, alternatives = 'None specified') {
    const decisionsPath = path.join(this.kbPath, 'architecture-decisions.md');
    const date = new Date().toISOString().split('T')[0];
    
    const entry = `
## ${date} - ${title}
**Status**: Accepted
**Context**: Need to make a decision about ${title}
**Decision**: ${title}
**Rationale**: ${rationale}
**Alternatives Considered**: ${alternatives}
**Consequences**: To be observed
**Updated by**: Claude Code

---
`;
    
    // Create file if it doesn't exist
    if (!fs.existsSync(decisionsPath)) {
      fs.writeFileSync(decisionsPath, '# Architecture Decision Records\n\n');
    }
    
    fs.appendFileSync(decisionsPath, entry);
    console.log(`✅ Documented decision: ${title}`);
  }

  // Add a manual note
  addNote(category, content) {
    const notesPath = path.join(this.kbPath, 'notes.md');
    const date = new Date().toISOString();
    
    const entry = `
## ${date}
**Category**: ${category}
**Note**: ${content}

---
`;
    
    if (!fs.existsSync(notesPath)) {
      fs.writeFileSync(notesPath, '# Notes\n\n');
    }
    
    fs.appendFileSync(notesPath, entry);
    console.log(`✅ Added note in category: ${category}`);
  }

  // Show current status
  showStatus() {
    console.log('\n📊 KNOWLEDGE BASE STATUS\n');
    
    // Check implementation log
    const logPath = path.join(this.kbPath, 'implementation-log.md');
    if (fs.existsSync(logPath)) {
      const log = fs.readFileSync(logPath, 'utf8');
      const completedCount = (log.match(/Status: completed/gi) || []).length;
      console.log(`✅ Completed items: ${completedCount}`);
    }
    
    // Check current context
    const contextPath = path.join(this.kbPath, 'current-context.json');
    if (fs.existsSync(contextPath)) {
      const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
      console.log(`\n📁 Features: ${Object.keys(context.features).length}`);
      console.log(`🧩 Components: ${context.components.length}`);
      console.log(`📝 TODOs: ${context.pendingTodos.length}`);
      console.log(`\n🕒 Last updated: ${context.lastUpdated}`);
    }
    
    console.log('\n');
  }
}

// CLI handling
const updater = new KnowledgeBaseUpdater();
const [,, command, ...args] = process.argv;

const commands = {
  updateProgress: () => updater.updateProgress(...args),
  updateContext: () => updater.updateContext(),
  documentDecision: () => updater.documentDecision(...args),
  addNote: () => updater.addNote(...args),
  status: () => updater.showStatus(),
  help: () => {
    console.log(`
📚 Knowledge Base Updater

Commands:
  updateProgress <component> <status> [notes]
    Update progress for a component
    Example: updateProgress "MainDashboard" "completed" "Added all charts"

  updateContext
    Scan codebase and update context
    Example: updateContext

  documentDecision <title> <rationale> [alternatives]
    Document an architecture decision
    Example: documentDecision "Use IndexedDB" "Files are 130MB+" "localStorage"

  addNote <category> <content>
    Add a note to the knowledge base
    Example: addNote "performance" "Charts slow with 50k+ records"

  status
    Show current knowledge base status
    Example: status

  help
    Show this help message
`);
  }
};

// Execute command
if (commands[command]) {
  commands[command]();
} else {
  console.log(`❌ Unknown command: ${command}`);
  commands.help();
}
