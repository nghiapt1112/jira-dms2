#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ContextInitializer {
  constructor() {
    this.context = {
      timestamp: new Date().toISOString(),
      projectStructure: {},
      components: [],
      services: [],
      stores: [],
      hooks: [],
      utils: [],
      dependencies: {},
      patterns: {},
      todos: [],
      architecture: {},
      dataFlow: []
    };
  }

  // Analyze project structure
  analyzeProjectStructure(rootPath) {
    console.log('🔍 Analyzing project structure...');
    
    const structure = {};
    
    const scanDirectory = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          structure[relPath] = {
            type: 'directory',
            children: []
          };
          scanDirectory(fullPath, relPath);
        } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
          if (!structure[relativePath]) {
            structure[relativePath] = { type: 'directory', children: [] };
          }
          structure[relativePath].children.push(item);
        }
      });
    };
    
    scanDirectory(rootPath);
    this.context.projectStructure = structure;
  }

  // Analyze components
  analyzeComponents(componentsPath) {
    console.log('🧩 Analyzing components...');
    
    if (!fs.existsSync(componentsPath)) return;
    
    const analyzeComponent = (filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      const componentName = fileName.replace(/\.(js|jsx)$/, '');
      
      const component = {
        name: componentName,
        path: filePath,
        type: 'unknown',
        props: [],
        state: [],
        hooks: [],
        dependencies: [],
        exports: []
      };
      
      // Detect component type
      if (content.includes('React.memo')) {
        component.type = 'memoized-functional';
      } else if (content.includes('function ' + componentName) || content.includes('const ' + componentName)) {
        component.type = 'functional';
      } else if (content.includes('class ' + componentName)) {
        component.type = 'class';
      }
      
      // Extract props from PropTypes
      const propTypesMatch = content.match(/PropTypes\s*=\s*{([^}]+)}/);
      if (propTypesMatch) {
        const propsContent = propTypesMatch[1];
        const props = propsContent.match(/(\w+):/g);
        if (props) {
          component.props = props.map(p => p.replace(':', ''));
        }
      }
      
      // Extract hooks usage
      const hookMatches = content.match(/use[A-Z]\w+/g);
      if (hookMatches) {
        component.hooks = [...new Set(hookMatches)];
      }
      
      // Extract imports
      const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        component.dependencies = importMatches.map(imp => {
          const match = imp.match(/from\s+['"]([^'"]+)['"]/);
          return match ? match[1] : '';
        }).filter(Boolean);
      }
      
      // Extract exports
      if (content.includes('export default')) {
        component.exports.push('default');
      }
      const namedExports = content.match(/export\s+{([^}]+)}/);
      if (namedExports) {
        const exports = namedExports[1].split(',').map(e => e.trim());
        component.exports.push(...exports);
      }
      
      this.context.components.push(component);
    };
    
    // Recursively analyze all components
    const scanComponentDir = (dir) => {
      fs.readdirSync(dir).forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanComponentDir(fullPath);
        } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
          if (!item.includes('.test.') && !item.includes('.spec.')) {
            analyzeComponent(fullPath);
          }
        }
      });
    };
    
    scanComponentDir(componentsPath);
  }

  // Analyze services
  analyzeServices(servicesPath) {
    console.log('🔧 Analyzing services...');
    
    if (!fs.existsSync(servicesPath)) return;
    
    const analyzeService = (filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      const service = {
        name: fileName.replace(/\.(js|jsx)$/, ''),
        path: filePath,
        methods: [],
        dependencies: [],
        exports: []
      };
      
      // Extract exported functions/methods
      const functionMatches = content.match(/(?:export\s+)?(?:const|function)\s+(\w+)\s*=/g);
      if (functionMatches) {
        service.methods = functionMatches.map(match => {
          const nameMatch = match.match(/(\w+)\s*=/);
          return nameMatch ? nameMatch[1] : '';
        }).filter(Boolean);
      }
      
      // Extract class methods if it's a class
      const classMatch = content.match(/class\s+\w+\s*{([^}]+)}/s);
      if (classMatch) {
        const methodMatches = classMatch[1].match(/(\w+)\s*\(/g);
        if (methodMatches) {
          service.methods.push(...methodMatches.map(m => m.replace('(', '').trim()));
        }
      }
      
      this.context.services.push(service);
    };
    
    fs.readdirSync(servicesPath).forEach(file => {
      if (file.endsWith('.js')) {
        analyzeService(path.join(servicesPath, file));
      }
    });
  }

  // Analyze Zustand stores
  analyzeStores(featuresPath) {
    console.log('🗄️ Analyzing stores...');
    
    const findStores = (dir) => {
      fs.readdirSync(dir).forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && item === 'store') {
          // Found a store directory
          fs.readdirSync(fullPath).forEach(storeFile => {
            if (storeFile.endsWith('.js')) {
              this.analyzeStore(path.join(fullPath, storeFile));
            }
          });
        } else if (stat.isDirectory() && !item.startsWith('.')) {
          findStores(fullPath);
        }
      });
    };
    
    findStores(featuresPath);
  }

  analyzeStore(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    const store = {
      name: fileName.replace(/\.(js|jsx)$/, ''),
      path: filePath,
      state: [],
      actions: [],
      selectors: []
    };
    
    // Extract state properties
    const stateMatch = content.match(/create\s*\(\s*\(([^)]+)\)\s*=>\s*\({([^}]+)}|create\s*\(\s*\(\)\s*=>\s*\({([^}]+)}/s);
    if (stateMatch) {
      const stateContent = stateMatch[2] || stateMatch[3];
      if (stateContent) {
        const stateProps = stateContent.match(/(\w+):/g);
        if (stateProps) {
          store.state = stateProps.map(p => p.replace(':', ''));
        }
      }
    }
    
    // Extract actions (functions that call set)
    const actionMatches = content.match(/(\w+):\s*(?:async\s+)?\([^)]*\)\s*=>\s*[^,}]+set\(/g);
    if (actionMatches) {
      store.actions = actionMatches.map(match => {
        const nameMatch = match.match(/(\w+):/);
        return nameMatch ? nameMatch[1] : '';
      }).filter(Boolean);
    }
    
    this.context.stores.push(store);
  }

  // Extract TODOs and FIXMEs
  extractTodos(rootPath) {
    console.log('📝 Extracting TODOs...');
    
    const findTodos = (dir) => {
      fs.readdirSync(dir).forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          findTodos(fullPath);
        } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes('TODO:') || line.includes('FIXME:') || line.includes('@TODO')) {
              this.context.todos.push({
                file: path.relative(rootPath, fullPath),
                line: index + 1,
                content: line.trim()
              });
            }
          });
        }
      });
    };
    
    findTodos(rootPath);
  }

  // Analyze data flow patterns
  analyzeDataFlow() {
    console.log('🔄 Analyzing data flow...');
    
    // Look for common patterns
    this.context.components.forEach(component => {
      // Check if component uses stores
      const storeUsage = component.hooks.filter(hook => 
        this.context.stores.some(store => 
          hook.toLowerCase().includes(store.name.toLowerCase())
        )
      );
      
      if (storeUsage.length > 0) {
        this.context.dataFlow.push({
          component: component.name,
          stores: storeUsage,
          type: 'state-consumer'
        });
      }
      
      // Check if component makes API calls
      if (component.dependencies.some(dep => dep.includes('service'))) {
        this.context.dataFlow.push({
          component: component.name,
          services: component.dependencies.filter(dep => dep.includes('service')),
          type: 'api-consumer'
        });
      }
    });
  }

  // Generate summary report
  generateReport() {
    console.log('📊 Generating context report...');
    
    const report = `# Project Context Analysis Report

Generated: ${this.context.timestamp}

## Project Statistics

- **Total Components**: ${this.context.components.length}
- **Total Services**: ${this.context.services.length}
- **Total Stores**: ${this.context.stores.length}
- **Total TODOs**: ${this.context.todos.length}

## Architecture Overview

### Component Types
${this.generateComponentTypesSummary()}

### State Management
${this.generateStateManagementSummary()}

### Data Flow Patterns
${this.generateDataFlowSummary()}

## Component Details

${this.generateComponentDetails()}

## Services

${this.generateServiceDetails()}

## Stores

${this.generateStoreDetails()}

## Pending TODOs

${this.generateTodoList()}

## Recommendations

${this.generateRecommendations()}
`;
    
    // Save report
    const knowledgeBasePath = path.join(__dirname, '../knowledge-base');
    if (!fs.existsSync(knowledgeBasePath)) {
      fs.mkdirSync(knowledgeBasePath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(knowledgeBasePath, 'initial-context-analysis.md'),
      report
    );
    
    // Save raw context data
    fs.writeFileSync(
      path.join(knowledgeBasePath, 'context-data.json'),
      JSON.stringify(this.context, null, 2)
    );
    
    console.log('✅ Context analysis complete!');
    console.log(`📄 Report saved to: ${knowledgeBasePath}/initial-context-analysis.md`);
  }

  generateComponentTypesSummary() {
    const types = {};
    this.context.components.forEach(comp => {
      types[comp.type] = (types[comp.type] || 0) + 1;
    });
    
    return Object.entries(types)
      .map(([type, count]) => `- **${type}**: ${count} components`)
      .join('\n');
  }

  generateStateManagementSummary() {
    return this.context.stores.map(store => 
      `### ${store.name}
- **State Properties**: ${store.state.join(', ')}
- **Actions**: ${store.actions.join(', ')}`
    ).join('\n\n');
  }

  generateDataFlowSummary() {
    const stateConsumers = this.context.dataFlow.filter(df => df.type === 'state-consumer');
    const apiConsumers = this.context.dataFlow.filter(df => df.type === 'api-consumer');
    
    return `
### State Consumers (${stateConsumers.length} components)
${stateConsumers.map(df => `- **${df.component}** uses: ${df.stores.join(', ')}`).join('\n')}

### API Consumers (${apiConsumers.length} components)
${apiConsumers.map(df => `- **${df.component}** uses: ${df.services.join(', ')}`).join('\n')}
`;
  }

  generateComponentDetails() {
    return this.context.components.slice(0, 10).map(comp => 
      `### ${comp.name}
- **Type**: ${comp.type}
- **Props**: ${comp.props.join(', ') || 'None'}
- **Hooks**: ${comp.hooks.join(', ') || 'None'}
- **Path**: ${comp.path}`
    ).join('\n\n') + '\n\n*... and ' + Math.max(0, this.context.components.length - 10) + ' more components*';
  }

  generateServiceDetails() {
    return this.context.services.map(service => 
      `### ${service.name}
- **Methods**: ${service.methods.join(', ') || 'None detected'}
- **Path**: ${service.path}`
    ).join('\n\n');
  }

  generateStoreDetails() {
    return this.context.stores.map(store => 
      `### ${store.name}
- **State**: ${store.state.join(', ') || 'None detected'}
- **Actions**: ${store.actions.join(', ') || 'None detected'}
- **Path**: ${store.path}`
    ).join('\n\n');
  }

  generateTodoList() {
    return this.context.todos.slice(0, 20).map(todo => 
      `- ${todo.content} (${todo.file}:${todo.line})`
    ).join('\n') + 
    (this.context.todos.length > 20 ? `\n\n*... and ${this.context.todos.length - 20} more TODOs*` : '');
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check for missing React.memo
    const unmemoizedComponents = this.context.components.filter(c => 
      c.type === 'functional' && !c.type.includes('memoized')
    );
    if (unmemoizedComponents.length > 0) {
      recommendations.push(`- Add React.memo to ${unmemoizedComponents.length} functional components`);
    }
    
    // Check for missing PropTypes
    const componentsWithoutProps = this.context.components.filter(c => 
      c.props.length === 0
    );
    if (componentsWithoutProps.length > 0) {
      recommendations.push(`- Add PropTypes to ${componentsWithoutProps.length} components`);
    }
    
    // Check for TODOs
    if (this.context.todos.length > 20) {
      recommendations.push(`- Address ${this.context.todos.length} pending TODOs`);
    }
    
    return recommendations.join('\n');
  }

  // Main execution
  run(projectPath) {
    console.log('🚀 Initializing project context...\n');
    
    this.analyzeProjectStructure(projectPath);
    
    // Analyze different parts of the project
    const srcPath = path.join(projectPath, 'src');
    
    if (fs.existsSync(path.join(srcPath, 'components'))) {
      this.analyzeComponents(path.join(srcPath, 'components'));
    }
    
    if (fs.existsSync(path.join(srcPath, 'features'))) {
      this.analyzeComponents(path.join(srcPath, 'features'));
      this.analyzeStores(path.join(srcPath, 'features'));
      
      // Also analyze services in features
      fs.readdirSync(path.join(srcPath, 'features')).forEach(feature => {
        const servicesPath = path.join(srcPath, 'features', feature, 'services');
        if (fs.existsSync(servicesPath)) {
          this.analyzeServices(servicesPath);
        }
      });
    }
    
    if (fs.existsSync(path.join(srcPath, 'shared/services'))) {
      this.analyzeServices(path.join(srcPath, 'shared/services'));
    }
    
    this.extractTodos(srcPath);
    this.analyzeDataFlow();
    this.generateReport();
  }
}

// Execute
const initializer = new ContextInitializer();
const projectPath = process.argv[2] || path.join(__dirname, '../../..');
initializer.run(projectPath);
