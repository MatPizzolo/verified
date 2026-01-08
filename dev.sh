#!/bin/bash

# Development script for Verified AR
# Usage: ./dev.sh [up|down|logs|clean]

set -e

case "${1:-up}" in
  up)
    echo "🚀 Starting development environment..."
    
    # Clean up any existing containers
    docker compose down --remove-orphans
    
    # Build and start with hot reload
    echo "📦 Building containers..."
    docker compose up --build -d
    
    echo "✅ Development environment started!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend: http://localhost:4000"
    echo "📊 Logs: ./dev.sh logs"
    echo "🛑 Stop: ./dev.sh down"
    ;;
    
  down)
    echo "🛑 Stopping development environment..."
    docker compose down --remove-orphans
    echo "✅ Stopped!"
    ;;
    
  logs)
    echo "📊 Showing logs..."
    docker compose logs -f
    ;;
    
  clean)
    echo "🧹 Cleaning up..."
    docker compose down --remove-orphans -v
    docker system prune -f
    echo "✅ Cleaned!"
    ;;
    
  *)
    echo "Usage: $0 [up|down|logs|clean]"
    echo ""
    echo "Commands:"
    echo "  up     - Start development environment (default)"
    echo "  down   - Stop development environment"
    echo "  logs   - Show logs"
    echo "  clean  - Clean up containers and volumes"
    exit 1
    ;;
esac
