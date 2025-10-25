#!/usr/bin/env node

/**
 * Automated Contrast Fix Tool
 * 
 * This script automatically fixes common text contrast issues by adding
 * appropriate dark mode variants to hardcoded gray text colors.
 */

const fs = require('fs');
const path = require('path');

// Mapping of problematic colors to their dark mode variants
const COLOR_MAPPINGS = {
  // High contrast text (titles, important content)
  'text-neutral-900': 'text-neutral-900 dark:text-white/95',
  'text-neutral-800': 'text-neutral-800 dark:text-white/95',
  'text-gray-900': 'text-gray-900 dark:text-white/95',
  'text-gray-800': 'text-gray-800 dark:text-white/95',
  'text-slate-900': 'text-slate-900 dark:text-white/95',
  'text-slate-800': 'text-slate-800 dark:text-white/95',
  
  // Medium contrast text (body text, descriptions)
  'text-neutral-700': 'text-neutral-700 dark:text-white/85',
  'text-neutral-600': 'text-neutral-600 dark:text-white/75',
  'text-gray-700': 'text-gray-700 dark:text-white/85',
  'text-gray-600': 'text-gray-600 dark:text-white/75',
  'text-slate-700': 'text-slate-700 dark:text-white/85',
  'text-slate-600': 'text-slate-600 dark:text-white/75',
  
  // Lower contrast text (secondary info, labels)
  'text-neutral-500': 'text-neutral-500 dark:text-white/65',
  'text-gray-500': 'text-gray-500 dark:text-white/65',
  'text-slate-500': 'text-slate-500 dark:text-white/65',
  
  // Lowest contrast text (tertiary info, placeholders)
  'text-neutral-400': 'text-neutral-400 dark:text-white/55',
  'text-gray-400': 'text-gray-400 dark:text-white/55',
  'text-slate-400': 'text-slate-400 dark:text-white/55',
};

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Apply color mappings
    Object.entries(COLOR_MAPPINGS).forEach(([oldColor, newColor]) => {
      // Only replace if the line doesn't already have a dark mode variant
      const regex = new RegExp(`\\b${oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?!.*dark:)`, 'g');
      if (newContent.includes(oldColor) && !newContent.includes(`${oldColor} dark:`)) {
        newContent = newContent.replace(regex, newColor);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function fixContrastIssues() {
  console.log('🔧 Automated Contrast Fix Tool');
  console.log('==============================\n');
  
  // Get list of files with contrast issues
  const { execSync } = require('child_process');
  
  let filesToFix = [];
  try {
    const result = execSync('node scripts/contrast-audit.js', { encoding: 'utf8' });
    const lines = result.split('\n');
    
    // Extract file paths from the output
    lines.forEach(line => {
      if (line.includes('src/') && line.includes('issues)')) {
        const match = line.match(/src\/[^\s]+/);
        if (match) {
          filesToFix.push(match[0]);
        }
      }
    });
  } catch (error) {
    console.error('Error getting file list:', error.message);
    return;
  }
  
  console.log(`Found ${filesToFix.length} files to fix\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const wasFixed = fixFile(filePath);
      if (wasFixed) {
        console.log(`✅ Fixed: ${filePath}`);
        fixedCount++;
      } else {
        console.log(`ℹ️  No changes needed: ${filePath}`);
      }
    } else {
      console.log(`❌ File not found: ${filePath}`);
      errorCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  Files fixed: ${fixedCount}`);
  console.log(`  Files unchanged: ${filesToFix.length - fixedCount - errorCount}`);
  console.log(`  Errors: ${errorCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 Successfully fixed contrast issues in ${fixedCount} files!`);
    console.log('\nNext steps:');
    console.log('1. Run: npm run build (to check for TypeScript errors)');
    console.log('2. Test the app in dark mode');
    console.log('3. Verify contrast ratios with WebAIM Contrast Checker');
  }
}

// Run the fix
fixContrastIssues();
