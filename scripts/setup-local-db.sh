#!/bin/bash

# Setup Local Build Environment (No Database Required)
# This script prepares your environment for local builds without PostgreSQL

set -e

echo "🔧 Setting up local build environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "Creating .env.local with mock credentials..."
    
    cat > .env.local << 'EOF'
# Local Development Environment Variables
# This file is for LOCAL BUILDS ONLY - not committed to git

# Mock PostgreSQL URL for Prisma schema validation
# This won't be used during "npm run build:local" because we skip migrations
# It just needs to pass schema validation
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Twilio Configuration (Mock values for build - won't actually work)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# JWT Session Secret (Random string for local)
SESSION_SECRET="local-dev-secret-change-in-production"

# Admin Bootstrap (Mock values)
ADMIN_BOOTSTRAP_PHONE="+85200000000"
ADMIN_BOOTSTRAP_CODE="0000"

# OpenRouter API Key (Required for AI features - add your real key if testing AI)
OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# NOTE: 
# - For local builds, use: npm run build:local (skips database migrations)
# - For actual local testing with real database, you need PostgreSQL installed
# - For just building the project, these mock values are sufficient
EOF
    echo "✅ Created .env.local"
fi

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "✅ Setup complete!"
echo ""
echo "You can now run:"
echo "  npm run build:local - Build project (NO database required)"
echo "  npm run dev         - Start development server"
echo ""
echo "⚠️  Note: This is for LOCAL BUILDS ONLY"
echo "   Production uses PostgreSQL on Vercel and runs 'npm run build'"
echo ""
echo "📍 Mock credentials created in .env.local (gitignored)"

