#!/usr/bin/env node

/**
 * Improved Unified Components & Dark Mode Audit
 * 
 * This script audits the codebase for:
 * 1. Text colors without dark mode variants
 * 2. Manual dark mode classes that should use unified components
 * 3. Hardcoded backgrounds that should use Container components
 * 4. Raw HTML elements that should use unified components
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../src');

// Files to exclude from audit
const EXCLUDE_FILES = [
  'src/app/globals.css', // Global CSS definitions
  'src/components/ui/text.tsx', // Unified text components
  'src/components/ui/container.tsx', // Unified container components
  'src/components/ui/badge.tsx', // Unified badge component
  'src/components/ui/table-unified.tsx', // Unified table components
  'src/components/examples/unified-components-demo.tsx', // Demo files
  'src/components/examples/refactor-demo.tsx',
  'src/app/unified-demo/page.tsx',
  'scripts/', // Script files
  'node_modules/', // Dependencies
];

// Get all TypeScript/TSX files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip excluded directories
      if (!EXCLUDE_FILES.some(exclude => filePath.includes(exclude))) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Skip excluded files
      if (!EXCLUDE_FILES.some(exclude => filePath.includes(exclude))) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Check if a line has dark mode variants
function hasDarkModeVariant(line, textClass) {
  // Look for dark: variants on the same line
  // Handle different dark mode patterns like dark:text-white/75, dark:text-white/95, etc.
  const darkModePatterns = [
    new RegExp(`dark:${textClass.replace('text-', 'text-')}`),
    /dark:text-white\/[0-9]+/,
    /dark:text-neutral-[0-9]+/,
    /dark:hover:text-white\/[0-9]+/,
    /dark:hover:text-neutral-[0-9]+/,
    /dark:focus:text-white\/[0-9]+/,
    /dark:focus:text-neutral-[0-9]+/
  ];
  
  return darkModePatterns.some(pattern => pattern.test(line));
}

// Audit a single file
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for text-neutral classes without dark mode variants
    const textNeutralMatch = line.match(/\btext-neutral-[0-9]+\b/g);
    if (textNeutralMatch) {
      textNeutralMatch.forEach(match => {
        if (!hasDarkModeVariant(line, match)) {
          violations.push({
            type: 'CRITICAL',
            message: `Text color '${match}' without dark mode variant`,
            line: lineNum,
            content: line.trim(),
            file: filePath
          });
        }
      });
    }
    
    // Check for manual dark mode classes (should use unified components)
    const manualDarkModeMatch = line.match(/dark:text-white\/[0-9]+/g);
    if (manualDarkModeMatch) {
      violations.push({
        type: 'HIGH',
        message: `Manual dark mode class '${manualDarkModeMatch[0]}' (should use unified components)`,
        line: lineNum,
        content: line.trim(),
        file: filePath
      });
    }
    
    // Check for hardcoded white backgrounds
    const hardcodedBgMatch = line.match(/\bbg-white\b(?!\s*[^>]*dark:bg-)/g);
    if (hardcodedBgMatch) {
      violations.push({
        type: 'HIGH',
        message: `Hardcoded white background (should use Container components)`,
        line: lineNum,
        content: line.trim(),
        file: filePath
      });
    }
    
    // Check for raw HTML text elements
    const rawTextMatch = line.match(/<(h[1-6]|p|span|div|label|li|td|th)\b[^>]*class=(["'])(?:(?!\2).)*\b(text-(neutral|gray|slate)-[0-9]{2,3})\b(?:(?!\2).)*\2[^>]*>/g);
    if (rawTextMatch) {
      violations.push({
        type: 'MEDIUM',
        message: `Raw HTML element with text colors (should use Text components)`,
        line: lineNum,
        content: line.trim(),
        file: filePath
      });
    }
  });
  
  return violations;
}

// Main audit function
function runAudit() {
  console.log('🔍 Running Improved Unified Components & Dark Mode Audit...\n');
  
  const files = getAllFiles(ROOT_DIR);
  const allViolations = [];
  
  files.forEach(file => {
    const violations = auditFile(file);
    allViolations.push(...violations);
  });
  
  // Group violations by type
  const critical = allViolations.filter(v => v.type === 'CRITICAL');
  const high = allViolations.filter(v => v.type === 'HIGH');
  const medium = allViolations.filter(v => v.type === 'MEDIUM');
  
  console.log('📊 Audit Results:');
  console.log(`   CRITICAL: ${critical.length} issues`);
  console.log(`   HIGH: ${high.length} issues`);
  console.log(`   MEDIUM: ${medium.length} issues`);
  console.log(`   TOTAL: ${allViolations.length} issues\n`);
  
  if (critical.length > 0) {
    console.log('🚨 CRITICAL Issues:');
    critical.forEach(violation => {
      console.log(`   ${violation.file}:${violation.line}`);
      console.log(`   ${violation.message}`);
      console.log(`   ${violation.content}\n`);
    });
  }
  
  if (high.length > 0) {
    console.log('⚠️  HIGH Priority Issues:');
    high.slice(0, 10).forEach(violation => {
      console.log(`   ${violation.file}:${violation.line} - ${violation.message}`);
    });
    if (high.length > 10) {
      console.log(`   ... and ${high.length - 10} more HIGH priority issues`);
    }
    console.log();
  }
  
  if (medium.length > 0) {
    console.log('📝 MEDIUM Priority Issues:');
    console.log(`   ${medium.length} raw HTML elements that should use unified components`);
    console.log();
  }
  
  // Summary
  if (allViolations.length === 0) {
    console.log('✅ No violations found! All components are properly unified.');
  } else {
    console.log('📋 Next Steps:');
    if (critical.length > 0) {
      console.log('   1. Fix CRITICAL text contrast issues first');
    }
    if (high.length > 0) {
      console.log('   2. Replace manual dark mode classes with unified components');
    }
    if (medium.length > 0) {
      console.log('   3. Replace raw HTML elements with unified components');
    }
  }
  
  return allViolations.length;
}

// Run the audit
const violationCount = runAudit();
process.exit(violationCount > 0 ? 1 : 0);
