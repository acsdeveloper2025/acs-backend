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
