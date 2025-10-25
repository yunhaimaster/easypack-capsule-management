#!/usr/bin/env node

/**
 * Detailed Contrast Audit
 * 
 * This script provides detailed information about contrast issues
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../src');

// Get all TypeScript/TSX files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('scripts')) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check for text colors without dark mode variants
function checkContrastIssues(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Pattern to find text-neutral-X00 classes without dark mode variants
  // But exclude hover states that already have dark mode variants
  const textPattern = /\btext-neutral-[0-9]+\b(?!\s*[^>]*(?:dark:text-|dark:hover:text-|dark:focus:text-))/g;
  
  lines.forEach((line, index) => {
    const matches = line.match(textPattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          file: path.relative(ROOT_DIR, filePath),
          line: index + 1,
          text: line.trim(),
          issue: match
        });
      });
    }
  });
  
  return issues;
}

// Main function
function runDetailedAudit() {
  console.log('🔍 Detailed Contrast Audit\n');
  
  const files = getAllFiles(ROOT_DIR);
  let totalIssues = 0;
  const fileIssues = {};
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const issues = checkContrastIssues(content, file);
      
      if (issues.length > 0) {
        fileIssues[path.relative(ROOT_DIR, file)] = issues;
        totalIssues += issues.length;
      }
    } catch (error) {
      console.log(`❌ Error reading ${path.relative(ROOT_DIR, file)}: ${error.message}`);
    }
  });
  
  console.log(`📊 Found ${totalIssues} potential contrast issues in ${Object.keys(fileIssues).length} files:\n`);
  
  Object.entries(fileIssues).forEach(([file, issues]) => {
    console.log(`📁 ${file}:`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.issue}`);
      console.log(`   ${issue.text}`);
    });
    console.log('');
  });
  
  if (totalIssues === 0) {
    console.log('✅ No contrast issues found!');
  }
  
  return totalIssues;
}

// Run the detailed audit
const totalIssues = runDetailedAudit();
process.exit(totalIssues > 0 ? 1 : 0);
