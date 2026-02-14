#!/bin/bash

# MongoDB Setup Script
# This script helps set up MongoDB using Docker (recommended) or system installation

set -e

echo "=========================================="
echo "MongoDB Setup Script"
echo "=========================================="
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    
    # Check if MongoDB container already exists
    if docker ps -a | grep -q mongodb; then
        echo "📦 MongoDB container already exists"
        
        # Check if it's running
        if docker ps | grep -q mongodb; then
            echo "✅ MongoDB container is already running"
            echo ""
            echo "Connection string: mongodb://localhost:27017/aitourism"
            echo ""
            echo "To stop: docker stop mongodb"
            echo "To start: docker start mongodb"
            echo "To remove: docker rm -f mongodb"
        else
            echo "🔄 Starting existing MongoDB container..."
            docker start mongodb
            sleep 2
            if docker ps | grep -q mongodb; then
                echo "✅ MongoDB container started successfully"
                echo ""
                echo "Connection string: mongodb://localhost:27017/aitourism"
            else
                echo "❌ Failed to start container. Try: docker logs mongodb"
            fi
        fi
    else
        echo "📦 Creating new MongoDB container..."
        docker run -d \
            --name mongodb \
            -p 27017:27017 \
            -v mongodb-data:/data/db \
            mongo:latest
        
        sleep 3
        
        if docker ps | grep -q mongodb; then
            echo "✅ MongoDB container created and started successfully"
            echo ""
            echo "Connection string: mongodb://localhost:27017/aitourism"
            echo ""
            echo "Container will persist data in Docker volume: mongodb-data"
            echo ""
            echo "Useful commands:"
            echo "  Stop:    docker stop mongodb"
            echo "  Start:   docker start mongodb"
            echo "  Remove:  docker rm -f mongodb"
            echo "  Logs:    docker logs mongodb"
        else
            echo "❌ Failed to start MongoDB container"
            echo "Check logs: docker logs mongodb"
            exit 1
        fi
    fi
    
elif command -v mongod &> /dev/null || command -v mongodb &> /dev/null; then
    echo "✅ MongoDB is installed on system"
    echo ""
    echo "To start MongoDB service, try one of these:"
    echo "  sudo systemctl start mongod"
    echo "  sudo systemctl start mongodb"
    echo "  sudo service mongodb start"
    echo ""
    echo "To check status:"
    echo "  sudo systemctl status mongod"
    echo "  sudo systemctl status mongodb"
    
else
    echo "❌ MongoDB is not installed and Docker is not available"
    echo ""
    echo "Installation options:"
    echo ""
    echo "1. Install Docker (recommended):"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sudo sh get-docker.sh"
    echo "   Then run this script again"
    echo ""
    echo "2. Install MongoDB directly:"
    echo "   Ubuntu/Debian:"
    echo "     sudo apt-get update"
    echo "     sudo apt-get install -y mongodb"
    echo ""
    echo "3. Use MongoDB Atlas (cloud - free tier available):"
    echo "   - Sign up at https://www.mongodb.com/cloud/atlas"
    echo "   - Create a free cluster"
    echo "   - Get connection string"
    echo "   - Set MONGODB_URI in .env file"
    exit 1
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="

