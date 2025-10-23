#!/bin/bash
# Migrate hardcoded colors to semantic tokens

echo "🎨 Starting color migration to semantic design system..."

# Text colors migration
echo "📝 Migrating text colors..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's/text-gray-/text-neutral-/g' \
  -e 's/text-slate-/text-neutral-/g' \
  -e 's/\btext-blue-/text-primary-/g' \
  -e 's/\btext-emerald-/text-success-/g' \
  -e 's/\btext-green-/text-success-/g' \
  -e 's/\btext-red-/text-danger-/g' \
  -e 's/\btext-violet-/text-info-/g' \
  -e 's/\btext-purple-/text-info-/g' \
  -e 's/\btext-orange-/text-warning-/g' \
  -e 's/\btext-yellow-/text-warning-/g'

# Background colors migration
echo "🎨 Migrating background colors..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's/bg-gray-/bg-neutral-/g' \
  -e 's/bg-slate-/bg-neutral-/g' \
  -e 's/\bbg-blue-/bg-primary-/g' \
  -e 's/\bbg-emerald-/bg-success-/g' \
  -e 's/\bbg-green-/bg-success-/g' \
  -e 's/\bbg-red-/bg-danger-/g' \
  -e 's/\bbg-violet-/bg-info-/g' \
  -e 's/\bbg-purple-/bg-info-/g' \
  -e 's/\bbg-orange-/bg-warning-/g' \
  -e 's/\bbg-yellow-/bg-warning-/g'

# Border colors migration
echo "🔲 Migrating border colors..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's/border-gray-/border-neutral-/g' \
  -e 's/border-slate-/border-neutral-/g' \
  -e 's/\bborder-blue-/border-primary-/g' \
  -e 's/\bborder-emerald-/border-success-/g' \
  -e 's/\bborder-green-/border-success-/g' \
  -e 's/\bborder-red-/border-danger-/g' \
  -e 's/\bborder-violet-/border-info-/g' \
  -e 's/\bborder-purple-/border-info-/g' \
  -e 's/\bborder-orange-/border-warning-/g' \
  -e 's/\bborder-yellow-/border-warning-/g'

# Ring colors migration
echo "💍 Migrating ring colors..."
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's/ring-gray-/ring-neutral-/g' \
  -e 's/ring-slate-/ring-neutral-/g' \
  -e 's/\bring-blue-/ring-primary-/g' \
  -e 's/\bring-emerald-/ring-success-/g' \
  -e 's/\bring-green-/ring-success-/g' \
  -e 's/\bring-red-/ring-danger-/g' \
  -e 's/\bring-violet-/ring-info-/g' \
  -e 's/\bring-purple-/ring-info-/g' \
  -e 's/\bring-orange-/ring-warning-/g' \
  -e 's/\bring-yellow-/ring-warning-/g'

echo "✅ Color migration complete!"
echo ""
echo "📊 Verifying migration..."

# Check for any remaining hardcoded colors
REMAINING=$(grep -r "text-\(gray\|slate\|blue\|emerald\|violet\)-[0-9]" src/ 2>/dev/null | grep -v "text-neutral-\|text-primary-\|text-success-\|text-info-" | wc -l | tr -d ' ')

if [ "$REMAINING" -eq "0" ]; then
  echo "✅ All text colors migrated successfully!"
else
  echo "⚠️  Found $REMAINING remaining hardcoded text colors"
fi

echo ""
echo "🔍 Checking background colors..."
REMAINING_BG=$(grep -r "bg-\(gray\|slate\|blue\|emerald\|violet\)-[0-9]" src/ 2>/dev/null | grep -v "bg-neutral-\|bg-primary-\|bg-success-\|bg-info-" | wc -l | tr -d ' ')

if [ "$REMAINING_BG" -eq "0" ]; then
  echo "✅ All background colors migrated successfully!"
else
  echo "⚠️  Found $REMAINING_BG remaining hardcoded background colors"
fi

echo ""
echo "🎉 Migration script finished!"

