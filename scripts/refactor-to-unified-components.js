#!/usr/bin/env node

/**
 * Refactor Manual Dark Mode Classes to Unified Components
 * 
 * This script helps systematically replace manual dark mode classes
 * with unified components (Text, Container, Badge, Table).
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../src');

// Files to exclude from refactoring
const EXCLUDE_FILES = [
  'src/app/globals.css',
  'src/components/ui/text.tsx',
  'src/components/ui/container.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/table-unified.tsx',
  'src/components/examples/',
  'src/app/unified-demo/',
  'scripts/',
  'node_modules/',
];

// Get all TypeScript/TSX files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_FILES.some(exclude => filePath.includes(exclude))) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (!EXCLUDE_FILES.some(exclude => filePath.includes(exclude))) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Common patterns for refactoring
const REFACTOR_PATTERNS = [
  {
    name: 'Text Primary',
    pattern: /text-neutral-800\s+dark:text-white\/95/g,
    replacement: 'Text.Primary',
    component: 'Text',
    import: "import { Text } from '@/components/ui/text'"
  },
  {
    name: 'Text Secondary',
    pattern: /text-neutral-600\s+dark:text-white\/75/g,
    replacement: 'Text.Secondary',
    component: 'Text',
    import: "import { Text } from '@/components/ui/text'"
  },
  {
    name: 'Text Tertiary',
    pattern: /text-neutral-500\s+dark:text-white\/65/g,
    replacement: 'Text.Tertiary',
    component: 'Text',
    import: "import { Text } from '@/components/ui/text'"
  },
  {
    name: 'Text Muted',
    pattern: /text-neutral-400\s+dark:text-white\/55/g,
    replacement: 'Text.Muted',
    component: 'Text',
    import: "import { Text } from '@/components/ui/text'"
  }
];

// Analyze a file for refactoring opportunities
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const opportunities = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for manual dark mode classes
    const manualDarkModeMatch = line.match(/dark:text-white\/[0-9]+/g);
    if (manualDarkModeMatch) {
      opportunities.push({
        line: lineNum,
        content: line.trim(),
        type: 'manual-dark-mode',
        classes: manualDarkModeMatch
      });
    }
    
    // Check for hardcoded backgrounds
    const hardcodedBgMatch = line.match(/bg-white(?!\s*[^>]*dark:bg-)/g);
    if (hardcodedBgMatch) {
      opportunities.push({
        line: lineNum,
        content: line.trim(),
        type: 'hardcoded-background',
        classes: hardcodedBgMatch
      });
    }
  });
  
  return opportunities;
}

// Generate refactoring suggestions
function generateSuggestions(filePath, opportunities) {
  if (opportunities.length === 0) return null;
  
  const suggestions = {
    file: filePath,
    totalOpportunities: opportunities.length,
    manualDarkMode: opportunities.filter(o => o.type === 'manual-dark-mode').length,
    hardcodedBackgrounds: opportunities.filter(o => o.type === 'hardcoded-background').length,
    examples: opportunities.slice(0, 5), // Show first 5 examples
    imports: new Set()
  };
  
  // Determine needed imports
  opportunities.forEach(opp => {
    if (opp.type === 'manual-dark-mode') {
      suggestions.imports.add("import { Text } from '@/components/ui/text'");
    }
    if (opp.type === 'hardcoded-background') {
      suggestions.imports.add("import { Container } from '@/components/ui/container'");
    }
  });
  
  return suggestions;
}

// Main analysis function
function runAnalysis() {
  console.log('🔍 Analyzing Refactoring Opportunities...\n');
  
  const files = getAllFiles(ROOT_DIR);
  const allSuggestions = [];
  
  files.forEach(file => {
    const opportunities = analyzeFile(file);
    const suggestions = generateSuggestions(file, opportunities);
    if (suggestions) {
      allSuggestions.push(suggestions);
    }
  });
  
  // Sort by number of opportunities
  allSuggestions.sort((a, b) => b.totalOpportunities - a.totalOpportunities);
  
  console.log('📊 Refactoring Analysis Results:');
  console.log(`   Files with opportunities: ${allSuggestions.length}`);
  console.log(`   Total opportunities: ${allSuggestions.reduce((sum, s) => sum + s.totalOpportunities, 0)}`);
  console.log(`   Manual dark mode classes: ${allSuggestions.reduce((sum, s) => sum + s.manualDarkMode, 0)}`);
  console.log(`   Hardcoded backgrounds: ${allSuggestions.reduce((sum, s) => sum + s.hardcodedBackgrounds, 0)}\n`);
  
  // Show top 10 files with most opportunities
  console.log('🎯 Top 10 Files with Most Refactoring Opportunities:');
  allSuggestions.slice(0, 10).forEach((suggestion, index) => {
    console.log(`   ${index + 1}. ${suggestion.file}`);
    console.log(`      Total: ${suggestion.totalOpportunities}, Manual dark mode: ${suggestion.manualDarkMode}, Hardcoded bg: ${suggestion.hardcodedBackgrounds}`);
    console.log(`      Needed imports: ${Array.from(suggestion.imports).join(', ')}`);
    console.log();
  });
  
  // Show examples from top file
  if (allSuggestions.length > 0) {
    const topFile = allSuggestions[0];
    console.log(`📝 Examples from ${topFile.file}:`);
    topFile.examples.forEach(example => {
      console.log(`   Line ${example.line}: ${example.content}`);
    });
    console.log();
  }
  
  console.log('📋 Next Steps:');
  console.log('   1. Start with files that have the most opportunities');
  console.log('   2. Add necessary imports (Text, Container, Badge, Table)');
  console.log('   3. Replace manual dark mode classes with unified components');
  console.log('   4. Test each file after refactoring');
  console.log('   5. Run audit again to verify improvements');
  
  return allSuggestions.length;
}

// Run the analysis
const opportunityCount = runAnalysis();
process.exit(opportunityCount > 0 ? 1 : 0);
