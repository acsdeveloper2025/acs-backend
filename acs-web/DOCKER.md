# Docker Documentation - ACS Web Frontend

## Overview

The ACS Web frontend is a React application built with Vite and TypeScript, containerized using Docker with a multi-stage build process for optimal production deployment.

## Architecture

### Multi-Stage Build Process

The Dockerfile uses a three-stage build process:

1. **Dependencies Stage (`deps`)**: Installs production dependencies
2. **Builder Stage (`builder`)**: Builds the application with all dependencies
3. **Production Stage (`runner`)**: Serves the built application using Nginx

### Container Structure

```
┌─────────────────────────────────────┐
│           nginx:alpine              │
│  ┌─────────────────────────────────┐│
│  │        Built React App          ││
│  │     (/usr/share/nginx/html)     ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │       Custom Nginx Config       ││
│  │     (/etc/nginx/nginx.conf)     ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Build Arguments and Environment Variables

### Build-Time Arguments

| Argument | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_URL` | Backend API URL | - | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket URL | - | `ws://localhost:3000` |
| `VITE_APP_VERSION` | Application version | - | `1.0.0` |
| `NODE_ENV` | Node environment | `production` | `production` |

### Runtime Environment Variables

The application uses Vite environment variables that are embedded at build time:

```bash
# Development
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_APP_VERSION=dev

# Production
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_APP_VERSION=1.0.0
```

## Docker Commands

### Building the Image

#### Development Build
```bash
# Build with development settings
docker build \
  --build-arg VITE_API_URL=http://localhost:3000 \
  --build-arg VITE_WS_URL=ws://localhost:3000 \
  --build-arg VITE_APP_VERSION=dev \
  --build-arg NODE_ENV=development \
  -t acs-web:dev .
```

#### Production Build
```bash
# Build with production settings
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  --build-arg VITE_WS_URL=wss://api.yourdomain.com \
  --build-arg VITE_APP_VERSION=1.0.0 \
  --build-arg NODE_ENV=production \
  -t acs-web:latest .
```

#### Using Build Arguments File
```bash
# Create build.env file
cat > build.env << EOF
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_APP_VERSION=1.0.0
NODE_ENV=production
EOF

# Build using env file
docker build --env-file build.env -t acs-web:latest .
```

### Running the Container

#### Basic Run
```bash
# Run on port 3001
docker run -d \
  --name acs-web \
  -p 3001:80 \
  acs-web:latest
```

#### Run with Custom Configuration
```bash
# Run with custom nginx config
docker run -d \
  --name acs-web \
  -p 3001:80 \
  -v $(pwd)/custom-nginx.conf:/etc/nginx/nginx.conf:ro \
  acs-web:latest
```

#### Run with Health Checks
```bash
# Run with health monitoring
docker run -d \
  --name acs-web \
  -p 3001:80 \
  --health-cmd="curl -f http://localhost:80/ || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  acs-web:latest
```

## Docker Compose Integration

### Basic Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  acs-web:
    build:
      context: .
      args:
        VITE_API_URL: http://localhost:3000
        VITE_WS_URL: ws://localhost:3000
        VITE_APP_VERSION: dev
        NODE_ENV: development
    container_name: acs-web
    restart: unless-stopped
    ports:
      - "3001:80"
    networks:
      - acs-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  acs-network:
    driver: bridge
```

### Full Stack Docker Compose

Create `docker-compose.full.yml`:

```yaml
version: '3.8'

services:
  # Backend (from acs-backend)
  backend:
    build: ../acs-backend
    container_name: acs-backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: sqlserver://sqlserver:1433;database=acs_backend;user=sa;password=YourStrong@Passw0rd;trustServerCertificate=true
      REDIS_URL: redis://redis:6379
      JWT_SECRET: development-jwt-secret
      CORS_ORIGIN: http://localhost:3001
    ports:
      - "3000:3000"
    networks:
      - acs-network
    depends_on:
      - sqlserver
      - redis

  # Frontend
  frontend:
    build:
      context: .
      args:
        VITE_API_URL: http://localhost:3000
        VITE_WS_URL: ws://localhost:3000
        VITE_APP_VERSION: dev
    container_name: acs-web
    restart: unless-stopped
    ports:
      - "3001:80"
    networks:
      - acs-network
    depends_on:
      - backend

  # Database
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: acs-sqlserver
    restart: unless-stopped
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: YourStrong@Passw0rd
      MSSQL_PID: Developer
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql
    networks:
      - acs-network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: acs-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - acs-network

volumes:
  sqlserver_data:
  redis_data:

networks:
  acs-network:
    driver: bridge
```

### Running with Docker Compose

```bash
# Start all services
docker-compose up -d

# Start with build
docker-compose up --build -d

# View logs
docker-compose logs -f acs-web

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Nginx Configuration

### Default Nginx Configuration

The container expects a custom nginx configuration. Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Handle React Router
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # API proxy (optional)
        location /api/ {
            proxy_pass http://backend:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## Development Workflow

### Development with Docker

```bash
# 1. Build development image
docker build \
  --build-arg VITE_API_URL=http://localhost:3000 \
  --build-arg VITE_WS_URL=ws://localhost:3000 \
  --build-arg NODE_ENV=development \
  -t acs-web:dev .

# 2. Run development container
docker run -d \
  --name acs-web-dev \
  -p 3001:80 \
  acs-web:dev

# 3. Check logs
docker logs -f acs-web-dev

# 4. Access application
open http://localhost:3001
```

### Hot Reload Development

For development with hot reload, use volume mounting:

```bash
# Run with source code mounted
docker run -d \
  --name acs-web-dev \
  -p 3001:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -w /app \
  node:18-alpine \
  npm run dev -- --host 0.0.0.0
```

Or use docker-compose for development:

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  acs-web-dev:
    image: node:18-alpine
    container_name: acs-web-dev
    working_dir: /app
    command: npm run dev -- --host 0.0.0.0
    ports:
      - "3001:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_WS_URL=ws://localhost:3000
```

```bash
# Run development environment
docker-compose -f docker-compose.dev.yml up
```

## Production Deployment

### Environment-Specific Builds

#### Staging Environment
```bash
docker build \
  --build-arg VITE_API_URL=https://staging-api.yourdomain.com \
  --build-arg VITE_WS_URL=wss://staging-api.yourdomain.com \
  --build-arg VITE_APP_VERSION=staging \
  -t acs-web:staging .
```

#### Production Environment
```bash
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  --build-arg VITE_WS_URL=wss://api.yourdomain.com \
  --build-arg VITE_APP_VERSION=1.0.0 \
  -t acs-web:production .
```

### Container Registry

#### Tagging for Registry
```bash
# Tag for Docker Hub
docker tag acs-web:latest yourusername/acs-web:latest
docker tag acs-web:latest yourusername/acs-web:1.0.0

# Tag for AWS ECR
docker tag acs-web:latest 123456789012.dkr.ecr.us-west-2.amazonaws.com/acs-web:latest

# Tag for Google Container Registry
docker tag acs-web:latest gcr.io/your-project/acs-web:latest
```

#### Pushing to Registry
```bash
# Push to Docker Hub
docker push yourusername/acs-web:latest
docker push yourusername/acs-web:1.0.0

# Push to AWS ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/acs-web:latest

# Push to Google Container Registry
docker push gcr.io/your-project/acs-web:latest
```

## Monitoring and Logging

### Health Checks

The container includes built-in health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' acs-web

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' acs-web
```

### Log Management

```bash
# View container logs
docker logs acs-web

# Follow logs in real-time
docker logs -f acs-web

# View logs with timestamps
docker logs -t acs-web

# View last 100 lines
docker logs --tail 100 acs-web
```

### Performance Monitoring

```bash
# Monitor container stats
docker stats acs-web

# Monitor resource usage
docker exec acs-web top

# Check nginx status
docker exec acs-web nginx -t
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Check build logs
docker build --no-cache -t acs-web:debug .

# Build with verbose output
docker build --progress=plain -t acs-web:debug .
```

#### 2. Runtime Issues

```bash
# Check container logs
docker logs acs-web

# Access container shell
docker exec -it acs-web sh

# Check nginx configuration
docker exec acs-web nginx -t

# Check file permissions
docker exec acs-web ls -la /usr/share/nginx/html
```

#### 3. Network Issues

```bash
# Check container network
docker network ls
docker network inspect acs-network

# Test connectivity
docker exec acs-web ping backend
docker exec acs-web curl -f http://backend:3000/health
```

### Debug Mode

Create a debug version of the container:

```dockerfile
# Add to Dockerfile for debugging
FROM nginx:alpine AS debug
RUN apk add --no-cache curl wget netcat-openbsd
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build debug image
docker build --target debug -t acs-web:debug .

# Run with debug capabilities
docker run -it --rm acs-web:debug sh
```
