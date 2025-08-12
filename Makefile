# Makefile for CRM Application Docker Management

.PHONY: help check dev prod build start stop restart logs clean status backup

# Default target
help: ## Show this help message
	@echo "CRM Application Docker Management"
	@echo "================================="
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Environment variables
DEV_COMPOSE = docker-compose -f docker-compose.development.yml
PROD_COMPOSE = docker-compose -f docker-compose.production.yml
FULL_COMPOSE = docker-compose -f docker-compose.full-stack.yml

# Check system requirements
check: ## Check Docker installation and system requirements
	@./scripts/docker-setup.sh check

# Development environment
dev-setup: ## Setup development environment
	@./scripts/docker-setup.sh dev

dev-start: ## Start development environment
	$(DEV_COMPOSE) up -d
	@echo "Development environment started!"
	@echo "Web Frontend: http://localhost:3001"
	@echo "Mobile App: http://localhost:5173"
	@echo "Backend API: http://localhost:3000"
	@echo "Database Admin: http://localhost:8080"
	@echo "Redis Admin: http://localhost:8081"

dev-stop: ## Stop development environment
	$(DEV_COMPOSE) down

dev-restart: ## Restart development environment
	$(DEV_COMPOSE) restart

dev-logs: ## View development logs
	$(DEV_COMPOSE) logs -f

dev-build: ## Build development images
	$(DEV_COMPOSE) build

dev-clean: ## Clean development environment
	$(DEV_COMPOSE) down -v
	docker image prune -f

# Production environment
prod-setup: ## Setup production environment
	@./scripts/docker-setup.sh prod

prod-start: ## Start production environment
	$(PROD_COMPOSE) up -d
	@echo "Production environment started!"
	@echo "Check status with: make prod-status"

prod-stop: ## Stop production environment
	$(PROD_COMPOSE) down

prod-restart: ## Restart production environment
	$(PROD_COMPOSE) restart

prod-logs: ## View production logs
	$(PROD_COMPOSE) logs -f

prod-build: ## Build production images
	$(PROD_COMPOSE) build

prod-status: ## Show production status
	$(PROD_COMPOSE) ps

prod-scale-backend: ## Scale backend services (usage: make prod-scale-backend REPLICAS=3)
	$(PROD_COMPOSE) up -d --scale backend=$(or $(REPLICAS),2)

prod-scale-frontend: ## Scale frontend services (usage: make prod-scale-frontend REPLICAS=2)
	$(PROD_COMPOSE) up -d --scale web-frontend=$(or $(REPLICAS),2) --scale mobile-app=$(or $(REPLICAS),2)

# Full stack environment
full-start: ## Start full stack environment
	$(FULL_COMPOSE) up -d

full-stop: ## Stop full stack environment
	$(FULL_COMPOSE) down

full-logs: ## View full stack logs
	$(FULL_COMPOSE) logs -f

# Database operations
db-backup: ## Backup database
	$(PROD_COMPOSE) exec sqlserver sqlcmd -S localhost -U sa -P "$$(cat secrets/db_password.txt)" -Q "BACKUP DATABASE acs_backend TO DISK='/var/backups/acs_backend_$$(date +%Y%m%d_%H%M%S).bak'"

db-restore: ## Restore database (usage: make db-restore BACKUP_FILE=filename.bak)
	$(PROD_COMPOSE) exec sqlserver sqlcmd -S localhost -U sa -P "$$(cat secrets/db_password.txt)" -Q "RESTORE DATABASE acs_backend FROM DISK='/var/backups/$(BACKUP_FILE)'"

# Utility commands
logs: ## View logs for specific service (usage: make logs SERVICE=backend)
	@if [ -z "$(SERVICE)" ]; then \
		echo "Please specify SERVICE. Example: make logs SERVICE=backend"; \
	else \
		$(DEV_COMPOSE) logs -f $(SERVICE); \
	fi

shell: ## Access shell for specific service (usage: make shell SERVICE=backend)
	@if [ -z "$(SERVICE)" ]; then \
		echo "Please specify SERVICE. Example: make shell SERVICE=backend"; \
	else \
		$(DEV_COMPOSE) exec $(SERVICE) sh; \
	fi

status: ## Show status of all containers
	@echo "Development Environment:"
	@$(DEV_COMPOSE) ps 2>/dev/null || echo "Not running"
	@echo ""
	@echo "Production Environment:"
	@$(PROD_COMPOSE) ps 2>/dev/null || echo "Not running"

clean: ## Clean up all Docker resources
	@./scripts/docker-setup.sh cleanup

secrets: ## Generate production secrets
	@./scripts/docker-setup.sh secrets

# Testing
test-backend: ## Run backend tests
	$(DEV_COMPOSE) exec backend-dev npm test

test-frontend: ## Run frontend tests
	$(DEV_COMPOSE) exec web-frontend-dev npm test

test-mobile: ## Run mobile app tests
	$(DEV_COMPOSE) exec mobile-app-dev npm test

test-all: ## Run all tests
	@echo "Running backend tests..."
	@$(DEV_COMPOSE) exec backend-dev npm test
	@echo "Running frontend tests..."
	@$(DEV_COMPOSE) exec web-frontend-dev npm test
	@echo "Running mobile tests..."
	@$(DEV_COMPOSE) exec mobile-app-dev npm test

# Monitoring
monitor: ## Open monitoring dashboards
	@echo "Opening monitoring dashboards..."
	@echo "Grafana: http://localhost:3002 (admin/$(shell cat secrets/grafana_password.txt 2>/dev/null || echo 'check secrets/grafana_password.txt'))"
	@echo "Prometheus: http://localhost:9090"

# Backup and restore
backup: ## Create full backup
	@echo "Creating backup..."
	@mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	@$(PROD_COMPOSE) exec sqlserver sqlcmd -S localhost -U sa -P "$$(cat secrets/db_password.txt)" -Q "BACKUP DATABASE acs_backend TO DISK='/var/backups/acs_backend_$$(date +%Y%m%d_%H%M%S).bak'"
	@docker run --rm -v crm_uploads_prod_data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/uploads_$$(date +%Y%m%d_%H%M%S).tar.gz /data
	@echo "Backup completed in backups/ directory"

# Quick commands for common tasks
quick-dev: dev-setup dev-start ## Quick setup and start development environment

quick-prod: prod-setup prod-start ## Quick setup and start production environment

quick-test: dev-start test-all ## Quick start dev environment and run all tests

# Health checks
health: ## Check health of all services
	@echo "Checking service health..."
	@docker ps --format "table {{.Names}}\t{{.Status}}" | grep crm

# Update images
update: ## Update all Docker images
	@echo "Updating Docker images..."
	@$(DEV_COMPOSE) pull
	@$(PROD_COMPOSE) pull
	@echo "Images updated. Restart services to use new images."

# Development helpers
dev-reset: ## Reset development environment (clean and restart)
	$(DEV_COMPOSE) down -v
	docker image prune -f
	$(DEV_COMPOSE) up -d --build

# Production helpers
prod-deploy: ## Deploy to production (build and start)
	$(PROD_COMPOSE) build
	$(PROD_COMPOSE) up -d

# Documentation
docs: ## Open documentation
	@echo "Documentation available at:"
	@echo "- Main README: ./DOCKER_README.md"
	@echo "- Backend: ./acs-backend/README.md"
	@echo "- Web Frontend: ./acs-web/DOCKER.md"
	@echo "- Mobile App: ./caseflow-mobile/DOCKER.md"

# Docker cleanup commands
docker-audit: ## Audit Docker images and usage
	@./scripts/docker-cleanup.sh audit

docker-clean: ## Quick Docker cleanup (containers, dangling images, cache)
	@./scripts/docker-cleanup.sh quick

docker-clean-full: ## Full Docker cleanup (includes non-essential images)
	@./scripts/docker-cleanup.sh full

docker-clean-images: ## Clean up Docker images only
	@./scripts/docker-cleanup.sh images

docker-clean-cache: ## Clean up Docker build cache
	@./scripts/docker-cleanup.sh cache
