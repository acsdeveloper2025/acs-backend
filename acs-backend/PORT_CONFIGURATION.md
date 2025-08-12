<<<<<<< HEAD
# 🔧 ACS System - Fixed Port Configuration

This document defines the fixed port assignments for all ACS system services. These ports are **strictly enforced** and services will fail to start if the required port is not available.

## 📋 Port Assignments

| Service | Port | Protocol | Status | Configuration |
|---------|------|----------|--------|---------------|
| **Backend API Server** | `3000` | HTTP/HTTPS | ✅ Enforced | Express.js with strict port validation |
| **Frontend Development** | `5173` | HTTP | ✅ Enforced | Vite with `strictPort: true` |
| **PostgreSQL Database** | `5432` | TCP | ✅ Standard | Standard PostgreSQL port |
| **Redis Cache/Queue** | `6379` | TCP | ✅ Standard | Standard Redis port |

## 🚫 No Automatic Port Switching

All services are configured with **strict port enforcement**:

- **Frontend**: Uses `strictPort: true` in Vite configuration
- **Backend**: Validates port 3000 and exits if unavailable
- **Database**: Uses standard PostgreSQL port 5432
- **Redis**: Uses standard Redis port 6379

## 🔧 Configuration Details

### Frontend (Vite)
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true, // Fail if port not available
    host: true,
  },
})
```

### Backend (Express)
```typescript
// src/config/index.ts
export const config = {
  port: 3000, // Fixed port, no environment override
  // ... other config
}

// Strict port validation
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port 3000 is already in use. Please free the port.`);
    process.exit(1);
  }
});
```

### Database Connection
```bash
# .env
DATABASE_URL="postgresql://mayurkulkarni@localhost:5432/acs_backend"
```

### Redis Connection
```bash
# .env
REDIS_URL=redis://localhost:6379
QUEUE_REDIS_URL=redis://localhost:6379
```

## 🛠️ Development Workflow

### Starting Services
```bash
# 1. Start PostgreSQL (if not running)
brew services start postgresql@14

# 2. Start Redis (if not running)
brew services start redis

# 3. Start Backend (will fail if port 3000 is busy)
cd acs-backend
npm start

# 4. Start Frontend (will fail if port 5173 is busy)
cd acs-web
npm run dev
```

### Port Conflict Resolution
If a service fails to start due to port conflicts:

```bash
# Find and kill processes using required ports
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:5432 | xargs kill -9  # PostgreSQL (be careful!)
lsof -ti:6379 | xargs kill -9  # Redis (be careful!)
```

## 🌐 CORS Configuration

With fixed ports, CORS is simplified:

```typescript
// Backend CORS configuration
corsOrigin: 'http://localhost:5173'  // Single, predictable origin
```

## 🔒 Production Considerations

### Environment Variables
```bash
# Production should still use these fixed ports
PORT=3000                    # Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
```

### Docker Configuration
```yaml
# docker-compose.yml
services:
  backend:
    ports:
      - "3000:3000"
  frontend:
    ports:
      - "5173:5173"
  postgres:
    ports:
      - "5432:5432"
  redis:
    ports:
      - "6379:6379"
```

## ✅ Benefits

1. **Predictable Service Discovery**: Services always know where to find each other
2. **Simplified CORS**: No need to handle multiple frontend origins
3. **Consistent Development**: Same ports across all developer machines
4. **Easier Debugging**: Fixed endpoints for testing and monitoring
5. **Production Parity**: Development matches production configuration

## 🚨 Troubleshooting

### Common Issues

**Frontend won't start on 5173:**
```bash
lsof -ti:5173 | xargs kill -9
npm run dev
```

**Backend won't start on 3000:**
```bash
lsof -ti:3000 | xargs kill -9
npm start
```

**Database connection fails:**
- Verify PostgreSQL is running on port 5432
- Check connection string in `.env`

**Redis connection fails:**
- Verify Redis is running on port 6379
- Check Redis URL in `.env`

## 📝 Maintenance

This configuration should be maintained across:
- Development environments
- Testing environments
- Staging environments
- Production environments

Any changes to port assignments must be coordinated across all environments and documented here.
=======
# Port Configuration for ACS Applications

This document outlines the port configuration for all ACS applications to ensure they can run simultaneously without conflicts.

## Current Port Assignments

### Backend Services
- **Backend API**: `3000` (Docker container: `acs-backend`)
- **Database (SQL Server)**: `1433` (Docker container: `acs-sqlserver`)
- **Redis**: `6379` (Docker container: `acs-redis`)
- **Adminer (DB Admin)**: `8080` (Docker container: `acs-adminer`)
- **Redis Commander**: `8081` (Docker container: `acs-redis-commander`)

### Frontend Applications
- **Web Frontend**: `5173` (Docker container: `acs-web-dev`)
- **Mobile App**: `5174` (Local Vite development server)

## Configuration Details

### Web Frontend (acs-web)
- **Development**: Port 5173 (Docker)
- **Production**: Port 3001 (Docker)
- **Staging**: Port 3002 (Docker)
- **Testing**: Port 3003 (Docker)
- **Configuration**: `acs-web/docker-compose.yml`

### Mobile App (caseflow-mobile)
- **Development**: Port 5174 (Local Vite)
- **Configuration**: `caseflow-mobile/vite.config.ts`
- **Scripts**: 
  - `npm run dev` - Starts on port 5174
  - `npm run dev:port` - Explicit port specification

## Running Both Applications

To run both frontend applications simultaneously:

1. **Start Web Frontend** (Docker):
   ```bash
   cd acs-web
   docker-compose up acs-web-dev
   ```
   Access at: http://localhost:5173

2. **Start Mobile App** (Local):
   ```bash
   cd caseflow-mobile
   npm run dev
   ```
   Access at: http://localhost:5174

## Port Conflict Resolution

If you encounter port conflicts:

1. **Check running processes**:
   ```bash
   lsof -i :5173 -i :5174
   ```

2. **Kill conflicting processes**:
   ```bash
   kill -9 <PID>
   ```

3. **Restart applications** using the commands above

## Environment Variables

### Web Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:3000)
- `VITE_WS_URL`: WebSocket URL (default: ws://localhost:3000)

### Mobile App
- Backend API is configured in `caseflow-mobile/config/environment.ts`
- Default API URL: http://localhost:3000/api

## Notes

- The web frontend runs in Docker for consistency with production environment
- The mobile app runs locally for faster development iteration
- Both applications connect to the same backend API on port 3000
- Port 5174 was chosen for mobile app to avoid conflicts with web frontend on 5173
>>>>>>> c36348fef5b5383c2da7d831a18915e8da0627bf
