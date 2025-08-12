# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Copy package files
COPY package.json package-lock.json* ./
# Install all dependencies for building
RUN npm ci && npm cache clean --force

# Development stage
FROM base AS development
# Copy package files
COPY package.json package-lock.json* ./
# Install all dependencies including dev dependencies
RUN npm ci
# Copy source code
COPY . .
# Expose Vite dev server port
EXPOSE 5173
# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_VERSION
ARG NODE_ENV=production

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV NODE_ENV=$NODE_ENV

# Build the application
RUN npm run build

# Production image, copy all the files and run nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a non-root user
RUN addgroup -g 1001 -S webapp
RUN adduser -S webapp -u 1001 -G webapp

# Set ownership of nginx directories
RUN chown -R webapp:webapp /usr/share/nginx/html
RUN chown -R webapp:webapp /var/cache/nginx
RUN chown -R webapp:webapp /var/log/nginx
RUN chown -R webapp:webapp /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R webapp:webapp /var/run/nginx.pid

# Switch to non-root user
USER webapp

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Default target for production
FROM production AS runner
