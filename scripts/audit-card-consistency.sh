#!/bin/bash

# Card Consistency Audit Script
# Detects hardcoded card styles that should use the unified design system

echo "🔍 Auditing card consistency..."
echo ""

# Count violations
violations=0

# Check for hardcoded bg-white with backdrop-blur (excluding allowed patterns)
echo "Checking for hardcoded glass effects..."
bg_violations=$(grep -r "bg-white/[0-9].*backdrop-blur" src/ --include="*.tsx" --include="*.ts" | \
  grep -v "liquid-glass" | \
  grep -v "node_modules" | \
  grep -v "globals.css" | \
  wc -l)

violations=$((violations + bg_violations))

if [ $bg_violations -gt 0 ]; then
  echo "❌ Found $bg_violations hardcoded glass effects:"
  grep -r "bg-white/[0-9].*backdrop-blur" src/ --include="*.tsx" --include="*.ts" | \
    grep -v "liquid-glass" | \
    grep -v "node_modules" | \
    grep -v "globals.css"
  echo ""
fi

# Check for hardcoded rounded corners with borders (card-like patterns)
echo "Checking for hardcoded card styles..."
card_violations=$(grep -r "rounded-[0-9]*xl.*border.*bg-white" src/ --include="*.tsx" | \
  grep -v "liquid-glass" | \
  grep -v "Card variant" | \
  wc -l)

violations=$((violations + card_violations))

if [ $card_violations -gt 0 ]; then
  echo "❌ Found $card_violations hardcoded card styles:"
  grep -r "rounded-[0-9]*xl.*border.*bg-white" src/ --include="*.tsx" | \
    grep -v "liquid-glass" | \
    grep -v "Card variant"
  echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $violations -eq 0 ]; then
  echo "✅ All cards use the unified design system"
  echo "   No violations found!"
  exit 0
else
  echo "❌ Found $violations total violations"
  echo ""
  echo "📖 Fix guide:"
  echo "   1. Replace hardcoded styles with Card component"
  echo "   2. Use appropriate variant: glass, modal, dropdown, toast, tooltip, table"
  echo "   3. Add dark mode support with semantic colors"
  echo ""
  echo "   Example:"
  echo "   ❌ <div className=\"bg-white/90 backdrop-blur rounded-xl\">"
  echo "   ✅ <Card variant=\"glass\">"
  exit 1
fi
