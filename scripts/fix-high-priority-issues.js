#!/usr/bin/env node

/**
 * Fix High Priority Issues
 * 
 * This script fixes HIGH priority issues by replacing manual dark mode classes
 * and hardcoded backgrounds with unified components.
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

// Check if file already has Text import
function hasTextImport(content) {
  return content.includes("import { Text } from '@/components/ui/text'") ||
         content.includes('from "@/components/ui/text"');
}

// Check if file already has Container import
function hasContainerImport(content) {
  return content.includes("import { Container } from '@/components/ui/container'") ||
         content.includes('from "@/components/ui/container"');
}

// Add Text import to file
function addTextImport(content) {
  const importLines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex !== -1) {
    importLines.splice(lastImportIndex + 1, 0, "import { Text } from '@/components/ui/text'");
    return importLines.join('\n');
  } else {
    return "import { Text } from '@/components/ui/text'\n" + content;
  }
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

// Fix high priority issues in a file
function fixHighPriorityIssues(content) {
  let fixed = content;
  let hasChanges = false;
  let needsTextImport = false;
  let needsContainerImport = false;
  
  // Fix 1: Replace manual dark mode classes with Text components
  const textPatterns = [
    // Replace manual dark mode classes with Text components
    {
      pattern: /text-neutral-800\s+dark:text-white\/95/g,
      replacement: 'Text.Primary'
    },
    {
      pattern: /text-neutral-900\s+dark:text-white\/95/g,
      replacement: 'Text.Primary'
    },
    {
      pattern: /text-neutral-600\s+dark:text-white\/75/g,
      replacement: 'Text.Secondary'
    },
    {
      pattern: /text-neutral-700\s+dark:text-white\/85/g,
      replacement: 'Text.Secondary'
    },
    {
      pattern: /text-neutral-500\s+dark:text-white\/65/g,
      replacement: 'Text.Tertiary'
    },
    {
      pattern: /text-neutral-400\s+dark:text-white\/55/g,
      replacement: 'Text.Muted'
    }
  ];
  
  textPatterns.forEach(({ pattern, replacement }) => {
    const matches = fixed.match(pattern);
    if (matches) {
      hasChanges = true;
      needsTextImport = true;
      fixed = fixed.replace(pattern, replacement);
    }
  });
  
  // Fix 2: Replace hardcoded white backgrounds with Container components
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
  
  // Fix 3: Replace HTML elements with Text components
  const elementPatterns = [
    // Replace <h1 className="...Text.Primary..."> with <Text.Primary as="h1" className="...">
    {
      pattern: /<h([1-6])\s+className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"([^>]*)>/g,
      replacement: '<Text.$3 as="h$1" className="$2$4"$5>'
    },
    // Replace <p className="...Text.X..."> with <Text.X as="p" className="...">
    {
      pattern: /<p\s+className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"([^>]*)>/g,
      replacement: '<Text.$2 as="p" className="$1$3"$4>'
    },
    // Replace <span className="...Text.X..."> with <Text.X as="span" className="...">
    {
      pattern: /<span\s+className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"([^>]*)>/g,
      replacement: '<Text.$2 as="span" className="$1$3"$4>'
    },
    // Replace <div className="...Text.X..."> with <Text.X as="div" className="...">
    {
      pattern: /<div\s+className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"([^>]*)>/g,
      replacement: '<Text.$2 as="div" className="$1$3"$4>'
    },
    // Replace <label className="...Text.X..."> with <Text.X as="label" className="...">
    {
      pattern: /<label\s+className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"([^>]*)>/g,
      replacement: '<Text.$2 as="label" className="$1$3"$4>'
    }
  ];
  
  elementPatterns.forEach(({ pattern, replacement }) => {
    const beforeReplace = fixed;
    fixed = fixed.replace(pattern, replacement);
    if (fixed !== beforeReplace) {
      hasChanges = true;
      needsTextImport = true;
    }
  });
  
  // Fix 4: Replace hardcoded backgrounds with Container components
  const containerPatterns = [
    // Replace hardcoded white backgrounds with Container components
    {
      pattern: /<div\s+className="([^"]*?)bg-white\s+dark:bg-elevation-[0-9]([^"]*?)"([^>]*)>/g,
      replacement: '<Container.Page className="$1$2"$3>'
    },
    {
      pattern: /<section\s+className="([^"]*?)bg-white\s+dark:bg-elevation-[0-9]([^"]*?)"([^>]*)>/g,
      replacement: '<Container.Section className="$1$2"$3>'
    }
  ];
  
  containerPatterns.forEach(({ pattern, replacement }) => {
    const beforeReplace = fixed;
    fixed = fixed.replace(pattern, replacement);
    if (fixed !== beforeReplace) {
      hasChanges = true;
      needsContainerImport = true;
    }
  });
  
  // Add imports if needed
  if (needsTextImport && !hasTextImport(fixed)) {
    fixed = addTextImport(fixed);
  }
  
  if (needsContainerImport && !hasContainerImport(fixed)) {
    fixed = addContainerImport(fixed);
  }
  
  return { content: fixed, hasChanges };
}

// Process a single file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { content: fixed, hasChanges } = fixHighPriorityIssues(content);
  
  if (hasChanges) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    return true;
  }
  
  return false;
}

// Main function
function runFix() {
  console.log('🔧 Fixing High Priority Issues...\n');
  
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
