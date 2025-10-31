#!/bin/bash
# Vercel deployment post-build script
# Note: Migrations are NOT run during build to avoid database connection issues
# Run migrations separately after deployment using: npx prisma migrate deploy

set -e

echo "✅ Post-build script completed"
echo "ℹ️  Remember to run migrations after deployment if schema changed:"
echo "   npx prisma migrate deploy"

