# ACS Backend - CaseFlow Mobile App

A production-ready Node.js backend service for the CaseFlow Mobile App, built with TypeScript, Express, Prisma ORM, MySQL, Redis, and JWT authentication.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Case Management**: Complete CRUD operations with real-time updates
- **File Upload System**: Secure attachment handling with type validation
- **Geolocation Services**: Location capture and reverse geocoding
- **Form Verification**: Residence and office verification workflows
- **Real-time Features**: WebSocket server for live updates
- **Background Jobs**: Redis + BullMQ for async processing
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQL Server (LocalDB/Express or full) with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: JWT tokens
- **File Upload**: Multer with validation
- **WebSocket**: Socket.IO
- **Testing**: Jest with Supertest

## 📋 Prerequisites

- Node.js (v18 or higher)
- SQL Server (Express/LocalDB or Developer edition)
- Redis 7+
- npm or yarn

## 🚀 Quick Start (Local, no Docker)

1. **Clone the repository:**
```bash
git clone https://github.com/acsdeveloper2025/acs-backend.git
cd acs-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Ensure DATABASE_URL points to your local SQL Server (localhost:1433)
# Ensure REDIS_URL is redis://localhost:6379
```

4. **Ensure local services are running:**
- SQL Server listening on localhost:1433 with database acs_backend
- Redis on localhost:6379

5. **Initialize database:**
```bash
npm run db:migrate
npm run db:seed
```

6. **Start the server:**
```bash
npm run dev
# or
npm run build && npm start
```

7. **Access:**
- API: http://localhost:3000
- Health: http://localhost:3000/health

## 🔧 Local Development Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Ensure SQL Server and Redis are installed and running locally (see below).

4. **Run database migrations:**
```bash
npm run db:migrate
```

5. **Seed the database:**
```bash
npm run db:seed
```

6. **Start development server:**
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files (database, redis, logger)
├── controllers/     # Request handlers and business logic
├── middleware/      # Custom middleware (auth, validation, error handling)
├── routes/          # API route definitions
├── services/        # Business logic and external service integrations
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and helpers
├── websocket/       # WebSocket server implementation
├── jobs/            # Background job processors
└── test/            # Test setup and utilities

prisma/
├── schema.prisma    # Database schema definition
├── migrations/      # Database migration files
└── seed.ts          # Database seeding script
```

## 🔑 Default Accounts (After Seeding)

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | System administrator |
| Field | `field001` | `field123` | Field executive |
| Backend | `backend001` | `backend123` | Backend executive |

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database and run migrations |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/device/register` - Register device

### Case Management
- `GET /api/cases` - List cases (with pagination, search, filters)
- `GET /api/cases/:id` - Get case by ID
- `PUT /api/cases/:id/status` - Update case status
- `POST /api/cases/:id/complete` - Submit completed case
- `PUT /api/cases/:id/priority` - Update case priority

### Attachments
- `POST /api/attachments/upload` - Upload file
- `GET /api/attachments/case/:caseId` - List case attachments
- `GET /api/attachments/:id` - Get/download attachment
- `DELETE /api/attachments/:id` - Delete attachment

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile/photo` - Update profile photo
- `GET /api/user/id-card` - Generate digital ID card

### Geolocation
- `POST /api/geolocation/capture/:caseId` - Capture location for case
- `POST /api/geolocation/validate` - Validate location
- `POST /api/geolocation/reverse-geocode` - Reverse geocoding

### Form Verification
- `POST /api/forms/residence-verification` - Submit residence verification
- `POST /api/forms/office-verification` - Submit office verification
- `POST /api/forms/auto-save` - Auto-save form data
- `GET /api/forms/auto-save/:caseId` - Retrieve saved forms

### Notifications
- `POST /api/notifications/register` - Register for push notifications
- `POST /api/notifications/sync` - Background sync for offline changes

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permission levels
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Request data validation
- **File Upload Security**: Type and size restrictions
- **CORS Protection**: Cross-origin request handling
- **Helmet Security**: HTTP security headers

## 🌐 WebSocket Events

### Client to Server
- `subscribe:case` - Subscribe to case updates
- `unsubscribe:case` - Unsubscribe from case updates
- `location:update` - Send real-time location updates
- `case:status` - Update case status
- `case:typing` - Typing indicators for case notes

### Server to Client
- `connected` - Connection confirmation
- `case:updated` - Case data updated
- `location:updated` - Location updated
- `case:status:updated` - Case status changed
- `case:typing:update` - Typing indicator update
- `notification` - Push notification
- `broadcast` - Role-based broadcast message

## 🖥️ Local Services

| Service | Port | Description |
|---------|------|-------------|
| backend | 3000 | Main application server |
| sqlserver | 1433 | SQL Server database |
| redis | 6379 | Redis cache and queue |

## 📊 Database Schema

The application uses the following main entities:
- **Users**: System users with role-based access
- **Cases**: Verification cases with status tracking
- **Clients**: Organizations requesting verifications
- **Products**: Verification products offered
- **Attachments**: File uploads linked to cases
- **Locations**: GPS coordinates for cases
- **Verification Reports**: Detailed verification outcomes
- **Audit Logs**: System activity tracking

## 🚀 Deployment

### Environment Variables
Ensure required variables are set in your local .env:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_URL`
- `GOOGLE_MAPS_API_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

**Built with ❤️ by the ACS Development Team**
