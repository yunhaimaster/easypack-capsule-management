#!/usr/bin/env node

/**
 * Fix Hardcoded Backgrounds
 * 
 * This script fixes all hardcoded white backgrounds by replacing them
 * with Container components.
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

// Check if file already has Container import
function hasContainerImport(content) {
  return content.includes("import { Container } from '@/components/ui/container'") ||
         content.includes('from "@/components/ui/container"');
}

// Add Container import to file
function addContainerImport(content) {
  const importLines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex !== -1) {
    importLines.splice(lastImportIndex + 1, 0, "import { Container } from '@/components/ui/container'");
    return importLines.join('\n');
  } else {
    return "import { Container } from '@/components/ui/container'\n" + content;
  }
}

// Fix hardcoded backgrounds
function fixHardcodedBackgrounds(content) {
  let fixed = content;
  let hasChanges = false;
  let needsContainerImport = false;
  
  // Fix 1: Replace hardcoded white backgrounds with Container components
  const backgroundPatterns = [
    // Replace hardcoded white backgrounds
    {
      pattern: /bg-white\s+dark:bg-elevation-[0-9]/g,
      replacement: 'Container.Page'
    },
    {
      pattern: /bg-white\s+dark:bg-elevation-0/g,
      replacement: 'Container.Page'
    },
    {
      pattern: /bg-white\s+dark:bg-elevation-1/g,
      replacement: 'Container.Section'
    },
    {
      pattern: /bg-white\s+dark:bg-elevation-2/g,
      replacement: 'Container.Content'
    }
  ];
  
  backgroundPatterns.forEach(({ pattern, replacement }) => {
    const matches = fixed.match(pattern);
    if (matches) {
      hasChanges = true;
      needsContainerImport = true;
      fixed = fixed.replace(pattern, replacement);
    }
  });
  
  // Fix 2: Replace HTML elements with Container components
  const elementPatterns = [
    // Replace <div className="...Container.Page..."> with <Container.Page className="...">
    {
      pattern: /<div\s+className="([^"]*?)Container\.(Page|Section|Content)([^"]*?)"([^>]*)>/g,
      replacement: '<Container.$2 className="$1$3"$4>'
    },
    // Replace <section className="...Container.Section..."> with <Container.Section className="...">
    {
      pattern: /<section\s+className="([^"]*?)Container\.(Page|Section|Content)([^"]*?)"([^>]*)>/g,
      replacement: '<Container.$2 className="$1$3"$4>'
    }
  ];
  
  elementPatterns.forEach(({ pattern, replacement }) => {
    const beforeReplace = fixed;
    fixed = fixed.replace(pattern, replacement);
    if (fixed !== beforeReplace) {
      hasChanges = true;
      needsContainerImport = true;
    }
  });
  
  // Add imports if needed
  if (needsContainerImport && !hasContainerImport(fixed)) {
    fixed = addContainerImport(fixed);
  }
  
  return { content: fixed, hasChanges };
}

// Process a single file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { content: fixed, hasChanges } = fixHardcodedBackgrounds(content);
  
  if (hasChanges) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    return true;
  }
  
  return false;
}

// Main function
function runFix() {
  console.log('🔧 Fixing Hardcoded Backgrounds...\n');
  
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
