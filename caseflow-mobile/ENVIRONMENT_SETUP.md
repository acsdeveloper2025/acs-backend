# CaseFlow Mobile - Environment Setup Guide

This guide explains how to configure environment variables for the CaseFlow Mobile application to integrate with the backend API.

## Environment Files

### .env
The main environment configuration file. Copy from `.env.example` and update values according to your environment.

### .env.example
Template file with all available environment variables and their descriptions.

## Environment Variables

### Backend API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3001/api` | Yes |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:3001` | No |
| `VITE_ENVIRONMENT` | Current environment | `development` | Yes |

### Authentication Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_JWT_SECRET_KEY` | JWT secret key for token validation | `your-jwt-secret-key-here` | Yes |
| `VITE_JWT_EXPIRES_IN` | JWT token expiration time | `24h` | No |
| `VITE_REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration time | `7d` | No |
| `VITE_SESSION_TIMEOUT` | Session timeout in milliseconds | `3600000` | No |

### File Upload Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_MAX_FILE_SIZE` | Maximum file size in bytes | `10485760` (10MB) | No |
| `VITE_ALLOWED_FILE_TYPES` | Comma-separated list of allowed MIME types | `image/jpeg,image/png,image/jpg,application/pdf` | No |
| `VITE_MAX_ATTACHMENTS_PER_CASE` | Maximum attachments per case | `10` | No |

### Location Services Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_LOCATION_TIMEOUT` | GPS timeout in milliseconds | `30000` | No |
| `VITE_LOCATION_MAX_AGE` | Maximum age of cached location | `300000` | No |
| `VITE_LOCATION_HIGH_ACCURACY` | Enable high accuracy GPS | `true` | No |

### Offline & Sync Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_OFFLINE_STORAGE_LIMIT` | Maximum offline cases to store | `100` | No |
| `VITE_SYNC_RETRY_ATTEMPTS` | Number of sync retry attempts | `3` | No |
| `VITE_SYNC_RETRY_DELAY` | Delay between sync retries (ms) | `5000` | No |
| `VITE_AUTO_SYNC_INTERVAL` | Auto sync interval (ms) | `300000` | No |

### Security Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ENABLE_BIOMETRIC_AUTH` | Enable biometric authentication | `true` | No |
| `VITE_ENABLE_DEVICE_BINDING` | Enable device binding | `true` | No |

### Feature Flags

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ENABLE_GOOGLE_MAPS` | Enable Google Maps integration | `true` | No |
| `VITE_ENABLE_LOCATION_VALIDATION` | Enable location validation | `true` | No |
| `VITE_ENABLE_ENHANCED_GEOCODING` | Enable enhanced geocoding | `true` | No |
| `VITE_ENABLE_OFFLINE_MODE` | Enable offline functionality | `true` | No |
| `VITE_ENABLE_REAL_TIME_UPDATES` | Enable real-time updates | `true` | No |
| `VITE_ENABLE_PUSH_NOTIFICATIONS` | Enable push notifications | `true` | No |
| `VITE_ENABLE_AUTO_SAVE` | Enable auto-save functionality | `true` | No |
| `VITE_ENABLE_BACKGROUND_SYNC` | Enable background sync | `true` | No |

### Development Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_DEBUG_MODE` | Enable debug mode | `true` | No |
| `VITE_LOG_LEVEL` | Logging level (debug/info/warn/error) | `debug` | No |
| `VITE_ENABLE_MOCK_DATA` | Enable mock data for testing | `false` | No |

## Environment-Specific Configurations

### Development Environment
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_ENVIRONMENT=development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_ENABLE_MOCK_DATA=false
```

### Staging Environment
```env
VITE_API_BASE_URL=https://staging-api.caseflow.com/api
VITE_WS_URL=wss://staging-api.caseflow.com
VITE_ENVIRONMENT=staging
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=info
VITE_ENABLE_MOCK_DATA=false
```

### Production Environment
```env
VITE_API_BASE_URL=https://api.caseflow.com/api
VITE_WS_URL=wss://api.caseflow.com
VITE_ENVIRONMENT=production
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_ENABLE_MOCK_DATA=false
```

## Configuration Usage

### In TypeScript/JavaScript Code

```typescript
import { getEnvironmentConfig, isFeatureEnabled, getApiConfig } from './config/environment';

// Get full configuration
const config = getEnvironmentConfig();

// Check if a feature is enabled
if (isFeatureEnabled('enableRealTimeUpdates')) {
  // Initialize WebSocket connection
}

// Get API configuration for HTTP client
const apiConfig = getApiConfig();
```

### Validation

The environment configuration is automatically validated when loaded. Check the console for any warnings or errors.

```typescript
import { validateEnvironmentConfig, getEnvironmentConfig } from './config/environment';

const config = getEnvironmentConfig();
const isValid = validateEnvironmentConfig(config);

if (!isValid) {
  console.error('Invalid environment configuration');
}
```

## Setup Instructions

1. **Copy Environment File**
   ```bash
   cp .env.example .env
   ```

2. **Update Configuration**
   Edit `.env` file with your specific values:
   - Set `VITE_API_BASE_URL` to your backend API URL
   - Set `VITE_WS_URL` to your WebSocket server URL
   - Configure authentication settings
   - Set your Google Maps API key

3. **Validate Configuration**
   Start the application and check the console for any configuration warnings or errors.

4. **Test Integration**
   Verify that the mobile app can connect to the backend API and all features work as expected.

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `VITE_API_BASE_URL` is correct
   - Ensure backend server is running
   - Verify network connectivity

2. **WebSocket Connection Failed**
   - Check `VITE_WS_URL` is correct
   - Ensure WebSocket server is running
   - Check firewall settings

3. **Authentication Issues**
   - Verify `VITE_JWT_SECRET_KEY` matches backend
   - Check token expiration settings
   - Ensure device time is synchronized

4. **File Upload Issues**
   - Check `VITE_MAX_FILE_SIZE` settings
   - Verify `VITE_ALLOWED_FILE_TYPES` configuration
   - Ensure backend accepts the file types

### Debug Mode

Enable debug mode for detailed logging:
```env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

This will provide detailed information about:
- API requests and responses
- WebSocket connections
- Authentication flows
- File upload processes
- Location services
- Offline sync operations

## Security Considerations

1. **Never commit sensitive values** to version control
2. **Use different JWT secrets** for each environment
3. **Enable HTTPS** in production environments
4. **Regularly rotate** API keys and secrets
5. **Limit file upload sizes** to prevent abuse
6. **Validate all environment variables** before use

## Next Steps

After setting up the environment configuration:

1. **Test Authentication Flow** - Verify login/logout functionality
2. **Test API Integration** - Check case management operations
3. **Test File Uploads** - Verify attachment functionality
4. **Test Real-time Features** - Check WebSocket connections
5. **Test Offline Mode** - Verify offline sync capabilities
