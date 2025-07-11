#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function quickContext() {
  const featuresPath = path.join(__dirname, '../../src/features');
  
  console.log('\n🎯 QUICK PROJECT CONTEXT\n');
  console.log('=' * 50);
  
  // List features
  console.log('\n📁 FEATURES:');
  if (fs.existsSync(featuresPath)) {
    fs.readdirSync(featuresPath).forEach(feature => {
      const featurePath = path.join(featuresPath, feature);
      if (fs.statSync(featurePath).isDirectory()) {
        console.log(`\n  📦 ${feature}/`);
        
        // Check what exists in each feature
        const components = path.join(featurePath, 'components');
        const services = path.join(featurePath, 'services');
        const store = path.join(featurePath, 'store');
        const hooks = path.join(featurePath, 'hooks');
        
        if (fs.existsSync(components)) {
          const componentCount = fs.readdirSync(components).length;
          console.log(`     ├── components/ (${componentCount} items)`);
        }
        if (fs.existsSync(services)) {
          const serviceCount = fs.readdirSync(services).length;
          console.log(`     ├── services/ (${serviceCount} items)`);
        }
        if (fs.existsSync(store)) {
          const storeCount = fs.readdirSync(store).length;
          console.log(`     ├── store/ (${storeCount} items)`);
        }
        if (fs.existsSync(hooks)) {
          const hookCount = fs.readdirSync(hooks).length;
          console.log(`     └── hooks/ (${hookCount} items)`);
        }
      }
    });
  }
  
  // Check for existing knowledge base
  const kbPath = path.join(__dirname, '../knowledge-base');
  if (fs.existsSync(kbPath)) {
    console.log('\n\n📚 EXISTING KNOWLEDGE BASE:');
    fs.readdirSync(kbPath).forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    console.log('\n\n⚠️  No knowledge base found. Run init-context.js to create one.');
  }
  
  console.log('\n' + '=' * 50);
}

quickContext();
