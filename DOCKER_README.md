# Docker Documentation - CRM Application Stack

## Overview

This repository contains a complete CRM application stack with Docker containerization for all components:

- **Backend API** (`acs-backend`): Node.js/Express API with SQL Server and Redis
- **Web Frontend** (`acs-web`): React/Vite application with TypeScript
- **Mobile App** (`caseflow-mobile`): React Native/Capacitor mobile application

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Nginx     │  │ Web Frontend│  │ Mobile App  │        │
│  │   Proxy     │  │   (React)   │  │  (React)    │        │
│  │   :80/443   │  │    :3001    │  │   :5173     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                  ┌─────────────┐                          │
│                  │   Backend   │                          │
│                  │   API       │                          │
│                  │   :3000     │                          │
│                  └─────────────┘                          │
│                           │                                │
│         ┌─────────────────┼─────────────────┐              │
│         │                 │                 │              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ SQL Server  │  │    Redis    │  │  File       │        │
│  │ Database    │  │    Cache    │  │  Storage    │        │
│  │   :1433     │  │   :6379     │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- 8GB+ RAM recommended
- 20GB+ disk space

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd CRM-APP

# Start development environment
docker-compose -f docker-compose.development.yml up -d

# View logs
docker-compose -f docker-compose.development.yml logs -f

# Access applications
# Web Frontend: http://localhost:3001
# Mobile App: http://localhost:5173
# Backend API: http://localhost:3000
# Database Admin: http://localhost:8080
# Redis Admin: http://localhost:8081
```

### Production Environment

```bash
# Create secrets directory
mkdir -p secrets

# Generate secrets (example - use secure values in production)
echo "YourSecurePassword123!" > secrets/db_password.txt
echo "sqlserver://sqlserver:1433;database=acs_backend;user=sa;password=YourSecurePassword123!;trustServerCertificate=true" > secrets/database_url.txt
echo "$(openssl rand -base64 32)" > secrets/jwt_secret.txt
echo "$(openssl rand -base64 32)" > secrets/jwt_refresh_secret.txt

# Start production environment
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

## Environment Configurations

### 1. Development (`docker-compose.development.yml`)

**Features:**
- Hot reload for all applications
- Debug ports exposed
- Development databases with sample data
- Email testing with MailHog
- File browser for uploads
- Verbose logging

**Services:**
- Backend API with hot reload
- Web frontend with Vite dev server
- Mobile app with Vite dev server
- SQL Server with development settings
- Redis cache
- Adminer for database management
- Redis Commander
- MailHog for email testing
- File browser for uploads

### 2. Production (`docker-compose.production.yml`)

**Features:**
- Optimized builds with multi-stage Dockerfiles
- Security hardening
- Resource limits
- Health checks
- Monitoring with Prometheus/Grafana
- Log aggregation with ELK stack
- Backup services
- SSL/TLS termination

**Services:**
- Backend API (production build)
- Web frontend (Nginx served)
- Mobile app (Nginx served)
- SQL Server (production configuration)
- Redis (production configuration)
- Nginx reverse proxy
- Elasticsearch for logging
- Prometheus for metrics
- Grafana for dashboards

### 3. Full Stack (`docker-compose.full-stack.yml`)

**Features:**
- Complete stack with all services
- Suitable for staging/testing
- Optional services with profiles
- Comprehensive monitoring

## Individual Application Documentation

### Backend API
- **Location**: `acs-backend/`
- **Documentation**: `acs-backend/README.md`
- **Docker**: `acs-backend/Dockerfile`
- **Port**: 3000

### Web Frontend
- **Location**: `acs-web/`
- **Documentation**: `acs-web/DOCKER.md`
- **Docker**: `acs-web/Dockerfile`
- **Port**: 3001 (production), 5173 (development)

### Mobile Application
- **Location**: `caseflow-mobile/`
- **Documentation**: `caseflow-mobile/DOCKER.md`
- **Docker**: `caseflow-mobile/Dockerfile`
- **Port**: 5173 (web preview)

## Common Commands

### Development Workflow

```bash
# Start development environment
docker-compose -f docker-compose.development.yml up -d

# Rebuild specific service
docker-compose -f docker-compose.development.yml up --build backend-dev

# View logs for specific service
docker-compose -f docker-compose.development.yml logs -f web-frontend-dev

# Execute commands in running container
docker-compose -f docker-compose.development.yml exec backend-dev npm run test

# Stop all services
docker-compose -f docker-compose.development.yml down

# Stop and remove volumes
docker-compose -f docker-compose.development.yml down -v
```

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.production.yml build

# Start production stack
docker-compose -f docker-compose.production.yml up -d

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Update specific service
docker-compose -f docker-compose.production.yml up -d --no-deps backend

# View service status
docker-compose -f docker-compose.production.yml ps

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f --tail=100
```

### Maintenance Commands

```bash
# Backup databases
docker-compose -f docker-compose.production.yml run --rm backup

# Update images
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Clean up unused resources
docker system prune -a

# View resource usage
docker stats

# Export/Import data
docker-compose -f docker-compose.production.yml exec sqlserver sqlcmd -S localhost -U sa -Q "BACKUP DATABASE..."
```

## Environment Variables

### Backend API
```bash
NODE_ENV=development|production
PORT=3000
DATABASE_URL=sqlserver://...
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=debug|info|warn|error
```

### Frontend Applications
```bash
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_APP_VERSION=1.0.0
NODE_ENV=development|production
```

## Networking

### Development Network
- **Name**: `crm-dev-network`
- **Subnet**: `172.21.0.0/16`
- **Driver**: bridge

### Production Network
- **Name**: `crm-prod-network`
- **Subnet**: `172.22.0.0/16`
- **Driver**: bridge

### Port Mapping

| Service | Development | Production | Description |
|---------|-------------|------------|-------------|
| Backend API | 3000 | 127.0.0.1:3000 | REST API |
| Web Frontend | 3001 | 127.0.0.1:3001 | React App |
| Mobile App | 5173 | 127.0.0.1:5173 | Mobile Web |
| SQL Server | 1433 | 127.0.0.1:1433 | Database |
| Redis | 6379 | 127.0.0.1:6379 | Cache |
| Adminer | 8080 | - | DB Admin |
| Redis Commander | 8081 | - | Redis Admin |
| Nginx | - | 80/443 | Reverse Proxy |
| Grafana | - | 127.0.0.1:3002 | Monitoring |

## Security Considerations

### Development
- Default passwords (change for production)
- All ports exposed for debugging
- Verbose logging enabled
- CORS allows all origins

### Production
- Secrets management with Docker secrets
- Ports bound to localhost only
- Resource limits enforced
- Security headers enabled
- SSL/TLS termination
- Rate limiting enabled

## Monitoring and Logging

### Health Checks
All services include health checks:
```bash
# Check service health
docker-compose -f docker-compose.production.yml ps

# View health check logs
docker inspect --format='{{.State.Health.Status}}' crm-prod-backend
```

### Metrics Collection
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Elasticsearch**: Log aggregation
- **Kibana**: Log analysis

### Log Management
```bash
# View aggregated logs
docker-compose -f docker-compose.production.yml logs

# Export logs
docker-compose -f docker-compose.production.yml logs > application.log

# Real-time monitoring
docker-compose -f docker-compose.production.yml logs -f --tail=50
```

## Backup and Recovery

### Automated Backups
```bash
# Run backup service
docker-compose -f docker-compose.production.yml --profile backup up backup

# Manual backup
docker-compose -f docker-compose.production.yml exec sqlserver sqlcmd -S localhost -U sa -Q "BACKUP DATABASE acs_backend TO DISK='/var/backups/acs_backend.bak'"
```

### Data Recovery
```bash
# Restore from backup
docker-compose -f docker-compose.production.yml exec sqlserver sqlcmd -S localhost -U sa -Q "RESTORE DATABASE acs_backend FROM DISK='/var/backups/acs_backend.bak'"

# Volume backup
docker run --rm -v crm_sqlserver_prod_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/sqlserver-$(date +%Y%m%d).tar.gz /data
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Use different ports
   docker-compose -f docker-compose.development.yml up -d --scale backend-dev=0
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   docker stats
   
   # Increase Docker memory limit
   # Docker Desktop: Settings > Resources > Memory
   ```

3. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose -f docker-compose.development.yml logs sqlserver
   
   # Test connection
   docker-compose -f docker-compose.development.yml exec backend-dev npm run db:test
   ```

4. **Build Failures**
   ```bash
   # Clear build cache
   docker builder prune -a
   
   # Rebuild without cache
   docker-compose -f docker-compose.development.yml build --no-cache
   ```

### Debug Commands
```bash
# Access container shell
docker-compose -f docker-compose.development.yml exec backend-dev sh

# Check container logs
docker-compose -f docker-compose.development.yml logs -f backend-dev

# Inspect container
docker inspect crm-dev-backend

# Check network connectivity
docker-compose -f docker-compose.development.yml exec backend-dev ping sqlserver
```

## Performance Optimization

### Resource Limits
Production configuration includes resource limits:
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
    reservations:
      memory: 512M
      cpus: '0.25'
```

### Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Scale frontend services
docker-compose -f docker-compose.production.yml up -d --scale web-frontend=2
```

### Caching
- Redis for application caching
- Nginx for static asset caching
- Docker layer caching for builds

## CI/CD Integration

### GitHub Actions
See individual application documentation for CI/CD examples:
- `acs-web/DOCKER.md`
- `caseflow-mobile/DOCKER.md`

### GitLab CI
Example pipeline configurations included in application directories.

## Support

For issues and questions:
1. Check individual application documentation
2. Review Docker logs
3. Check health status of services
4. Verify network connectivity
5. Review resource usage

## License

[Your License Here]
