#!/usr/bin/env node

/**
 * Text Contrast Audit Tool
 * 
 * This script helps identify text contrast issues in the codebase
 * by finding hardcoded gray text colors that may not have proper
 * dark mode variants.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors that are likely to have contrast issues in dark mode
const PROBLEMATIC_COLORS = [
  'text-neutral-400',
  'text-neutral-500', 
  'text-neutral-600',
  'text-gray-400',
  'text-gray-500',
  'text-gray-600',
  'text-slate-400',
  'text-slate-500',
  'text-slate-600'
];

// Colors that need dark mode variants
const NEEDS_DARK_VARIANTS = [
  'text-neutral-800',
  'text-neutral-700',
  'text-neutral-600',
  'text-neutral-500',
  'text-neutral-400',
  'text-gray-800',
  'text-gray-700',
  'text-gray-600',
  'text-gray-500',
  'text-gray-400',
  'text-slate-800',
  'text-slate-700',
  'text-slate-600',
  'text-slate-500',
  'text-slate-400'
];

function findFilesWithPattern(pattern, directory = 'src') {
  try {
    const result = execSync(`grep -r "${pattern}" ${directory} --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" -n`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result.split('\n').filter(line => line.trim());
  } catch (error) {
    return [];
  }
}

function auditContrastIssues() {
  console.log('🔍 Text Contrast Audit Tool');
  console.log('==========================\n');

  console.log('📊 Summary of Potential Contrast Issues:\n');

  // Find files with problematic colors
  const problematicFiles = new Set();
  
  NEEDS_DARK_VARIANTS.forEach(color => {
    const matches = findFilesWithPattern(color);
    matches.forEach(match => {
      const [filePath] = match.split(':');
      problematicFiles.add(filePath);
    });
  });

  console.log(`Found ${problematicFiles.size} files with potential contrast issues:\n`);

  // Group by severity
  const critical = [];
  const moderate = [];
  const low = [];

  problematicFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const issues = [];
    
    lines.forEach((line, index) => {
      NEEDS_DARK_VARIANTS.forEach(color => {
        if (line.includes(color) && !line.includes('dark:')) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            color: color
          });
        }
      });
    });

    if (issues.length > 0) {
      const severity = issues.length > 10 ? 'critical' : issues.length > 5 ? 'moderate' : 'low';
      
      const fileIssues = {
        file: filePath,
        issues: issues,
        severity: severity
      };

      if (severity === 'critical') critical.push(fileIssues);
      else if (severity === 'moderate') moderate.push(fileIssues);
      else low.push(fileIssues);
    }
  });

  // Display results by severity
  if (critical.length > 0) {
    console.log('🚨 CRITICAL (10+ issues):');
    critical.forEach(file => {
      console.log(`  ${file.file} (${file.issues.length} issues)`);
    });
    console.log('');
  }

  if (moderate.length > 0) {
    console.log('⚠️  MODERATE (5-9 issues):');
    moderate.forEach(file => {
      console.log(`  ${file.file} (${file.issues.length} issues)`);
    });
    console.log('');
  }

  if (low.length > 0) {
    console.log('ℹ️  LOW (1-4 issues):');
    low.forEach(file => {
      console.log(`  ${file.file} (${file.issues.length} issues)`);
    });
    console.log('');
  }

  // Show specific examples
  console.log('📝 Example Issues Found:\n');
  
  const allIssues = [...critical, ...moderate, ...low];
  const examples = allIssues.slice(0, 5);
  
  examples.forEach(file => {
    console.log(`File: ${file.file}`);
    file.issues.slice(0, 3).forEach(issue => {
      console.log(`  Line ${issue.line}: ${issue.content}`);
      console.log(`  Issue: ${issue.color} needs dark mode variant`);
    });
    console.log('');
  });

  // Recommendations
  console.log('💡 Recommendations:\n');
  console.log('1. Add dark mode variants to all text colors:');
  console.log('   text-neutral-800 → text-neutral-800 dark:text-white/95');
  console.log('   text-neutral-600 → text-neutral-600 dark:text-white/75');
  console.log('   text-neutral-500 → text-neutral-500 dark:text-white/65');
  console.log('   text-neutral-400 → text-neutral-400 dark:text-white/55');
  console.log('');
  console.log('2. Use semantic tokens where possible:');
  console.log('   text-neutral-800 → text-neutral-800 dark:text-white/95');
  console.log('   text-neutral-600 → text-neutral-600 dark:text-white/75');
  console.log('');
  console.log('3. Test contrast ratios with WebAIM Contrast Checker');
  console.log('   https://webaim.org/resources/contrastchecker/');
  console.log('');
  console.log('4. Target contrast ratios:');
  console.log('   - Normal text: 4.5:1 (WCAG AA)');
  console.log('   - Large text: 3:1 (WCAG AA)');
  console.log('   - UI components: 3:1 (WCAG AA)');
}

// Run the audit
auditContrastIssues();
