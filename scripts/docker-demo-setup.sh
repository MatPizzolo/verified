#!/bin/bash

# Docker Demo Setup Script
# Runs seed scripts from within Docker environment

set -e

echo "🐳 Running enhanced demo setup from Docker..."
echo ""

# Environment variables are already loaded via docker-compose env_file

echo "📦 Step 1: Seeding products..."
node /app/root-scripts/demo/seed-products.js

echo ""
echo "🎯 Step 2: Seeding enhanced demo data (3 featured users)..."
npx tsx /app/root-scripts/demo/seed-enhanced-demo.ts

echo ""
echo "✅ Enhanced demo setup complete!"
echo ""
echo "🚀 Visit http://localhost:3000 to see your marketplace"
