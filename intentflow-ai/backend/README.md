# IntentFlow AI Backend

Production-ready Node.js/Express backend for IntentFlow AI productivity application.

## Features

- **Natural Language Processing** - AI-powered task extraction from natural language
- **Human-in-the-Loop (HITL)** - Confidence-based task approval workflow
- **Automation Platform** - Integration with n8n automation
- **Google Calendar Integration** - Calendar event management
- **Task Management** - Full CRUD operations with smart categorization

## Tech Stack

- **Node.js 20** with Express.js
- **Supabase** for PostgreSQL database and authentication
- **Google Gemini AI** for NLP
- **Winston** for structured logging
- **Jest** for testing
- **Docker** for containerization

## Prerequisites

- Node.js >= 20
- npm >= 10
- Supabase account and project
- Google Gemini API key

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SECRET_KEY` - Supabase service role key
- `GEMINI_API_KEY` - Google Gemini API key

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with coverage
npm test -- --coverage
```

## Code Quality

```bash
# Lint code
npm run lint

# Fix lint errors
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Docker

### Build Image

```bash
docker build -t intentflow-backend .
```

### Run Container

```bash
docker run -p 3000:3000 --env-file .env intentflow-backend
```

### Docker Compose

```bash
docker-compose up -d
```

## API Documentation

API documentation available at `/api/docs` when running the server.

## Health Endpoints

- `GET /health` - Full health check (DB, memory, uptime)
- `GET /health/ready` - Readiness probe for Kubernetes
- `GET /health/live` - Liveness probe for Kubernetes

## Project Structure

```
src/
├── api/              # API route handlers
│   ├── auth/         # Authentication routes
│   ├── calendar/     # Calendar integration
│   ├── health/       # Health check endpoints
│   ├── hitl/         # HITL workflow endpoints
│   ├── nlp/          # NLP processing endpoints
│   ├── tasks/        # Task management
│   └── users/        # User management
├── config/           # Configuration files
├── middleware/       # Express middleware
├── repositories/     # Database repositories
├── services/         # Business logic
├── utils/            # Utility functions
├── docs/             # API documentation
├── app.js            # Express app setup
└── server.js         # Server entry point
```

## Security Features

- **Helmet** - Security headers (CSP, XSS protection, etc.)
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - IP-based request limiting
- **Input Sanitization** - XSS and NoSQL injection protection
- **Compression** - Gzip compression for responses

## Monitoring

- **Structured Logging** - JSON logs with Winston
- **Request Tracing** - UUID for each request
- **Health Checks** - Database, memory, and uptime monitoring

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Supabase anon key | - |
| `SUPABASE_SECRET_KEY` | Supabase service key | - |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `GEMINI_MODEL` | Gemini model | gemini-1.5-flash |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:8081 |

## License

MIT