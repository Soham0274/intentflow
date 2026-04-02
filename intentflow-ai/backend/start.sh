#!/bin/bash

# IntentFlow Backend - Production Startup Script

set -e

echo "🚀 IntentFlow Backend - Production Startup"

# Check required environment variables
required_vars=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SECRET_KEY"
  "GEMINI_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: Missing required environment variable: $var"
    exit 1
  fi
done

echo "✅ Environment variables validated"

# Create logs directory if it doesn't exist
mkdir -p logs

# Run linting in development
if [ "$NODE_ENV" = "development" ]; then
  echo "🔍 Running linting..."
  npm run lint || true
fi

# Start the application
echo "🌐 Starting server..."
exec node src/server.js