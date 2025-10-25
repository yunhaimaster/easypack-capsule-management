#!/usr/bin/env node

/**
 * Fix Malformed Text Components
 * 
 * This script fixes malformed Text components created by the automated refactoring.
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

// Fix malformed Text components
function fixMalformedTextComponents(content) {
  let fixed = content;
  
  // Fix 1: Remove broken dark: classes from Text components
  fixed = fixed.replace(/dark:\s*$/g, '');
  
  // Fix 2: Remove text-neutral classes from Text components (they're redundant)
  fixed = fixed.replace(/text-neutral-[0-9]+\s+/g, '');
  
  // Fix 3: Fix malformed className attributes
  fixed = fixed.replace(/className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"/g, (match, before, component, after) => {
    const cleanBefore = before.replace(/\s+$/, '');
    const cleanAfter = after.replace(/^\s+/, '');
    return `className="${cleanBefore}${cleanAfter}"`;
  });
  
  // Fix 4: Fix broken hover classes
  fixed = fixed.replace(/hover:\s*$/g, '');
  
  // Fix 5: Fix malformed Text component usage
  fixed = fixed.replace(/<Text\.(Primary|Secondary|Tertiary|Muted)\s+as="([^"]+)"\s+className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"([^>]*)>/g, 
    '<Text.$1 as="$2" className="$3$5"$6>');
  
  // Fix 6: Fix missing closing tags
  fixed = fixed.replace(/<Text\.(Primary|Secondary|Tertiary|Muted)\s+as="([^"]+)"\s+className="([^"]*?)"([^>]*)>([^<]+)<\/Text\.(Primary|Secondary|Tertiary|Muted)>/g, 
    '<Text.$1 as="$2" className="$3"$4>$5</Text.$1>');
  
  return fixed;
}

// Process a single file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixed = fixMalformedTextComponents(content);
  
  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    return true;
  }
  
  return false;
}

// Main function
function runFix() {
  console.log('🔧 Fixing Malformed Text Components...\n');
  
  const files = getAllFiles(ROOT_DIR);
  let fixedCount = 0;
  
  files.forEach(file => {
    try {
      if (processFile(file)) {
        fixedCount++;
        console.log(`✅ Fixed: ${path.relative(ROOT_DIR, file)}`);
      }
    } catch (error) {
      console.log(`❌ Error fixing ${path.relative(ROOT_DIR, file)}: ${error.message}`);
    }
  });
  
  console.log(`\n🎉 Fixed ${fixedCount} files`);
  return fixedCount;
}

// Run the fix
const fixedCount = runFix();
process.exit(fixedCount > 0 ? 0 : 1);
