# Mobile App Integration Guide

This document provides comprehensive information about the mobile app integration features implemented in the ACS Backend.

## Overview

The backend now includes complete mobile app integration with the following features:

- **Enhanced Authentication** - Mobile-specific login with device registration
- **Case Management APIs** - Optimized for mobile consumption
- **File Upload & Management** - Multipart upload with mobile optimizations
- **Form Submission** - Residence and office verification forms
- **Location Services** - GPS capture, validation, and reverse geocoding
- **Real-time Updates** - WebSocket integration for live updates
- **Offline Sync** - Background synchronization for offline capabilities
- **Push Notifications** - Device registration and notification management

## API Endpoints

### Authentication

```
POST /api/mobile/auth/login
POST /api/mobile/auth/refresh
POST /api/mobile/auth/logout
POST /api/mobile/auth/version-check
GET  /api/mobile/auth/config
POST /api/mobile/auth/notifications/register
```

### Case Management

```
GET  /api/mobile/cases
GET  /api/mobile/cases/:caseId
PUT  /api/mobile/cases/:caseId/status
PUT  /api/mobile/cases/:caseId/priority
POST /api/mobile/cases/:caseId/auto-save
GET  /api/mobile/cases/:caseId/auto-save/:formType
```

### Attachments

```
POST /api/mobile/cases/:caseId/attachments
GET  /api/mobile/cases/:caseId/attachments
GET  /api/mobile/attachments/:attachmentId/content
DELETE /api/mobile/attachments/:attachmentId
```

### Form Submission

```
POST /api/mobile/cases/:caseId/verification/residence
POST /api/mobile/cases/:caseId/verification/office
GET  /api/mobile/forms/:formType/template
```

### Location Services

```
POST /api/mobile/location/capture
POST /api/mobile/location/validate
GET  /api/mobile/location/reverse-geocode
GET  /api/mobile/cases/:caseId/location-history
GET  /api/mobile/location/trail
```

### Sync

```
POST /api/mobile/sync/upload
GET  /api/mobile/sync/download
GET  /api/mobile/sync/status
```

## Required Headers

All mobile API requests should include these headers:

```
Authorization: Bearer <jwt_token>
X-App-Version: 4.0.0
X-Platform: IOS|ANDROID
X-Device-ID: <unique_device_identifier>
Content-Type: application/json
```

## Authentication Flow

### 1. Mobile Login

```javascript
POST /api/mobile/auth/login
{
  "username": "field_agent",
  "password": "password123",
  "deviceId": "device_unique_id",
  "deviceInfo": {
    "platform": "IOS",
    "model": "iPhone 14 Pro",
    "osVersion": "16.4",
    "appVersion": "4.0.0"
  }
}
```

### 2. Token Refresh

```javascript
POST /api/mobile/auth/refresh
{
  "refreshToken": "refresh_token_here"
}
```

## File Upload

### Multipart Upload with Geo-location

```javascript
POST /api/mobile/cases/:caseId/attachments
Content-Type: multipart/form-data

files: [File1, File2, ...]
geoLocation: {
  "latitude": 19.0760,
  "longitude": 72.8777,
  "accuracy": 5.0,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Form Submission

### Residence Verification

```javascript
POST /api/mobile/cases/:caseId/verification/residence
{
  "formData": {
    "applicantName": "John Doe",
    "addressConfirmed": true,
    "residenceType": "OWNED",
    "outcome": "VERIFIED"
  },
  "attachmentIds": ["att1", "att2", "att3", "att4", "att5"],
  "geoLocation": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "accuracy": 5.0,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "photos": [
    {
      "attachmentId": "att1",
      "geoLocation": { ... }
    }
  ]
}
```

## WebSocket Integration

### Connection

```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'jwt_token_here',
    deviceId: 'device_unique_id',
    platform: 'IOS'
  }
});
```

### Events

#### Client to Server
- `mobile:app:state` - App state changes
- `mobile:sync:request` - Request sync
- `mobile:location:share` - Share location
- `mobile:form:autosave` - Form auto-save
- `mobile:photo:captured` - Photo capture
- `mobile:connectivity` - Connectivity status

#### Server to Client
- `mobile:case:assigned` - New case assignment
- `mobile:case:status:changed` - Case status update
- `mobile:sync:completed` - Sync completion
- `mobile:app:update` - App update available

## Offline Sync

### Upload Local Changes

```javascript
POST /api/mobile/sync/upload
{
  "localChanges": {
    "cases": [
      {
        "id": "case_id",
        "action": "UPDATE",
        "data": { ... },
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "attachments": [...],
    "locations": [...]
  },
  "deviceInfo": { ... },
  "lastSyncTimestamp": "2024-01-15T09:00:00Z"
}
```

### Download Server Changes

```javascript
GET /api/mobile/sync/download?lastSyncTimestamp=2024-01-15T09:00:00Z&limit=50
```

## Configuration

### Environment Variables

```bash
# Mobile App Configuration
MOBILE_API_VERSION=4.0.0
MOBILE_MIN_SUPPORTED_VERSION=3.0.0
MOBILE_FORCE_UPDATE_VERSION=2.0.0

# Mobile File Upload
MOBILE_MAX_FILE_SIZE=10485760
MOBILE_MAX_FILES_PER_CASE=10

# Mobile Location Services
MOBILE_LOCATION_ACCURACY_THRESHOLD=10
MOBILE_ENABLE_LOCATION_VALIDATION=true

# Mobile Feature Flags
MOBILE_ENABLE_OFFLINE_MODE=true
MOBILE_ENABLE_BACKGROUND_SYNC=true
MOBILE_ENABLE_BIOMETRIC_AUTH=true
```

## Error Handling

All mobile API responses follow this format:

### Success Response
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... },
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "retryable": true,
  "retryAfter": 5000
}
```

## Security Features

- **JWT Authentication** with device binding
- **Rate Limiting** - 200 requests per 15 minutes per device
- **File Type Validation** - Only allowed image and document types
- **File Size Limits** - Maximum 10MB per file
- **Geo-location Validation** - Accuracy thresholds
- **Device Registration** - Track and limit devices per user

## Testing

### Postman Collection

Import the provided Postman collection for testing all mobile endpoints:

```bash
# Collection includes:
- Authentication flows
- Case management operations
- File upload scenarios
- Form submissions
- Location services
- Sync operations
```

### Test Scenarios

1. **Login Flow** - Test device registration and token management
2. **Case Operations** - CRUD operations with mobile optimizations
3. **File Upload** - Multipart upload with geo-location
4. **Form Submission** - Complete verification workflows
5. **Offline Sync** - Upload/download sync scenarios
6. **Real-time Updates** - WebSocket event handling

## Performance Optimizations

- **Pagination** - All list endpoints support pagination
- **Compression** - Response compression for large datasets
- **Caching** - API response caching with TTL
- **Batch Operations** - Sync operations in batches
- **Image Thumbnails** - Automatic thumbnail generation
- **Connection Pooling** - Database connection optimization

## Monitoring & Logging

- **Audit Logs** - All mobile operations are logged
- **Performance Metrics** - Response times and error rates
- **Device Analytics** - Device usage and performance data
- **Sync Statistics** - Offline sync success rates
- **Error Tracking** - Detailed error reporting

## Deployment

### Docker Configuration

```dockerfile
# Mobile-specific environment variables
ENV MOBILE_API_VERSION=4.0.0
ENV MOBILE_ENABLE_OFFLINE_MODE=true
ENV MOBILE_MAX_FILE_SIZE=10485760
```

### Health Checks

```bash
# Mobile API health check
GET /api/mobile/auth/config

# WebSocket health check
Connect to ws://localhost:3001
```

This mobile integration provides a complete foundation for the React Native mobile app with offline capabilities, real-time updates, and comprehensive API coverage.
