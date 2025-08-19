#!/bin/bash

# Kloud-scaler LMS Deployment Script
set -e

echo "🚀 Starting Kloud-scaler LMS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Dependencies check passed ✓"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f ".env.prod" ]; then
        print_warning ".env.prod not found. Creating from template..."
        cp .env.prod.example .env.prod
        print_warning "Please edit .env.prod with your actual configuration before continuing."
        read -p "Press Enter after editing .env.prod..."
    fi
    
    # Load environment variables
    export $(grep -v '^#' .env.prod | xargs)
    
    print_status "Environment setup complete ✓"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p nginx/ssl
    mkdir -p backend/uploads/{thumbnails,blog-thumbnails,course-thumbnails}
    
    print_status "Directories created ✓"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop existing services
    docker-compose -f docker-compose.prod.yml down
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml up -d --build
    
    print_status "Services deployed ✓"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for backend
    echo "Waiting for backend..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost/api/health &> /dev/null; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Backend failed to start within 60 seconds"
        exit 1
    fi
    
    print_status "All services are ready ✓"
}

# Seed database
seed_database() {
    print_status "Seeding database..."
    
    # Run seed script inside backend container
    docker-compose -f docker-compose.prod.yml exec -T backend npm run seed
    
    print_status "Database seeded ✓"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    print_status "🎉 Deployment completed successfully!"
    echo ""
    print_status "Access your application:"
    echo "  Frontend: http://localhost (or your configured domain)"
    echo "  Backend API: http://localhost/api"
    echo "  Health Check: http://localhost/health"
    echo ""
    print_status "Default login credentials:"
    echo "  Admin: admin@example.com / password123"
    echo "  User: john@example.com / password123"
    echo ""
    print_warning "Remember to:"
    echo "  1. Change default passwords"
    echo "  2. Configure SSL certificates for production"
    echo "  3. Set up proper backup procedures"
    echo "  4. Configure monitoring and logging"
}

# Main deployment flow
main() {
    echo "🔧 Kloud-scaler LMS Production Deployment"
    echo "========================================"
    
    check_dependencies
    setup_environment
    create_directories
    deploy_services
    wait_for_services
    
    # Ask if user wants to seed database
    read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        seed_database
    fi
    
    show_status
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping services..."
        docker-compose -f docker-compose.prod.yml down
        print_status "Services stopped ✓"
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose -f docker-compose.prod.yml restart
        print_status "Services restarted ✓"
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "status")
        docker-compose -f docker-compose.prod.yml ps
        ;;
    *)
        main
        ;;
esac