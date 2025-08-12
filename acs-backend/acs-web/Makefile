# Makefile for ACS Web Frontend Docker Management

.PHONY: help build dev prod test clean logs shell health

# Default target
help: ## Show this help message
	@echo "ACS Web Frontend Docker Management"
	@echo "=================================="
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Environment variables
DEV_COMPOSE = docker-compose -f docker-compose.dev.yml
PROD_COMPOSE = docker-compose -f docker-compose.prod.yml
DEFAULT_COMPOSE = docker-compose

# Build commands
build: ## Build production image
	docker build --target production -t acs-web:latest .

build-dev: ## Build development image
	docker build --target development -t acs-web:dev .

build-all: ## Build all images
	docker build --target development -t acs-web:dev .
	docker build --target production -t acs-web:latest .

# Development commands
dev: ## Start development environment
	$(DEV_COMPOSE) up -d
	@echo "Development server started at http://localhost:5173"

dev-build: ## Build and start development environment
	$(DEV_COMPOSE) up -d --build

dev-logs: ## View development logs
	$(DEV_COMPOSE) logs -f acs-web-dev

dev-stop: ## Stop development environment
	$(DEV_COMPOSE) down

dev-restart: ## Restart development environment
	$(DEV_COMPOSE) restart

dev-shell: ## Access development container shell
	$(DEV_COMPOSE) exec acs-web-dev sh

# Production commands
prod: ## Start production environment
	$(PROD_COMPOSE) up -d
	@echo "Production server started"

prod-build: ## Build and start production environment
	$(PROD_COMPOSE) up -d --build

prod-logs: ## View production logs
	$(PROD_COMPOSE) logs -f

prod-stop: ## Stop production environment
	$(PROD_COMPOSE) down

prod-restart: ## Restart production environment
	$(PROD_COMPOSE) restart

prod-scale: ## Scale production services (usage: make prod-scale REPLICAS=3)
	$(PROD_COMPOSE) up -d --scale acs-web=$(or $(REPLICAS),2)

# Testing commands
test: ## Run tests in container
	docker run --rm -v $(PWD):/app -w /app acs-web:dev npm test

test-e2e: ## Run E2E tests
	$(DEFAULT_COMPOSE) --profile testing up -d
	$(DEFAULT_COMPOSE) run --rm cypress
	$(DEFAULT_COMPOSE) --profile testing down

test-build: ## Test production build
	docker build --target production -t acs-web:test .
	docker run --rm -d --name acs-web-test -p 8080:80 acs-web:test
	sleep 5
	curl -f http://localhost:8080/health || (docker stop acs-web-test && exit 1)
	docker stop acs-web-test
	@echo "Production build test passed"

# Utility commands
logs: ## View logs (usage: make logs SERVICE=acs-web-dev)
	@if [ -z "$(SERVICE)" ]; then \
		$(DEV_COMPOSE) logs -f; \
	else \
		$(DEV_COMPOSE) logs -f $(SERVICE); \
	fi

shell: ## Access container shell (usage: make shell SERVICE=acs-web-dev)
	@if [ -z "$(SERVICE)" ]; then \
		$(DEV_COMPOSE) exec acs-web-dev sh; \
	else \
		$(DEV_COMPOSE) exec $(SERVICE) sh; \
	fi

health: ## Check container health
	@echo "Checking container health..."
	@docker ps --format "table {{.Names}}\t{{.Status}}" | grep acs-web || echo "No acs-web containers running"

status: ## Show container status
	@echo "Development Environment:"
	@$(DEV_COMPOSE) ps 2>/dev/null || echo "Not running"
	@echo ""
	@echo "Production Environment:"
	@$(PROD_COMPOSE) ps 2>/dev/null || echo "Not running"

# Cleanup commands
clean: ## Clean up containers and images
	$(DEV_COMPOSE) down -v
	$(PROD_COMPOSE) down -v
	docker image prune -f
	docker volume prune -f

clean-all: ## Clean up everything including images
	$(DEV_COMPOSE) down -v
	$(PROD_COMPOSE) down -v
	docker rmi acs-web:latest acs-web:dev 2>/dev/null || true
	docker image prune -a -f
	docker volume prune -f

# Monitoring commands
monitor: ## Start monitoring stack
	$(PROD_COMPOSE) --profile monitoring up -d
	@echo "Monitoring available at:"
	@echo "Grafana: http://localhost:3000"
	@echo "Prometheus: http://localhost:9090"

monitor-stop: ## Stop monitoring stack
	$(PROD_COMPOSE) --profile monitoring down

# Storybook commands
storybook: ## Start Storybook
	$(DEV_COMPOSE) --profile storybook up -d
	@echo "Storybook available at http://localhost:6006"

storybook-stop: ## Stop Storybook
	$(DEV_COMPOSE) --profile storybook down

# Linting and formatting
lint: ## Run linting
	docker run --rm -v $(PWD):/app -w /app acs-web:dev npm run lint

lint-fix: ## Fix linting issues
	docker run --rm -v $(PWD):/app -w /app acs-web:dev npm run lint -- --fix

format: ## Format code
	docker run --rm -v $(PWD):/app -w /app acs-web:dev npm run format

# Build with specific environment
build-staging: ## Build staging image
	docker build \
		--target production \
		--build-arg VITE_API_URL=https://staging-api.yourdomain.com \
		--build-arg VITE_WS_URL=wss://staging-api.yourdomain.com \
		--build-arg VITE_APP_VERSION=staging \
		-t acs-web:staging .

build-production: ## Build production image with production settings
	docker build \
		--target production \
		--build-arg VITE_API_URL=https://api.yourdomain.com \
		--build-arg VITE_WS_URL=wss://api.yourdomain.com \
		--build-arg VITE_APP_VERSION=1.0.0 \
		-t acs-web:production .

# Quick commands
quick-dev: build-dev dev ## Quick setup and start development
quick-prod: build prod ## Quick setup and start production
quick-test: build-dev test ## Quick build and test

# Docker registry commands
push: ## Push image to registry (usage: make push REGISTRY=your-registry.com)
	@if [ -z "$(REGISTRY)" ]; then \
		echo "Please specify REGISTRY. Example: make push REGISTRY=your-registry.com"; \
	else \
		docker tag acs-web:latest $(REGISTRY)/acs-web:latest; \
		docker push $(REGISTRY)/acs-web:latest; \
	fi

pull: ## Pull image from registry (usage: make pull REGISTRY=your-registry.com)
	@if [ -z "$(REGISTRY)" ]; then \
		echo "Please specify REGISTRY. Example: make pull REGISTRY=your-registry.com"; \
	else \
		docker pull $(REGISTRY)/acs-web:latest; \
		docker tag $(REGISTRY)/acs-web:latest acs-web:latest; \
	fi

# Environment setup
setup-dev: ## Setup development environment
	@echo "Setting up development environment..."
	@mkdir -p dev
	@echo '{"posts": [], "users": []}' > dev/db.json
	@echo "Development environment setup complete"

setup-prod: ## Setup production environment
	@echo "Setting up production environment..."
	@mkdir -p nginx/ssl monitoring/grafana/provisioning
	@echo "Production environment setup complete"

# Documentation
docs: ## Open documentation
	@echo "Documentation available at:"
	@echo "- Docker Guide: ./DOCKER.md"
	@echo "- Main README: ./README.md"
