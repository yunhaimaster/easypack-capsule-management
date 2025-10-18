#!/bin/bash
# Vercel 部署後自動執行數據庫遷移

set -e

echo "🔄 Running database migrations..."

if [ -n "$POSTGRES_PRISMA_URL" ] || [ -n "$DATABASE_URL" ]; then
  # 使用 POSTGRES_PRISMA_URL 或 DATABASE_URL
  export DATABASE_URL="${DATABASE_URL:-$POSTGRES_PRISMA_URL}"
  
  echo "✅ Database URL found, running migrations..."
  npx prisma migrate deploy
  
  echo "✅ Migrations completed successfully!"
else
  echo "⚠️  No database URL found, skipping migrations"
  echo "   This is expected during build time"
fi

