#!/bin/bash

# Docker Cleanup Script for CRM Application
# Maintains a clean Docker environment while preserving essential images

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

# Essential images for CRM application
ESSENTIAL_IMAGES=(
    "acs-web:latest"
    "acs-web:dev"
    "redis:7-alpine"
    "mcr.microsoft.com/mssql/server:2022-latest"
)

# Function to show current Docker usage
show_usage() {
    print_info "Current Docker disk usage:"
    docker system df
    echo ""
}

# Function to list essential vs non-essential images
audit_images() {
    print_info "Auditing Docker images..."
    echo ""
    
    print_info "Essential CRM Application Images:"
    for image in "${ESSENTIAL_IMAGES[@]}"; do
        if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "^${image}$"; then
            echo -e "  ${GREEN}✓${NC} $image"
        else
            echo -e "  ${RED}✗${NC} $image (missing)"
        fi
    done
    
    echo ""
    print_info "All current images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
}

# Function to clean up containers
cleanup_containers() {
    print_info "Cleaning up stopped containers..."
    
    # Remove stopped containers
    STOPPED=$(docker container prune -f 2>/dev/null | grep "Total reclaimed space" | cut -d: -f2 || echo "0B")
    if [ "$STOPPED" != "0B" ]; then
        print_success "Removed stopped containers: $STOPPED"
    else
        print_info "No stopped containers to remove"
    fi
}

# Function to clean up images
cleanup_images() {
    print_info "Cleaning up unused images..."
    
    # Get list of all images
    ALL_IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}")
    
    # Check for non-essential images
    NON_ESSENTIAL=()
    while IFS= read -r image; do
        if [[ ! " ${ESSENTIAL_IMAGES[@]} " =~ " ${image} " ]] && [[ "$image" != "<none>:<none>" ]]; then
            NON_ESSENTIAL+=("$image")
        fi
    done <<< "$ALL_IMAGES"
    
    if [ ${#NON_ESSENTIAL[@]} -gt 0 ]; then
        print_warning "Found non-essential images:"
        for image in "${NON_ESSENTIAL[@]}"; do
            echo "  - $image"
        done
        
        read -p "Remove these images? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for image in "${NON_ESSENTIAL[@]}"; do
                docker rmi "$image" 2>/dev/null && print_success "Removed: $image" || print_warning "Could not remove: $image"
            done
        fi
    else
        print_success "No non-essential images found"
    fi
    
    # Remove dangling images
    DANGLING=$(docker image prune -f 2>/dev/null | grep "Total reclaimed space" | cut -d: -f2 || echo "0B")
    if [ "$DANGLING" != "0B" ]; then
        print_success "Removed dangling images: $DANGLING"
    else
        print_info "No dangling images to remove"
    fi
}

# Function to clean up build cache
cleanup_build_cache() {
    print_info "Cleaning up build cache..."
    
    BUILD_CACHE=$(docker builder prune -f 2>/dev/null | tail -1 | cut -d: -f2 || echo "0B")
    if [ "$BUILD_CACHE" != "0B" ]; then
        print_success "Removed build cache: $BUILD_CACHE"
    else
        print_info "No build cache to remove"
    fi
}

# Function to clean up volumes
cleanup_volumes() {
    print_info "Cleaning up unused volumes..."
    
    # List current volumes
    print_info "Current volumes:"
    docker volume ls
    
    # Remove unused volumes (be careful with this)
    read -p "Remove unused volumes? This may delete data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        VOLUMES=$(docker volume prune -f 2>/dev/null | grep "Total reclaimed space" | cut -d: -f2 || echo "0B")
        if [ "$VOLUMES" != "0B" ]; then
            print_success "Removed unused volumes: $VOLUMES"
        else
            print_info "No unused volumes to remove"
        fi
    else
        print_info "Skipping volume cleanup"
    fi
}

# Function to clean up networks
cleanup_networks() {
    print_info "Cleaning up unused networks..."
    
    NETWORKS=$(docker network prune -f 2>/dev/null | grep "Total reclaimed space" | cut -d: -f2 || echo "0B")
    if [ "$NETWORKS" != "0B" ]; then
        print_success "Removed unused networks: $NETWORKS"
    else
        print_info "No unused networks to remove"
    fi
}

# Function to show final status
show_final_status() {
    echo ""
    print_success "Cleanup completed!"
    echo ""
    print_info "Final Docker usage:"
    docker system df
    echo ""
    print_info "Essential images status:"
    for image in "${ESSENTIAL_IMAGES[@]}"; do
        if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "^${image}$"; then
            echo -e "  ${GREEN}✓${NC} $image"
        else
            echo -e "  ${RED}✗${NC} $image (missing - may need to rebuild)"
        fi
    done
}

# Function to show help
show_help() {
    echo "Docker Cleanup Script for CRM Application"
    echo "========================================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  audit       Show current Docker usage and image audit"
    echo "  quick       Quick cleanup (containers, dangling images, build cache)"
    echo "  full        Full cleanup (includes non-essential images and volumes)"
    echo "  containers  Clean up containers only"
    echo "  images      Clean up images only"
    echo "  cache       Clean up build cache only"
    echo "  volumes     Clean up volumes only"
    echo "  networks    Clean up networks only"
    echo "  help        Show this help message"
    echo ""
    echo "Essential images preserved:"
    for image in "${ESSENTIAL_IMAGES[@]}"; do
        echo "  - $image"
    done
}

# Main script logic
main() {
    case "${1:-help}" in
        audit)
            show_usage
            audit_images
            ;;
        quick)
            show_usage
            cleanup_containers
            cleanup_images
            cleanup_build_cache
            cleanup_networks
            show_final_status
            ;;
        full)
            show_usage
            cleanup_containers
            cleanup_images
            cleanup_build_cache
            cleanup_volumes
            cleanup_networks
            show_final_status
            ;;
        containers)
            cleanup_containers
            ;;
        images)
            cleanup_images
            ;;
        cache)
            cleanup_build_cache
            ;;
        volumes)
            cleanup_volumes
            ;;
        networks)
            cleanup_networks
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
