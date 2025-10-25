#!/usr/bin/env node

/**
 * Unified Components Architecture Audit
 * 
 * This script audits the codebase to identify:
 * 1. Components that are NOT using unified components
 * 2. Manual dark mode classes that should be replaced
 * 3. Text colors without dark mode variants
 * 4. Hardcoded background colors
 */

const fs = require('fs');
const path = require('path');

// Patterns to identify violations
const VIOLATIONS = {
  // Manual dark mode classes (anti-pattern)
  manualDarkMode: {
    pattern: /dark:text-white\/[0-9]+/g,
    description: 'Manual dark mode classes (should use unified components)',
    severity: 'HIGH'
  },
  
  // Text colors without dark mode variants
  textWithoutDarkMode: {
    pattern: /text-neutral-[0-9]+(?!.*dark:)/g,
    description: 'Text colors without dark mode variants',
    severity: 'CRITICAL'
  },
  
  // Hardcoded background colors
  hardcodedBackgrounds: {
    pattern: /bg-white(?!.*dark:)/g,
    description: 'Hardcoded white backgrounds (should use Container components)',
    severity: 'HIGH'
  },
  
  // Raw HTML elements instead of components
  rawElements: {
    pattern: /<(h[1-6]|p|span|div)(?!.*className.*Text\.)/g,
    description: 'Raw HTML elements (should use Text components)',
    severity: 'MEDIUM'
  }
};

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];
    
    // Skip demo files and our unified components
    if (filePath.includes('examples/') || 
        filePath.includes('unified-components-demo') ||
        filePath.includes('refactor-demo') ||
        filePath.includes('ui/text.tsx') ||
        filePath.includes('ui/container.tsx') ||
        filePath.includes('ui/table-unified.tsx')) {
      return violations;
    }
    
    Object.entries(VIOLATIONS).forEach(([type, config]) => {
      const matches = content.match(config.pattern);
      if (matches) {
        matches.forEach(match => {
          const lines = content.substring(0, content.indexOf(match)).split('\n');
          const lineNumber = lines.length;
          
          violations.push({
            type,
            severity: config.severity,
            description: config.description,
            match,
            line: lineNumber,
            file: filePath
          });
        });
      }
    });
    
    return violations;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dir, results = { files: {}, total: 0, bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } }) {
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          scanDirectory(fullPath, results);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        const violations = scanFile(fullPath);
        if (violations.length > 0) {
          results.files[fullPath] = violations;
          results.total += violations.length;
          violations.forEach(v => {
            results.bySeverity[v.severity]++;
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  
  return results;
}

function generateReport(results) {
  console.log('🔍 Unified Components Architecture Audit');
  console.log('==========================================\n');
  
  console.log('📊 Summary:');
  console.log(`Total violations: ${results.total}`);
  console.log(`Files with violations: ${Object.keys(results.files).length}`);
  console.log(`Critical: ${results.bySeverity.CRITICAL}`);
  console.log(`High: ${results.bySeverity.HIGH}`);
  console.log(`Medium: ${results.bySeverity.MEDIUM}`);
  console.log(`Low: ${results.bySeverity.LOW}\n`);
  
  // Group by severity
  const criticalFiles = [];
  const highFiles = [];
  const mediumFiles = [];
  
  Object.entries(results.files).forEach(([file, violations]) => {
    const hasCritical = violations.some(v => v.severity === 'CRITICAL');
    const hasHigh = violations.some(v => v.severity === 'HIGH');
    const hasMedium = violations.some(v => v.severity === 'MEDIUM');
    
    if (hasCritical) criticalFiles.push({ file, violations });
    else if (hasHigh) highFiles.push({ file, violations });
    else if (hasMedium) mediumFiles.push({ file, violations });
  });
  
  // Report Critical issues
  if (criticalFiles.length > 0) {
    console.log('🚨 CRITICAL ISSUES (Text without dark mode):');
    criticalFiles.forEach(({ file, violations }) => {
      const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
      console.log(`\n📁 ${file}`);
      criticalViolations.forEach(v => {
        console.log(`  Line ${v.line}: ${v.match} - ${v.description}`);
      });
    });
  }
  
  // Report High issues
  if (highFiles.length > 0) {
    console.log('\n⚠️  HIGH PRIORITY (Manual dark mode classes):');
    highFiles.slice(0, 10).forEach(({ file, violations }) => {
      const highViolations = violations.filter(v => v.severity === 'HIGH');
      console.log(`\n📁 ${file}`);
      highViolations.slice(0, 5).forEach(v => {
        console.log(`  Line ${v.line}: ${v.match} - ${v.description}`);
      });
      if (highViolations.length > 5) {
        console.log(`  ... and ${highViolations.length - 5} more`);
      }
    });
  }
  
  // Report Medium issues
  if (mediumFiles.length > 0) {
    console.log('\nℹ️  MEDIUM PRIORITY (Raw HTML elements):');
    mediumFiles.slice(0, 5).forEach(({ file, violations }) => {
      const mediumViolations = violations.filter(v => v.severity === 'MEDIUM');
      console.log(`\n📁 ${file}`);
      mediumViolations.slice(0, 3).forEach(v => {
        console.log(`  Line ${v.line}: ${v.match} - ${v.description}`);
      });
      if (mediumViolations.length > 3) {
        console.log(`  ... and ${mediumViolations.length - 3} more`);
      }
    });
  }
  
  console.log('\n💡 Recommendations:');
  console.log('1. Replace manual dark mode classes with unified components');
  console.log('2. Use Text.Primary, Text.Secondary, etc. instead of raw HTML');
  console.log('3. Use Container components instead of hardcoded backgrounds');
  console.log('4. Add dark mode variants to all text colors');
  console.log('5. Gradually refactor components to use unified architecture');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Fix CRITICAL issues first (text without dark mode)');
  console.log('2. Replace HIGH priority manual dark mode classes');
  console.log('3. Refactor MEDIUM priority raw HTML elements');
  console.log('4. Test all components in both light and dark mode');
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
const results = scanDirectory(srcDir);
generateReport(results);
