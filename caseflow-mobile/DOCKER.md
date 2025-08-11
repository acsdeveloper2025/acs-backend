# Docker Documentation - Caseflow Mobile

## Overview

Caseflow Mobile is a React Native application built with Capacitor for cross-platform mobile deployment. This documentation covers Docker containerization for development, testing, and CI/CD purposes.

## Architecture

### Container Strategy

Since this is a mobile application, Docker is primarily used for:

1. **Development Environment**: Consistent development setup across teams
2. **Build Environment**: Automated builds in CI/CD pipelines
3. **Testing Environment**: Running tests and quality checks
4. **Web Preview**: Running the web version for testing

### Technology Stack

- **Framework**: React Native with Capacitor
- **Build Tool**: Vite
- **Package Manager**: npm
- **Target Platforms**: iOS, Android, Web

## Dockerfile

Create a Dockerfile for development and build purposes:

```dockerfile
# Multi-stage build for Caseflow Mobile
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    openjdk11-jre

# Set working directory
WORKDIR /app

# Install dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_VERSION
ARG NODE_ENV=production

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV NODE_ENV=$NODE_ENV

# Build the web version
RUN npm run build

# Web preview stage (for testing web version)
FROM nginx:alpine AS web-preview
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Android build stage
FROM base AS android-builder
RUN apk add --no-cache \
    android-tools \
    gradle

# Install Android SDK (simplified - in production use official Android image)
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

COPY --from=builder /app /app
WORKDIR /app

# Capacitor Android build
RUN npx cap add android
RUN npx cap sync android
RUN npx cap build android

# iOS build stage (requires macOS - this is for reference)
FROM base AS ios-builder
# Note: iOS builds require macOS and Xcode
# This stage is for documentation purposes
COPY --from=builder /app /app
WORKDIR /app
# RUN npx cap add ios
# RUN npx cap sync ios
# RUN npx cap build ios
```

## Docker Compose Configurations

### Development Environment

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  caseflow-mobile-dev:
    build:
      context: .
      target: development
    container_name: caseflow-mobile-dev
    restart: unless-stopped
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_WS_URL=ws://localhost:3000
      - VITE_APP_VERSION=dev
    networks:
      - mobile-network

  # Backend service (if running locally)
  backend:
    image: acs-backend:latest
    container_name: acs-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - CORS_ORIGIN=http://localhost:5173
    networks:
      - mobile-network

networks:
  mobile-network:
    driver: bridge
```

### Build Environment

Create `docker-compose.build.yml`:

```yaml
version: '3.8'

services:
  mobile-builder:
    build:
      context: .
      target: builder
      args:
        VITE_API_URL: https://api.yourdomain.com
        VITE_WS_URL: wss://api.yourdomain.com
        VITE_APP_VERSION: 1.0.0
    container_name: caseflow-mobile-builder
    volumes:
      - build-output:/app/dist
      - android-output:/app/android/app/build/outputs

  web-preview:
    build:
      context: .
      target: web-preview
    container_name: caseflow-mobile-web
    ports:
      - "8080:80"
    depends_on:
      - mobile-builder

volumes:
  build-output:
  android-output:
```

## Docker Commands

### Development

```bash
# Build development image
docker build --target development -t caseflow-mobile:dev .

# Run development server
docker run -d \
  --name caseflow-mobile-dev \
  -p 5173:5173 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e VITE_API_URL=http://localhost:3000 \
  -e VITE_WS_URL=ws://localhost:3000 \
  caseflow-mobile:dev

# Start with docker-compose
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker logs -f caseflow-mobile-dev
```

### Building

```bash
# Build web version
docker build \
  --target builder \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  --build-arg VITE_WS_URL=wss://api.yourdomain.com \
  --build-arg VITE_APP_VERSION=1.0.0 \
  -t caseflow-mobile:build .

# Extract build artifacts
docker create --name temp-container caseflow-mobile:build
docker cp temp-container:/app/dist ./dist
docker cp temp-container:/app/android ./android-build
docker rm temp-container

# Build web preview
docker build --target web-preview -t caseflow-mobile:web .
docker run -d -p 8080:80 --name mobile-web caseflow-mobile:web
```

### Android Build

```bash
# Build Android APK
docker build \
  --target android-builder \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  -t caseflow-mobile:android .

# Extract APK
docker create --name android-container caseflow-mobile:android
docker cp android-container:/app/android/app/build/outputs/apk ./apk-output
docker rm android-container
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Mobile Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build test image
        run: |
          docker build --target development -t caseflow-mobile:test .
          
      - name: Run tests
        run: |
          docker run --rm caseflow-mobile:test npm test
          
      - name: Run linting
        run: |
          docker run --rm caseflow-mobile:test npm run lint

  build-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build web version
        run: |
          docker build \
            --target web-preview \
            --build-arg VITE_API_URL=${{ secrets.VITE_API_URL }} \
            --build-arg VITE_WS_URL=${{ secrets.VITE_WS_URL }} \
            --build-arg VITE_APP_VERSION=${{ github.sha }} \
            -t caseflow-mobile:web .
            
      - name: Test web build
        run: |
          docker run -d --name test-web -p 8080:80 caseflow-mobile:web
          sleep 10
          curl -f http://localhost:8080 || exit 1
          docker stop test-web

  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Android
        run: |
          docker build \
            --target android-builder \
            --build-arg VITE_API_URL=${{ secrets.VITE_API_URL }} \
            -t caseflow-mobile:android .
            
      - name: Extract APK
        run: |
          docker create --name android-container caseflow-mobile:android
          docker cp android-container:/app/android/app/build/outputs/apk ./apk-output
          docker rm android-container
          
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: android-apk
          path: apk-output/
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2

test:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build --target development -t caseflow-mobile:test .
    - docker run --rm caseflow-mobile:test npm test
    - docker run --rm caseflow-mobile:test npm run lint

build-web:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build 
        --target web-preview 
        --build-arg VITE_API_URL=$VITE_API_URL 
        --build-arg VITE_WS_URL=$VITE_WS_URL 
        --build-arg VITE_APP_VERSION=$CI_COMMIT_SHA 
        -t $CI_REGISTRY_IMAGE:web-$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:web-$CI_COMMIT_SHA
  only:
    - main
    - develop

build-android:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build --target android-builder -t caseflow-mobile:android .
    - docker create --name android-container caseflow-mobile:android
    - docker cp android-container:/app/android/app/build/outputs/apk ./apk-output
    - docker rm android-container
  artifacts:
    paths:
      - apk-output/
    expire_in: 1 week
  only:
    - main
    - develop
```

## Environment Variables

### Build-Time Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourdomain.com` |
| `VITE_WS_URL` | WebSocket URL | `wss://api.yourdomain.com` |
| `VITE_APP_VERSION` | App version | `1.0.0` |
| `NODE_ENV` | Node environment | `production` |

### Runtime Variables (Development)

```bash
# Development environment
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_APP_VERSION=dev

# Staging environment
VITE_API_URL=https://staging-api.yourdomain.com
VITE_WS_URL=wss://staging-api.yourdomain.com
VITE_APP_VERSION=staging

# Production environment
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_APP_VERSION=1.0.0
```

## Testing with Docker

### Unit Testing

```bash
# Run unit tests
docker run --rm caseflow-mobile:dev npm test

# Run tests with coverage
docker run --rm caseflow-mobile:dev npm run test:coverage

# Run tests in watch mode
docker run --rm -it caseflow-mobile:dev npm run test:watch
```

### Integration Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
docker run --rm \
  --network mobile-network \
  -e VITE_API_URL=http://backend:3000 \
  caseflow-mobile:dev npm run test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

### E2E Testing

Create `docker-compose.e2e.yml`:

```yaml
version: '3.8'

services:
  mobile-app:
    build:
      context: .
      target: web-preview
    ports:
      - "8080:80"
    networks:
      - e2e-network

  cypress:
    image: cypress/included:latest
    working_dir: /e2e
    volumes:
      - ./cypress:/e2e/cypress
      - ./cypress.config.js:/e2e/cypress.config.js
    environment:
      - CYPRESS_baseUrl=http://mobile-app:80
    networks:
      - e2e-network
    depends_on:
      - mobile-app

networks:
  e2e-network:
    driver: bridge
```

```bash
# Run E2E tests
docker-compose -f docker-compose.e2e.yml up --abort-on-container-exit
```

## Mobile-Specific Considerations

### Capacitor Integration

```bash
# Sync Capacitor after build
docker run --rm \
  -v $(pwd):/app \
  caseflow-mobile:dev \
  sh -c "npm run build && npx cap sync"

# Copy web assets to native projects
docker run --rm \
  -v $(pwd):/app \
  caseflow-mobile:dev \
  npx cap copy
```

### Platform-Specific Builds

#### Android

```dockerfile
# Android-specific Dockerfile
FROM openjdk:11-jdk AS android-base

# Install Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

RUN mkdir -p $ANDROID_HOME && \
    cd $ANDROID_HOME && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-8512546_latest.zip && \
    unzip commandlinetools-linux-8512546_latest.zip && \
    rm commandlinetools-linux-8512546_latest.zip

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

FROM android-base AS android-builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
RUN npx cap add android
RUN npx cap sync android
RUN cd android && ./gradlew assembleDebug
```

#### iOS (macOS required)

```dockerfile
# iOS builds require macOS - this is conceptual
FROM node:18 AS ios-base
RUN npm install -g @capacitor/cli

FROM ios-base AS ios-builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
RUN npx cap add ios
RUN npx cap sync ios
# Note: Actual iOS build requires Xcode on macOS
```

## Performance Optimization

### Build Optimization

```dockerfile
# Optimized Dockerfile with multi-stage caching
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS dev-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

### Image Size Optimization

```bash
# Use .dockerignore to reduce build context
cat > .dockerignore << EOF
node_modules
.git
.gitignore
README.md
.env
.nyc_output
coverage
.vscode
android/app/build
ios/App/build
dist
EOF

# Check image sizes
docker images caseflow-mobile

# Use dive to analyze layers
dive caseflow-mobile:latest
```

## Monitoring and Debugging

### Container Health Checks

```dockerfile
# Add health check to Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5173/ || exit 1
```

### Debugging

```bash
# Debug container
docker run -it --rm caseflow-mobile:dev sh

# Check build output
docker run --rm caseflow-mobile:dev ls -la /app/dist

# Debug network issues
docker run --rm --network mobile-network caseflow-mobile:dev ping backend

# Check environment variables
docker run --rm caseflow-mobile:dev env
```

### Log Management

```bash
# View container logs
docker logs caseflow-mobile-dev

# Follow logs
docker logs -f caseflow-mobile-dev

# Export logs
docker logs caseflow-mobile-dev > mobile-app.log 2>&1
```

## Security Best Practices

### Container Security

```dockerfile
# Use non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mobile -u 1001
USER mobile

# Use specific versions
FROM node:18.19.0-alpine

# Scan for vulnerabilities
RUN npm audit --audit-level moderate
```

### Environment Security

```bash
# Use secrets for sensitive data
docker run --rm \
  --env-file .env.production \
  caseflow-mobile:prod

# Don't expose unnecessary ports
# Only expose what's needed for the specific environment
```

## Backup and Recovery

### Build Artifacts

```bash
# Backup build artifacts
docker create --name backup-container caseflow-mobile:latest
docker cp backup-container:/app/dist ./backup/dist-$(date +%Y%m%d)
docker cp backup-container:/app/android ./backup/android-$(date +%Y%m%d)
docker rm backup-container

# Restore from backup
docker run --rm -v $(pwd)/backup/dist-20240101:/restore caseflow-mobile:dev cp -r /restore /app/dist
```

### Container Images

```bash
# Save image
docker save caseflow-mobile:latest > caseflow-mobile-backup.tar

# Load image
docker load < caseflow-mobile-backup.tar

# Tag for registry
docker tag caseflow-mobile:latest registry.company.com/caseflow-mobile:backup-$(date +%Y%m%d)
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear Docker cache
   docker builder prune -a

   # Rebuild without cache
   docker build --no-cache -t caseflow-mobile:debug .
   ```

2. **Port Conflicts**
   ```bash
   # Check port usage
   docker ps
   netstat -tulpn | grep :5173

   # Use different port
   docker run -p 5174:5173 caseflow-mobile:dev
   ```

3. **Volume Mount Issues**
   ```bash
   # Check volume mounts
   docker inspect caseflow-mobile-dev

   # Fix permissions
   docker run --rm -v $(pwd):/app caseflow-mobile:dev chown -R node:node /app
   ```

4. **Network Issues**
   ```bash
   # Check network connectivity
   docker network ls
   docker network inspect mobile-network

   # Test API connectivity
   docker run --rm --network mobile-network caseflow-mobile:dev curl -f http://backend:3000/health
   ```

### Debug Commands

```bash
# Interactive debugging
docker run -it --rm caseflow-mobile:dev sh

# Check file system
docker run --rm caseflow-mobile:dev find /app -name "*.js" | head -10

# Check environment
docker run --rm caseflow-mobile:dev printenv | grep VITE

# Test build process
docker run --rm caseflow-mobile:dev npm run build -- --mode development
```
