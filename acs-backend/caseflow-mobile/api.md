# CaseFlow Mobile API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Data Models](#data-models)
4. [Case Management APIs](#case-management-apis)
5. [Attachment System APIs](#attachment-system-apis)
6. [User Profile APIs](#user-profile-apis)
7. [Geolocation APIs](#geolocation-apis)
8. [Form Verification APIs](#form-verification-apis)
9. [Real-time Features](#real-time-features)
10. [Error Handling](#error-handling)

## Overview

CaseFlow Mobile is a comprehensive case management application with offline capabilities, real-time synchronization, and mobile-first design. The API follows RESTful principles with JSON payloads and supports both web and native mobile platforms.

**Base URL**: `https://api.caseflow-mobile.com/v1`
**Current Version**: `v4.0.0`
**Environment**: Production/Development

## Authentication

### Login Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "deviceId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "username": "john.doe",
    "employeeId": "EMP001",
    "designation": "Field Agent",
    "department": "Verification",
    "phone": "+91-9876543210",
    "email": "john.doe@company.com",
    "profilePhotoUrl": "https://api.caseflow-mobile.com/files/profile/user_123.jpg"
  },
  "permissions": ["case:read", "case:update", "attachment:upload"]
}
```

### Logout Endpoint
```http
POST /auth/logout
Authorization: Bearer {token}
```

### Device Authentication
```http
POST /auth/device/register
Content-Type: application/json

{
  "deviceId": "unique_device_identifier",
  "deviceInfo": {
    "platform": "ios|android|web",
    "model": "iPhone 14 Pro",
    "osVersion": "16.4",
    "appVersion": "4.0.0"
  }
}
```

## Data Models

### Case Interface
```typescript
interface Case {
  id: string;
  title: string;
  description: string;
  customer: {
    name: string;
    contact: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  status: CaseStatus; // 'Assigned' | 'In Progress' | 'Completed'
  verificationType: VerificationType;
  verificationOutcome?: VerificationOutcome;
  assignedAt: string; // ISO timestamp
  updatedAt: string;
  completedAt?: string;
  priority?: number; // User-defined priority (1, 2, 3, etc.)
  notes?: string;
  attachments?: Attachment[];
  // Form data for different verification types
  residenceReport?: ResidenceReportData;
  officeReport?: OfficeReportData;
  businessReport?: BusinessReportData;
  // ... other report types
}
```

### Attachment Interface
```typescript
interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/jpg' | 'image/png';
  size: number; // Size in bytes (max 10MB)
  url: string;
  thumbnailUrl?: string; // For images only
  uploadedAt: string; // ISO timestamp
  uploadedBy: string;
  description?: string;
}
```

### User Interface
```typescript
interface User {
  id: string;
  name: string;
  username: string;
  profilePhotoUrl?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  phone?: string;
  email?: string;
}
```

## Case Management APIs

### Get All Cases
```http
GET /cases
Authorization: Bearer {token}
Query Parameters:
  - status: CaseStatus (optional)
  - limit: number (default: 50)
  - offset: number (default: 0)
  - search: string (optional)
```

**Response:**
```json
{
  "cases": [
    {
      "id": "case_123",
      "title": "Residence Verification - Mumbai",
      "description": "Verify residential address for loan application",
      "customer": {
        "name": "Priya Sharma",
        "contact": "+91-9876543210"
      },
      "address": {
        "street": "12B, Ocean View Apartments",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "coordinates": {
          "latitude": 19.0760,
          "longitude": 72.8777
        }
      },
      "status": "Assigned",
      "verificationType": "Residence",
      "assignedAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

### Get Single Case
```http
GET /cases/{caseId}
Authorization: Bearer {token}
```

### Update Case Status
```http
PUT /cases/{caseId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "In Progress",
  "notes": "Started verification process"
}
```

### Submit Case
```http
POST /cases/{caseId}/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "verificationOutcome": "Positive & Door Locked",
  "reportData": {
    // Form-specific data based on verification type
  },
  "attachments": ["attachment_id_1", "attachment_id_2"]
}
```

### Update Case Priority
```http
PUT /cases/{caseId}/priority
Authorization: Bearer {token}
Content-Type: application/json

{
  "priority": 1
}
```

## Attachment System APIs

### Upload Attachment
```http
POST /cases/{caseId}/attachments
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
  - file: File (PDF or Image, max 10MB)
  - description: string (optional)
```

**Response:**
```json
{
  "attachment": {
    "id": "att_123",
    "name": "property_document.pdf",
    "type": "pdf",
    "mimeType": "application/pdf",
    "size": 2048576,
    "url": "https://api.caseflow-mobile.com/files/att_123.pdf",
    "uploadedAt": "2024-01-15T14:30:00Z",
    "uploadedBy": "John Doe",
    "description": "Property ownership documents"
  }
}
```

### Get Case Attachments
```http
GET /cases/{caseId}/attachments
Authorization: Bearer {token}
```

### Get Attachment Content
```http
GET /attachments/{attachmentId}/content
Authorization: Bearer {token}
```

**Response:** Binary file content or secure viewing URL

### Delete Attachment
```http
DELETE /attachments/{attachmentId}
Authorization: Bearer {token}
```

## User Profile APIs

### Get User Profile
```http
GET /user/profile
Authorization: Bearer {token}
```

### Update Profile Photo
```http
POST /user/profile/photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
  - photo: File (Image, max 5MB)
```

### Generate Digital ID Card
```http
GET /user/digital-id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "idCard": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "cardData": {
      "employeeId": "EMP001",
      "name": "John Doe",
      "designation": "Field Agent",
      "validUntil": "2024-12-31"
    }
  }
}
```

## Geolocation APIs

### Capture Location
```http
POST /location/capture
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "case_123",
  "coordinates": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "accuracy": 5.0,
    "timestamp": "2024-01-15T14:30:00Z"
  },
  "source": "gps|network|passive"
}
```

### Validate Location
```http
POST /location/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "coordinates": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "expectedAddress": "12B, Ocean View Apartments, Mumbai"
}
```

**Response:**
```json
{
  "isValid": true,
  "confidence": "high",
  "distance": 15.5,
  "address": {
    "formatted": "12B, Ocean View Apartments, Bandra West, Mumbai, Maharashtra 400050, India",
    "components": {
      "street": "Ocean View Apartments",
      "locality": "Bandra West",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "pincode": "400050"
    }
  }
}
```

### Reverse Geocoding
```http
GET /location/reverse-geocode
Authorization: Bearer {token}
Query Parameters:
  - lat: number (required)
  - lng: number (required)
  - language: string (default: 'en')
```

## Form Verification APIs

### Submit Residence Verification
```http
POST /cases/{caseId}/verification/residence
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportData": {
    "addressLocatable": "Easy to Locate",
    "addressRating": "Good",
    "houseStatus": "Opened",
    "metPerson": "Priya Sharma",
    "relation": "Self",
    "workingStatus": "Salaried",
    "stayingStatus": "On a Owned Basis",
    "documentShownStatus": "Showed",
    "documentType": "Electricity Bill",
    "tpcConfirmation": "Confirmed",
    "tpcName": "Neighbor",
    "tpcContact": "+91-9876543211"
  },
  "images": [
    {
      "id": "img_123",
      "type": "verification_photo",
      "url": "https://api.caseflow-mobile.com/files/img_123.jpg",
      "coordinates": {
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "timestamp": "2024-01-15T14:30:00Z"
    }
  ],
  "selfieImages": [
    {
      "id": "selfie_123",
      "type": "selfie",
      "url": "https://api.caseflow-mobile.com/files/selfie_123.jpg",
      "timestamp": "2024-01-15T14:30:00Z"
    }
  ]
}
```

### Submit Office Verification
```http
POST /cases/{caseId}/verification/office
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportData": {
    "officeStatus": "Opened",
    "metPerson": "John Manager",
    "designation": "Manager",
    "businessType": "PVT. LTD. Company",
    "businessNature": "Software Development",
    "businessPeriod": "5 years",
    "companyNamePlate": "Exist",
    "documentShownStatus": "Showed",
    "documentType": "Company Registration"
  }
}
```

### Auto-Save Form Data
```http
POST /cases/{caseId}/auto-save
Authorization: Bearer {token}
Content-Type: application/json

{
  "formType": "residence",
  "formData": {
    // Partial form data for auto-save
  },
  "timestamp": "2024-01-15T14:30:00Z"
}
```

### Get Saved Form Data
```http
GET /cases/{caseId}/auto-save/{formType}
Authorization: Bearer {token}
```

## Real-time Features

### WebSocket Connection
```javascript
// Connect to WebSocket for real-time updates
const ws = new WebSocket('wss://api.caseflow-mobile.com/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token_here'
}));

// Subscribe to case updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'cases',
  userId: 'user_123'
}));
```

### Push Notifications
```http
POST /notifications/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceToken": "fcm_token_here",
  "platform": "ios|android",
  "preferences": {
    "newCases": true,
    "statusUpdates": true,
    "reminders": true
  }
}
```

### Background Sync
```http
POST /sync/upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "cases": [
    {
      "id": "case_123",
      "localChanges": {
        "status": "In Progress",
        "notes": "Updated offline",
        "timestamp": "2024-01-15T14:30:00Z"
      }
    }
  ],
  "attachments": [
    {
      "caseId": "case_123",
      "tempId": "temp_att_1",
      "base64Data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "filename": "verification_photo.jpg"
    }
  ]
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "coordinates.latitude",
        "message": "Latitude must be between -90 and 90"
      }
    ],
    "timestamp": "2024-01-15T14:30:00Z",
    "requestId": "req_123456"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes
- `INVALID_TOKEN` - JWT token is invalid or expired
- `DEVICE_NOT_AUTHORIZED` - Device not registered or approved
- `CASE_NOT_FOUND` - Requested case does not exist
- `ATTACHMENT_TOO_LARGE` - File exceeds 10MB limit
- `INVALID_FILE_TYPE` - Unsupported file format
- `LOCATION_PERMISSION_DENIED` - GPS access not granted
- `NETWORK_ERROR` - Connection timeout or failure
- `VALIDATION_ERROR` - Request data validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

### Limits
- **Authentication**: 5 requests per minute per IP
- **Case Operations**: 100 requests per minute per user
- **File Uploads**: 10 requests per minute per user
- **Location Services**: 50 requests per minute per user

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Pagination

### Request
```http
GET /cases?limit=20&offset=40&sort=updatedAt&order=desc
```

### Response
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Integration Examples

### React Native Integration
```typescript
import { CaseService } from './services/caseService';
import { AttachmentService } from './services/attachmentService';

// Initialize services
const caseService = new CaseService();
const attachmentService = new AttachmentService();

// Fetch cases
const cases = await caseService.getCases();

// Upload attachment
const attachment = await attachmentService.uploadAttachment(
  caseId,
  fileData,
  'Property documents'
);

// Update case status
await caseService.updateCaseStatus(caseId, 'In Progress');
```

### Error Handling Pattern
```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Handle offline scenario
    return await offlineService.getCachedData();
  } else if (error.code === 'INVALID_TOKEN') {
    // Redirect to login
    authService.logout();
  } else {
    // Show user-friendly error
    showErrorMessage(error.message);
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify JWT token is not expired
   - Check device registration status
   - Ensure proper Authorization header format

2. **File Upload Issues**
   - Verify file size is under 10MB
   - Check supported MIME types
   - Ensure stable network connection

3. **Location Services**
   - Verify GPS permissions are granted
   - Check location accuracy settings
   - Ensure Google Maps API key is valid

4. **Offline Sync Problems**
   - Check local storage capacity
   - Verify background sync permissions
   - Monitor network connectivity status

### Support
For technical support, contact: `api-support@caseflow-mobile.com`

**Documentation Version**: 4.0.0
**Last Updated**: January 15, 2024
