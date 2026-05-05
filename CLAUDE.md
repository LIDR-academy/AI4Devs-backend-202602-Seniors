# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**LTI - Talent Tracking System** is a full-stack recruitment management application. The backend is a Node.js/Express API with TypeScript, and the frontend is a React application. The system tracks candidates, positions, applications, and interview workflows for recruiting processes.

## Architecture

The backend follows a layered architecture pattern:

- **`domain/`**: Business logic and entity models (Candidate, Position, Application, Interview, etc.) — these are your ORM-agnostic domain models, though some currently lean on database interactions
- **`application/`**: Application services (orchestration layer) like `candidateService` that coordinate domain logic and data persistence; also contains validators
- **`presentation/`**: Controllers that handle HTTP requests/responses and delegate to application services
- **`routes/`**: Express route definitions that map HTTP requests to controllers
- **`index.ts`**: Express app setup with middleware (CORS, JSON parsing), route registration, and error handling

**Key data model**:
- Candidates apply to Positions within Companies
- Applications flow through InterviewSteps defined by an InterviewFlow
- Each step records an Interview with an Employee's assessment (score, result, notes)
- Candidates have Education and WorkExperience history; Resumes store uploaded CV files

**Frontend** (React + TypeScript):
- Components are in `frontend/src/components/`
- Services for API calls in `frontend/src/services/`
- Uses React Router for navigation and Bootstrap for styling
- Currently built with Create React App and `react-scripts`

## Development Commands

### Backend

```bash
cd backend

# Development server (watches for changes, rebuilds)
npm run dev

# Production build (TypeScript → JavaScript to dist/)
npm run build

# Run tests (Jest)
npm test

# Run single test file
npm test -- src/path/to/test.ts

# Database commands (from backend dir)
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma migrate dev   # Create and apply a new migration
npx prisma db seed       # Run seed.ts to populate sample data
npx prisma studio       # Open Prisma GUI to inspect/edit data
```

### Frontend

```bash
cd frontend

# Development server (opens http://localhost:3000)
npm start

# Production build to build/
npm run build

# Run tests
npm test
```

### Full Stack

```bash
# From root, start PostgreSQL in Docker
docker-compose up -d

# From root, install all dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# Then in separate terminals:
cd backend && npm run dev    # Runs on :3010
cd frontend && npm start     # Runs on :3000
```

## Database Setup

PostgreSQL runs in Docker via `docker-compose.yml`. Connection string is in the root `.env` (or backend/.env) as `DATABASE_URL`.

After schema changes:
1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev` to create and apply migration
3. Run `npx prisma generate` to regenerate the Prisma client

Default credentials from compose file:
- Host: `localhost:5432`
- User: `postgres` / Password: `password` / Database: `mydatabase`

## Code Patterns & Conventions

**TypeScript strict mode is enabled** — all files use strict type checking.

**Service layer pattern**: Controllers delegate to Application services. For example:
- Request comes to `candidateController`
- Calls `candidateService.addCandidate(data)` which validates and orchestrates saves
- Service uses domain models (e.g., `new Candidate(data)`) that have `.save()` methods
- Errors bubble up (service layer throws, controller catches and returns HTTP response)

**Error handling**: 
- Services throw Error objects with descriptive messages
- Controllers should catch and return appropriate HTTP status codes
- Global error handler in index.ts catches unhandled errors

**API**:
- Runs on port 3010
- CORS enabled only for `http://localhost:3000` (frontend)
- Routes prefixed with `/candidates` for candidate endpoints
- `/upload` for file uploads (multipart/form-data)
- Base URL `/` returns health check message

**File upload**:
- Handled by `fileUploadService` using `multer`
- Uploaded files stored in `uploads/` directory with timestamp-based naming
- Candidate CVs stored as Resume model entries with filePath and fileType

**Styling**: Frontend uses Bootstrap 5 (`react-bootstrap`), not CSS modules or inline styles (mostly).

## Important Notes

- Database URL is hardcoded in `schema.prisma` — ensure it matches your `.env` before running migrations
- The Candidate domain model has `.education`, `.workExperience`, and `.resumes` array properties that are populated in the service layer after the main candidate is saved
- Interview and Application workflows are modeled but may not be fully implemented on the frontend yet
- CORS is strict: only localhost:3000 requests are allowed
