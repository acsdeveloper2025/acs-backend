#!/bin/bash

# ACS Web Frontend Docker Startup Script
# This script provides an easy way to start the application in different modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_info "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to start development environment
start_development() {
    print_info "Starting development environment..."
    
    # Check if development port is available
    if ! check_port 5173; then
        print_error "Development port 5173 is in use. Please stop the conflicting service."
        exit 1
    fi
    
    # Build and start development container
    docker-compose -f docker-compose.dev.yml up -d --build
    
    # Wait for service to be ready
    if wait_for_service "http://localhost:5173" "Development Server"; then
        print_success "Development environment started successfully!"
        echo ""
        echo "🚀 Application is running at: http://localhost:5173"
        echo "📝 To view logs: make dev-logs"
        echo "🛑 To stop: make dev-stop"
        echo ""
    else
        print_error "Failed to start development environment"
        docker-compose -f docker-compose.dev.yml logs
        exit 1
    fi
}

# Function to start production environment
start_production() {
    print_info "Starting production environment..."
    
    # Check if production port is available
    if ! check_port 80; then
        print_warning "Port 80 is in use. Trying port 3001..."
        if ! check_port 3001; then
            print_error "Both port 80 and 3001 are in use. Please stop conflicting services."
            exit 1
        fi
        export PORT=3001
    fi
    
    # Build and start production container
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for service to be ready
    local url="http://localhost:${PORT:-80}/health"
    if wait_for_service "$url" "Production Server"; then
        print_success "Production environment started successfully!"
        echo ""
        echo "🚀 Application is running at: http://localhost:${PORT:-80}"
        echo "📊 Health check: $url"
        echo "📝 To view logs: make prod-logs"
        echo "🛑 To stop: make prod-stop"
        echo ""
    else
        print_error "Failed to start production environment"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Function to start with monitoring
start_with_monitoring() {
    print_info "Starting production environment with monitoring..."
    
    # Start production environment
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Start monitoring stack
    docker-compose -f docker-compose.prod.yml --profile monitoring up -d
    
    # Wait for services
    if wait_for_service "http://localhost:80/health" "Production Server" && \
       wait_for_service "http://localhost:3000" "Grafana"; then
        print_success "Production environment with monitoring started!"
        echo ""
        echo "🚀 Application: http://localhost:80"
        echo "📊 Grafana: http://localhost:3000 (admin/admin)"
        echo "📈 Prometheus: http://localhost:9090"
        echo ""
    else
        print_error "Failed to start environment with monitoring"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    print_info "Running tests..."
    
    # Build test environment
    docker-compose --profile testing up -d --build
    
    # Run tests
    if docker-compose run --rm cypress; then
        print_success "All tests passed!"
    else
        print_error "Tests failed"
        exit 1
    fi
    
    # Cleanup
    docker-compose --profile testing down
}

# Function to show status
show_status() {
    print_info "Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep acs-web || echo "No acs-web containers running"
    
    echo ""
    print_info "Images:"
    docker images | grep acs-web || echo "No acs-web images found"
}

# Function to stop all services
stop_all() {
    print_info "Stopping all services..."
    
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml --profile monitoring down 2>/dev/null || true
    docker-compose --profile testing down 2>/dev/null || true
    
    print_success "All services stopped"
}

# Function to show help
show_help() {
    echo "ACS Web Frontend Docker Startup Script"
    echo "======================================"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev         Start development environment with hot reload"
    echo "  prod        Start production environment"
    echo "  monitor     Start production with monitoring (Grafana/Prometheus)"
    echo "  test        Run E2E tests"
    echo "  status      Show container status"
    echo "  stop        Stop all services"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Start development server"
    echo "  $0 prod     # Start production server"
    echo "  $0 monitor  # Start with monitoring"
    echo "  $0 test     # Run tests"
    echo ""
    echo "Quick Access URLs:"
    echo "  Development: http://localhost:5173"
    echo "  Production:  http://localhost:80"
    echo "  Grafana:     http://localhost:3000"
    echo "  Prometheus:  http://localhost:9090"
}

# Main script logic
main() {
    # Check Docker first
    check_docker
    
    case "${1:-help}" in
        dev|development)
            start_development
            ;;
        prod|production)
            start_production
            ;;
        monitor|monitoring)
            start_with_monitoring
            ;;
        test|tests)
            run_tests
            ;;
        status)
            show_status
            ;;
        stop)
            stop_all
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
