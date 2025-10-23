#!/usr/bin/env node

/**
 * Dark Mode Audit Script
 * Scans for hardcoded color classes that need dark: variants
 */

const fs = require('fs');
const path = require('path');

const patterns = {
  bgWhite: /\bbg-white(?!\s+dark:)/g,
  bgNeutral: /\bbg-neutral-(?:50|100)(?!\s+dark:)/g,
  bgGray: /\bbg-gray-(?:50|100)(?!\s+dark:)/g,
  textGray: /\btext-gray-(?:[1-9]\d{2})(?!\s+dark:)/g,
  textNeutral: /\btext-neutral-(?:[1-9]\d{2})(?!\s+dark:)/g,
  textSlate: /\btext-slate-(?:[1-9]\d{2})(?!\s+dark:)/g,
  borderGray: /\bborder-gray-(?:[1-9]\d{2})(?!\s+dark:)/g,
  borderNeutral: /\bborder-neutral-(?:[1-9]\d{2})(?!\s+dark:)/g,
};

const excludeDirs = ['node_modules', '.next', 'dist', 'build'];
const includeExts = ['.tsx', '.ts', '.jsx', '.js'];

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return includeExts.includes(ext);
}

function scanDirectory(dir, results = { files: {}, total: 0 }) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(item) && !item.startsWith('.')) {
        scanDirectory(fullPath, results);
      }
    } else if (stat.isFile() && shouldScanFile(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const violations = scanFile(content, fullPath);

      if (violations.length > 0) {
        results.files[fullPath] = violations;
        results.total += violations.length;
      }
    }
  }

  return results;
}

function scanFile(content, filePath) {
  const violations = [];
  const lines = content.split('\n');

  for (const [patternName, pattern] of Object.entries(patterns)) {
    lines.forEach((line, index) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          violations.push({
            line: index + 1,
            type: patternName,
            match: match,
            context: line.trim().substring(0, 80),
          });
        });
      }
    });
  }

  return violations;
}

function printResults(results) {
  console.log('\n' + '='.repeat(70));
  console.log('  DARK MODE AUDIT REPORT');
  console.log('='.repeat(70) + '\n');

  if (results.total === 0) {
    console.log('✅ No issues found! All color classes have dark: variants.\n');
    return;
  }

  console.log(`❌ Found ${results.total} potential dark mode issues in ${Object.keys(results.files).length} files\n`);

  const sortedFiles = Object.entries(results.files).sort((a, b) => b[1].length - a[1].length);

  sortedFiles.forEach(([file, violations]) => {
    console.log(`\n📄 ${file}`);
    console.log(`   ${violations.length} issue(s):\n`);

    violations.slice(0, 5).forEach((v) => {
      console.log(`   Line ${v.line}: ${v.type}`);
      console.log(`   ${v.context}`);
      console.log(`   → Add: dark:... variant\n`);
    });

    if (violations.length > 5) {
      console.log(`   ... and ${violations.length - 5} more\n`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('  SUMMARY BY TYPE');
  console.log('='.repeat(70) + '\n');

  const typeCount = {};
  Object.values(results.files).forEach((violations) => {
    violations.forEach((v) => {
      typeCount[v.type] = (typeCount[v.type] || 0) + 1;
    });
  });

  Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(20)} ${count}`);
    });

  console.log('\n' + '='.repeat(70) + '\n');
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
console.log(`Scanning ${srcDir}...`);

const results = scanDirectory(srcDir);
printResults(results);

process.exit(results.total > 0 ? 1 : 0);

