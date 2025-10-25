#!/usr/bin/env node

/**
 * Advanced Automated Refactoring to Unified Components
 * 
 * This script systematically refactors all manual dark mode classes
 * to use unified Text components, achieving 100% perfection.
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

// Check if file already has Text import
function hasTextImport(content) {
  return content.includes("import { Text } from '@/components/ui/text'") ||
         content.includes('from "@/components/ui/text"');
}

// Add Text import to file
function addTextImport(content) {
  // Find the last import statement
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
    // Add at the beginning if no imports found
    return "import { Text } from '@/components/ui/text'\n" + content;
  }
}

// Fix malformed Text components
function fixMalformedTextComponents(content) {
  let fixed = content;
  
  // Fix malformed Text components that have broken dark: classes
  const malformedPatterns = [
    // Fix broken dark: classes
    {
      pattern: /dark:\s*Text\.(Primary|Secondary|Tertiary|Muted)/g,
      replacement: 'dark:text-white/95'
    },
    // Fix incomplete dark: classes
    {
      pattern: /dark:\s*$/g,
      replacement: ''
    },
    // Fix Text components with broken className attributes
    {
      pattern: /className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"/g,
      replacement: (match, before, component, after) => {
        // Clean up the className and use the appropriate Text component
        const cleanBefore = before.replace(/\s+$/, '');
        const cleanAfter = after.replace(/^\s+/, '');
        return `className="${cleanBefore}${cleanAfter}"`;
      }
    }
  ];
  
  malformedPatterns.forEach(({ pattern, replacement }) => {
    fixed = fixed.replace(pattern, replacement);
  });
  
  return fixed;
}

// Advanced refactoring function
function advancedRefactorFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let hasChanges = false;
  let needsTextImport = false;
  
  // First, fix any malformed Text components from previous runs
  const beforeFix = newContent;
  newContent = fixMalformedTextComponents(newContent);
  if (newContent !== beforeFix) {
    hasChanges = true;
  }
  
  // Pattern 1: Replace manual dark mode classes with Text components
  const textPatterns = [
    // Primary text patterns
    {
      pattern: /text-neutral-800\s+dark:text-white\/95/g,
      replacement: 'Text.Primary'
    },
    {
      pattern: /text-neutral-900\s+dark:text-white\/95/g,
      replacement: 'Text.Primary'
    },
    // Secondary text patterns
    {
      pattern: /text-neutral-600\s+dark:text-white\/75/g,
      replacement: 'Text.Secondary'
    },
    {
      pattern: /text-neutral-700\s+dark:text-white\/85/g,
      replacement: 'Text.Secondary'
    },
    // Tertiary text patterns
    {
      pattern: /text-neutral-500\s+dark:text-white\/65/g,
      replacement: 'Text.Tertiary'
    },
    // Muted text patterns
    {
      pattern: /text-neutral-400\s+dark:text-white\/55/g,
      replacement: 'Text.Muted'
    }
  ];
  
  textPatterns.forEach(({ pattern, replacement }) => {
    const matches = newContent.match(pattern);
    if (matches) {
      hasChanges = true;
      needsTextImport = true;
      newContent = newContent.replace(pattern, replacement);
    }
  });
  
  // Pattern 2: Replace HTML elements with Text components
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
    },
    // Replace <th className="...Text.X..."> with <Text.X as="th" className="...">
    {
      pattern: /<th\s+className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"([^>]*)>/g,
      replacement: '<Text.$2 as="th" className="$1$3"$4>'
    },
    // Replace <td className="...Text.X..."> with <Text.X as="td" className="...">
    {
      pattern: /<td\s+className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"([^>]*)>/g,
      replacement: '<Text.$2 as="td" className="$1$3"$4>'
    }
  ];
  
  elementPatterns.forEach(({ pattern, replacement }) => {
    const beforeReplace = newContent;
    newContent = newContent.replace(pattern, replacement);
    if (newContent !== beforeReplace) {
      hasChanges = true;
      needsTextImport = true;
    }
  });
  
  // Pattern 3: Fix className attributes that have Text components mixed with other classes
  const classNamePatterns = [
    // Fix className="...Text.X..." to remove Text components from className
    {
      pattern: /className="([^"]*?)Text\.(Primary|Secondary|Tertiary|Muted)([^"]*?)"/g,
      replacement: (match, before, component, after) => {
        const cleanBefore = before.replace(/\s+$/, '');
        const cleanAfter = after.replace(/^\s+/, '');
        return `className="${cleanBefore}${cleanAfter}"`;
      }
    }
  ];
  
  classNamePatterns.forEach(({ pattern, replacement }) => {
    const beforeReplace = newContent;
    newContent = newContent.replace(pattern, replacement);
    if (newContent !== beforeReplace) {
      hasChanges = true;
    }
  });
  
  // Add Text import if needed
  if (needsTextImport && !hasTextImport(newContent)) {
    newContent = addTextImport(newContent);
  }
  
  // Write the file if changes were made
  if (hasChanges) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  
  return false;
}

// Process files in batches
function processBatch(files, batchNumber, totalBatches) {
  console.log(`\n🔄 Processing Batch ${batchNumber}/${totalBatches} (${files.length} files)...`);
  
  let changedFiles = 0;
  
  files.forEach((file, index) => {
    try {
      const wasChanged = advancedRefactorFile(file);
      if (wasChanged) {
        changedFiles++;
        console.log(`   ✅ ${path.relative(ROOT_DIR, file)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error processing ${path.relative(ROOT_DIR, file)}: ${error.message}`);
    }
  });
  
  console.log(`   📊 Changed ${changedFiles}/${files.length} files in this batch`);
  return changedFiles;
}

// Main refactoring function
function runAdvancedRefactoring() {
  console.log('🚀 Starting Advanced Automated Refactoring to Unified Components...\n');
  
  const allFiles = getAllFiles(ROOT_DIR);
  console.log(`📁 Found ${allFiles.length} files to process`);
  
  // Process files in batches of 15
  const batchSize = 15;
  const batches = [];
  for (let i = 0; i < allFiles.length; i += batchSize) {
    batches.push(allFiles.slice(i, i + batchSize));
  }
  
  console.log(`📦 Processing in ${batches.length} batches of ${batchSize} files each\n`);
  
  let totalChanged = 0;
  
  // Process each batch
  batches.forEach((batch, index) => {
    const changedInBatch = processBatch(batch, index + 1, batches.length);
    totalChanged += changedInBatch;
  });
  
  console.log(`\n🎉 Advanced Automated Refactoring Complete!`);
  console.log(`   📊 Total files changed: ${totalChanged}/${allFiles.length}`);
  console.log(`   📈 Success rate: ${((totalChanged / allFiles.length) * 100).toFixed(1)}%`);
  
  return totalChanged;
}

// Run the advanced automated refactoring
const totalChanged = runAdvancedRefactoring();
process.exit(totalChanged > 0 ? 0 : 1);
