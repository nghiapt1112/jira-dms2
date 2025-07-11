#!/usr/bin/env node
/**
 * Auto-Context Workflow Manager
 * Automatically updates Claude Code context when changes are detected
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoContextWorkflow {
  constructor() {
    this.projectRoot = path.join(__dirname, '../..');
    this.kbPath = path.join(__dirname, '../knowledge-base');
    this.contextPath = path.join(this.kbPath, 'auto-context.json');
    this.rulesPath = path.join(this.kbPath, 'workflow-rules.json');
    
    this.ensureKnowledgeBaseExists();
    this.loadContext();
    this.loadRules();
  }

  ensureKnowledgeBaseExists() {
    if (!fs.existsSync(this.kbPath)) {
      fs.mkdirSync(this.kbPath, { recursive: true });
      console.log('📁 Created knowledge-base directory');
    }
  }

  // Load existing context or create new
  loadContext() {
    if (fs.existsSync(this.contextPath)) {
      this.context = JSON.parse(fs.readFileSync(this.contextPath, 'utf8'));
    } else {
      this.context = {
        lastUpdate: new Date().toISOString(),
        features: {},
        components: {},
        services: {},
        stores: {},
        implementations: [],
        patterns: {},
        decisions: [],
        todos: [],
        metrics: {
          totalComponents: 0,
          featuresCompleted: 0,
          codeQuality: 'unknown'
        }
      };
    }
  }

  // Load workflow rules configuration
  loadRules() {
    const defaultRules = {
      triggers: {
        newComponent: {
          pattern: 'src/**/components/**/*.jsx',
          action: 'analyzeNewComponent',
          priority: 'high'
        },
        newFeature: {
          pattern: 'src/features/**/index.js',
          action: 'analyzeNewFeature', 
          priority: 'high'
        },
        apiService: {
          pattern: 'src/**/services/**/*.js',
          action: 'analyzeAPIService',
          priority: 'medium'
        },
        storeUpdate: {
          pattern: 'src/**/store/**/*.js',
          action: 'analyzeStoreUpdate',
          priority: 'medium'
        }
      },
      contextRules: {
        maxImplementations: 100,
        maxDecisions: 50,
        contextSummaryInterval: 10,
        pruneOldContext: true
      }
    };

    if (fs.existsSync(this.rulesPath)) {
      this.rules = { ...defaultRules, ...JSON.parse(fs.readFileSync(this.rulesPath, 'utf8')) };
    } else {
      this.rules = defaultRules;
      this.saveRules();
    }
  }

  // Analyze new React component
  analyzeNewComponent(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) return;

    const content = fs.readFileSync(fullPath, 'utf8');
    const componentName = path.basename(fullPath, '.jsx');
    
    const analysis = {
      name: componentName,
      path: filePath,
      type: 'component',
      created: new Date().toISOString(),
      props: this.extractProps(content),
      hooks: this.extractHooks(content),
      dependencies: this.extractImports(content),
      hasTests: fs.existsSync(fullPath.replace('.jsx', '.test.jsx')),
      complexity: this.calculateComplexity(content),
      purpose: this.inferPurpose(componentName, content)
    };

    this.context.components[componentName] = analysis;
    this.logImplementation('component', componentName, 'created', analysis);
    
    console.log(`📊 Analyzed component: ${componentName}`);
    return analysis;
  }

  // Analyze feature directory
  analyzeFeatureDirectory(featurePath) {
    const featureDir = path.join(this.projectRoot, 'src/features', featurePath);
    if (!fs.existsSync(featureDir)) return;

    const featureName = path.basename(featureDir);
    
    const analysis = {
      name: featureName,
      path: `src/features/${featurePath}`,
      type: 'feature',
      created: new Date().toISOString(),
      structure: this.analyzeFeatureStructure(featureDir),
      components: this.findFeatureComponents(featureDir),
      services: this.findFeatureServices(featureDir),
      stores: this.findFeatureStores(featureDir),
      completeness: this.assessFeatureCompleteness(featureDir)
    };

    this.context.features[featureName] = analysis;
    this.logImplementation('feature', featureName, 'analyzed', analysis);
    
    console.log(`🎯 Analyzed feature: ${featureName}`);
    return analysis;
  }

  // Analyze feature structure
  analyzeFeatureStructure(featureDir) {
    const structure = {};
    const subdirs = ['components', 'services', 'store', 'hooks', 'utils'];
    
    subdirs.forEach(subdir => {
      const subdirPath = path.join(featureDir, subdir);
      if (fs.existsSync(subdirPath)) {
        structure[subdir] = fs.readdirSync(subdirPath)
          .filter(file => file.endsWith('.js') || file.endsWith('.jsx'))
          .map(file => path.basename(file, path.extname(file)));
      }
    });
    
    return structure;
  }

  // Find feature components
  findFeatureComponents(featureDir) {
    const componentsDir = path.join(featureDir, 'components');
    if (!fs.existsSync(componentsDir)) return [];
    
    return fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.jsx'))
      .map(file => ({
        name: path.basename(file, '.jsx'),
        hasTests: fs.existsSync(path.join(componentsDir, file.replace('.jsx', '.test.jsx')))
      }));
  }

  // Find feature services
  findFeatureServices(featureDir) {
    const servicesDir = path.join(featureDir, 'services');
    if (!fs.existsSync(servicesDir)) return [];
    
    return fs.readdirSync(servicesDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.basename(file, '.js'));
  }

  // Find feature stores
  findFeatureStores(featureDir) {
    const storeDir = path.join(featureDir, 'store');
    if (!fs.existsSync(storeDir)) return [];
    
    return fs.readdirSync(storeDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.basename(file, '.js'));
  }

  // Assess feature completeness
  assessFeatureCompleteness(featureDir) {
    const expectedDirs = ['components', 'services', 'store'];
    const existingDirs = expectedDirs.filter(dir => 
      fs.existsSync(path.join(featureDir, dir))
    );
    
    const completeness = (existingDirs.length / expectedDirs.length) * 100;
    return Math.round(completeness);
  }

  // Extract React props from component code
  extractProps(content) {
    const propsRegex = /function\s+\w+\s*\(\s*\{([^}]+)\}/;
    const match = content.match(propsRegex);
    if (match) {
      return match[1].split(',').map(prop => prop.trim()).filter(Boolean);
    }
    return [];
  }

  // Extract React hooks usage
  extractHooks(content) {
    const hookRegex = /use\w+/g;
    const matches = content.match(hookRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  // Extract import statements
  extractImports(content) {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  // Calculate code complexity (simple heuristic)
  calculateComplexity(content) {
    const lines = content.split('\n').length;
    const cyclomaticComplexity = (content.match(/if|while|for|switch|catch/g) || []).length;
    
    if (lines < 50 && cyclomaticComplexity < 5) return 'low';
    if (lines < 150 && cyclomaticComplexity < 10) return 'medium';
    return 'high';
  }

  // Infer component purpose from name and content
  inferPurpose(name, content) {
    const purposes = {
      'Dashboard': 'data visualization',
      'Form': 'user input',
      'Modal': 'overlay display',
      'Button': 'user interaction',
      'Chart': 'data visualization',
      'Table': 'data display',
      'Layout': 'page structure'
    };

    for (const [key, purpose] of Object.entries(purposes)) {
      if (name.includes(key) || content.includes(key)) {
        return purpose;
      }
    }

    return 'general component';
  }

  // Log implementation in structured format
  logImplementation(type, name, action, details) {
    const implementation = {
      timestamp: new Date().toISOString(),
      type,
      name,
      action,
      details: {
        ...details,
        contextVersion: this.context.lastUpdate
      }
    };

    this.context.implementations.unshift(implementation);
    
    // Keep only recent implementations
    if (this.context.implementations.length > this.rules.contextRules.maxImplementations) {
      this.context.implementations = this.context.implementations.slice(0, this.rules.contextRules.maxImplementations);
    }
  }

  // Scan entire codebase for context update
  scanCodebase() {
    console.log('🔍 Scanning codebase for context update...');
    
    // Scan features
    const featuresDir = path.join(this.projectRoot, 'src/features');
    if (fs.existsSync(featuresDir)) {
      fs.readdirSync(featuresDir).forEach(featureName => {
        const featurePath = path.join(featuresDir, featureName);
        if (fs.statSync(featurePath).isDirectory()) {
          this.analyzeFeatureDirectory(featureName);
        }
      });
    }

    // Scan components
    const componentsDir = path.join(this.projectRoot, 'src/components');
    if (fs.existsSync(componentsDir)) {
      this.scanDirectory(componentsDir, '.jsx', (filePath) => {
        const relativePath = path.relative(this.projectRoot, filePath);
        this.analyzeNewComponent(relativePath);
      });
    }

    // Update metrics
    this.updateMetrics();
    this.saveContext();
    
    console.log('✅ Codebase scan complete');
  }

  // Recursively scan directory
  scanDirectory(dir, extension, callback) {
    fs.readdirSync(dir).forEach(item => {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        this.scanDirectory(itemPath, extension, callback);
      } else if (item.endsWith(extension)) {
        callback(itemPath);
      }
    });
  }

  // Update metrics
  updateMetrics() {
    this.context.metrics = {
      totalComponents: Object.keys(this.context.components).length,
      totalFeatures: Object.keys(this.context.features).length,
      totalServices: Object.keys(this.context.services).length,
      featuresCompleted: Object.values(this.context.features).filter(f => f.completeness === 100).length,
      codeQuality: this.assessCodeQuality(),
      lastScan: new Date().toISOString()
    };
  }

  // Assess overall code quality
  assessCodeQuality() {
    const components = Object.values(this.context.components);
    if (components.length === 0) return 'unknown';
    
    const lowComplexity = components.filter(c => c.complexity === 'low').length;
    const hasTests = components.filter(c => c.hasTests).length;
    
    const qualityScore = (lowComplexity + hasTests) / (components.length * 2);
    
    if (qualityScore > 0.8) return 'excellent';
    if (qualityScore > 0.6) return 'good';
    if (qualityScore > 0.4) return 'fair';
    return 'needs improvement';
  }

  // Generate context injection for Claude Code
  generateContextInjection() {
    const recentImplementations = this.context.implementations.slice(0, 10);
    const featureStatus = Object.values(this.context.features).map(f => ({
      name: f.name,
      completeness: f.completeness,
      components: f.components?.length || 0
    }));

    const contextInjection = {
      projectSummary: {
        totalFeatures: Object.keys(this.context.features).length,
        totalComponents: Object.keys(this.context.components).length,
        totalServices: Object.keys(this.context.services).length,
        codeQuality: this.context.metrics.codeQuality,
        lastUpdate: this.context.lastUpdate
      },
      recentActivity: recentImplementations.map(impl => ({
        type: impl.type,
        name: impl.name,
        action: impl.action,
        timestamp: impl.timestamp
      })),
      currentFeatures: featureStatus,
      pendingTodos: this.context.todos.slice(0, 5),
      architecturalPatterns: this.context.patterns,
      nextPriorities: this.calculateNextPriorities(),
      recommendations: this.generateRecommendations()
    };

    return contextInjection;
  }

  // Calculate next priorities based on current state
  calculateNextPriorities() {
    const priorities = [];
    
    // Check for incomplete features
    Object.values(this.context.features).forEach(feature => {
      if (feature.completeness < 100) {
        priorities.push(`Complete ${feature.name} feature (${feature.completeness}% done)`);
      }
    });

    // Check for components without tests
    Object.values(this.context.components).forEach(component => {
      if (!component.hasTests) {
        priorities.push(`Add tests for ${component.name} component`);
      }
    });

    // Check for high complexity components
    Object.values(this.context.components).forEach(component => {
      if (component.complexity === 'high') {
        priorities.push(`Refactor ${component.name} component (high complexity)`);
      }
    });

    return priorities.slice(0, 5); // Top 5 priorities
  }

  // Generate recommendations based on analysis
  generateRecommendations() {
    const recommendations = [];
    
    if (this.context.metrics.codeQuality === 'needs improvement') {
      recommendations.push('Focus on adding tests and reducing component complexity');
    }
    
    const incompleteFeatures = Object.values(this.context.features).filter(f => f.completeness < 100);
    if (incompleteFeatures.length > 0) {
      recommendations.push(`Complete ${incompleteFeatures.length} pending features`);
    }
    
    const untestedComponents = Object.values(this.context.components).filter(c => !c.hasTests);
    if (untestedComponents.length > 0) {
      recommendations.push(`Add tests for ${untestedComponents.length} components`);
    }
    
    return recommendations;
  }

  // Save context to file
  saveContext() {
    this.context.lastUpdate = new Date().toISOString();
    fs.writeFileSync(this.contextPath, JSON.stringify(this.context, null, 2));
  }

  // Save rules to file
  saveRules() {
    fs.writeFileSync(this.rulesPath, JSON.stringify(this.rules, null, 2));
  }

  // CLI interface
  static cli() {
    const workflow = new AutoContextWorkflow();
    const [,, command, ...args] = process.argv;

    const commands = {
      scan: () => {
        workflow.scanCodebase();
        console.log('📊 Full codebase scan complete');
      },
      
      analyze: () => {
        const [filePath] = args;
        if (filePath && filePath.endsWith('.jsx')) {
          workflow.analyzeNewComponent(filePath);
        } else {
          workflow.scanCodebase();
        }
      },
      
      inject: () => {
        const context = workflow.generateContextInjection();
        console.log('🧠 CLAUDE CODE CONTEXT INJECTION\n');
        console.log('='.repeat(50));
        console.log('\n📊 PROJECT SUMMARY:');
        Object.entries(context.projectSummary).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        
        console.log('\n🚀 RECENT ACTIVITY:');
        context.recentActivity.slice(0, 5).forEach(activity => {
          console.log(`  - ${activity.action} ${activity.type}: ${activity.name}`);
        });
        
        console.log('\n🎯 CURRENT FEATURES:');
        context.currentFeatures.forEach(feature => {
          console.log(`  - ${feature.name}: ${feature.completeness}% complete (${feature.components} components)`);
        });
        
        console.log('\n📋 NEXT PRIORITIES:');
        context.nextPriorities.forEach((priority, index) => {
          console.log(`  ${index + 1}. ${priority}`);
        });
        
        if (context.recommendations.length > 0) {
          console.log('\n💡 RECOMMENDATIONS:');
          context.recommendations.forEach(rec => {
            console.log(`  - ${rec}`);
          });
        }
        
        console.log('\n='.repeat(50));
        console.log('End of context injection\n');
      },
      
      feature: () => {
        const [featureName, action] = args;
        if (action === 'complete') {
          console.log(`✅ Marking ${featureName} as complete`);
          if (workflow.context.features[featureName]) {
            workflow.context.features[featureName].completeness = 100;
            workflow.logImplementation('feature', featureName, 'completed', { completeness: 100 });
            workflow.saveContext();
          }
        } else {
          workflow.analyzeFeatureDirectory(featureName);
        }
      },
      
      status: () => {
        const context = workflow.generateContextInjection();
        console.log('\n📊 AUTO-CONTEXT WORKFLOW STATUS\n');
        console.log(`🎯 Features: ${context.projectSummary.totalFeatures}`);
        console.log(`🧩 Components: ${context.projectSummary.totalComponents}`);
        console.log(`🔧 Services: ${context.projectSummary.totalServices}`);
        console.log(`📈 Code Quality: ${context.projectSummary.codeQuality}`);
        console.log(`🕒 Last Update: ${context.projectSummary.lastUpdate}`);
        
        if (context.nextPriorities.length > 0) {
          console.log(`\n📋 Top Priorities:`);
          context.nextPriorities.slice(0, 3).forEach((priority, index) => {
            console.log(`  ${index + 1}. ${priority}`);
          });
        }
      },
      
      help: () => {
        console.log(`
🤖 Auto-Context Workflow for Claude Code

Commands:
  scan                 - Full codebase scan and context update
  analyze [file]       - Analyze specific file or full codebase
  inject              - Generate context injection for Claude Code
  feature <name> [complete] - Analyze feature or mark as complete
  status              - Show current workflow status
  help                - Show this help message

Examples:
  npm run claude:auto-scan
  npm run claude:auto-inject
  npm run claude:auto-feature authentication complete
  npm run claude:auto-status
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

module.exports = AutoContextWorkflow;

// Run CLI if called directly
if (require.main === module) {
  AutoContextWorkflow.cli();
}
