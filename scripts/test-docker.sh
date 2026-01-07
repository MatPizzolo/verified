#!/bin/bash

# Docker Services Test Script
# Tests that all services start correctly and are healthy

echo "🐳 Testing Docker services..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Stop any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down > /dev/null 2>&1
echo "✓ Cleanup complete"
echo ""

# Build and start services
echo "🔨 Building and starting services..."
echo "   This may take 2-3 minutes on first run..."
echo ""

docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services"
    exit 1
fi

echo ""
echo "⏳ Waiting for services to be healthy (30 seconds)..."
sleep 30

# Check service health
echo ""
echo "🔍 Checking service health..."
echo ""

# Test frontend
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Frontend is healthy (port 3000)"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Test backend
if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy (port 4000)"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Test nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✓ Nginx is healthy (port 80)"
else
    echo "❌ Nginx health check failed"
    docker-compose logs nginx
    exit 1
fi

echo ""
echo "✅ All services are running and healthy!"
echo ""
echo "Access points:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:4000"
echo "  - Nginx:    http://localhost"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"
echo ""
