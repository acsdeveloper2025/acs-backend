#!/bin/bash

# Docker Setup Script for CRM Application
# This script helps set up the Docker environment for development or production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed and running"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check available memory
    if command_exists free; then
        MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$MEMORY_GB" -lt 8 ]; then
            print_warning "System has less than 8GB RAM. Performance may be affected."
        else
            print_success "Memory requirement met (${MEMORY_GB}GB available)"
        fi
    fi
    
    # Check available disk space
    if command_exists df; then
        DISK_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
        if [ "$DISK_GB" -lt 20 ]; then
            print_warning "Less than 20GB disk space available. Consider freeing up space."
        else
            print_success "Disk space requirement met (${DISK_GB}GB available)"
        fi
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p secrets
    mkdir -p backups
    mkdir -p logs
    mkdir -p uploads
    mkdir -p nginx/ssl
    mkdir -p monitoring
    mkdir -p elk
    
    print_success "Directories created"
}

# Function to generate secrets for production
generate_secrets() {
    print_status "Generating secrets for production..."
    
    if [ ! -f secrets/db_password.txt ]; then
        openssl rand -base64 32 > secrets/db_password.txt
        print_success "Database password generated"
    fi
    
    if [ ! -f secrets/jwt_secret.txt ]; then
        openssl rand -base64 64 > secrets/jwt_secret.txt
        print_success "JWT secret generated"
    fi
    
    if [ ! -f secrets/jwt_refresh_secret.txt ]; then
        openssl rand -base64 64 > secrets/jwt_refresh_secret.txt
        print_success "JWT refresh secret generated"
    fi
    
    if [ ! -f secrets/elastic_password.txt ]; then
        openssl rand -base64 32 > secrets/elastic_password.txt
        print_success "Elasticsearch password generated"
    fi
    
    if [ ! -f secrets/grafana_password.txt ]; then
        openssl rand -base64 32 > secrets/grafana_password.txt
        print_success "Grafana password generated"
    fi
    
    # Generate database URL
    if [ ! -f secrets/database_url.txt ]; then
        DB_PASSWORD=$(cat secrets/db_password.txt)
        echo "sqlserver://sqlserver:1433;database=acs_backend;user=sa;password=${DB_PASSWORD};trustServerCertificate=true" > secrets/database_url.txt
        print_success "Database URL generated"
    fi
    
    print_warning "Secrets generated in ./secrets/ directory. Keep these secure!"
}

# Function to setup development environment
setup_development() {
    print_status "Setting up development environment..."
    
    # Pull required images
    docker-compose -f docker-compose.development.yml pull
    
    # Build custom images
    docker-compose -f docker-compose.development.yml build
    
    print_success "Development environment setup complete"
    print_status "To start: docker-compose -f docker-compose.development.yml up -d"
}

# Function to setup production environment
setup_production() {
    print_status "Setting up production environment..."
    
    # Generate secrets
    generate_secrets
    
    # Pull required images
    docker-compose -f docker-compose.production.yml pull
    
    # Build custom images
    docker-compose -f docker-compose.production.yml build
    
    print_success "Production environment setup complete"
    print_status "To start: docker-compose -f docker-compose.production.yml up -d"
}

# Function to clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop all containers
    docker-compose -f docker-compose.development.yml down 2>/dev/null || true
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    docker-compose -f docker-compose.full-stack.yml down 2>/dev/null || true
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    read -p "Remove unused volumes? This will delete data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
        print_success "Volumes cleaned up"
    fi
    
    # Remove unused networks
    docker network prune -f
    
    print_success "Docker cleanup complete"
}

# Function to show status
show_status() {
    print_status "Docker containers status:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo
    print_status "Docker images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    echo
    print_status "Docker volumes:"
    docker volume ls
}

# Function to show help
show_help() {
    echo "Docker Setup Script for CRM Application"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  check       Check system requirements and Docker installation"
    echo "  dev         Setup development environment"
    echo "  prod        Setup production environment"
    echo "  secrets     Generate production secrets"
    echo "  cleanup     Clean up Docker resources"
    echo "  status      Show Docker status"
    echo "  help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0 check       # Check requirements"
    echo "  $0 dev         # Setup for development"
    echo "  $0 prod        # Setup for production"
    echo "  $0 cleanup     # Clean up resources"
}

# Main script logic
main() {
    case "${1:-help}" in
        check)
            check_docker
            check_requirements
            ;;
        dev)
            check_docker
            create_directories
            setup_development
            ;;
        prod)
            check_docker
            check_requirements
            create_directories
            setup_production
            ;;
        secrets)
            create_directories
            generate_secrets
            ;;
        cleanup)
            cleanup
            ;;
        status)
            show_status
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
