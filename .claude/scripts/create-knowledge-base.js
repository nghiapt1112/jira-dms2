#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '../knowledge-base');

// Create directory structure
const dirs = [
  kbPath,
  path.join(kbPath, 'features'),
  path.join(kbPath, 'decisions'),
  path.join(kbPath, 'logs')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create initial files
const files = {
  'README.md': `# Knowledge Base

This directory contains the project context and documentation.

## Structure
- \`features/\` - Feature-specific documentation
- \`decisions/\` - Architecture decision records
- \`logs/\` - Implementation logs
- \`context-data.json\` - Current project context
- \`initial-context-analysis.md\` - Initial code analysis

## Usage
1. Run \`npm run claude:init-context\` to analyze existing code
2. Run \`npm run claude:quick-context\` for a quick overview
3. Run \`npm run claude:update-context\` to update the context
`,
  
  'implementation-log.md': `# Implementation Log

## ${new Date().toISOString().split('T')[0]} - Project Initialized
- Status: Started
- Next: Analyze existing codebase
`,
  
  'architecture-decisions.md': `# Architecture Decision Records

## Template
\`\`\`
## YYYY-MM-DD - Decision Title
**Status**: Accepted/Rejected/Superseded
**Context**: What is the issue we're trying to solve?
**Decision**: What have we decided to do?
**Consequences**: What are the results of this decision?
\`\`\`
`,
  
  'current-progress.md': `# Current Progress

Last Updated: ${new Date().toISOString()}

## Status
- [ ] Context initialization
- [ ] Code analysis
- [ ] Feature identification
- [ ] Architecture documentation

## Next Steps
1. Run context initialization
2. Document existing features
3. Identify improvement areas
`
};

Object.entries(files).forEach(([filename, content]) => {
  fs.writeFileSync(path.join(kbPath, filename), content);
});

console.log('✅ Knowledge base structure created!');
