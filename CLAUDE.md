# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LTI is a full-stack recruitment/talent tracking system. Backend is Express + TypeScript on port 3010; frontend is React + TypeScript on port 3000. Database is PostgreSQL managed via Prisma ORM.

## Setup

```bash
# Install dependencies
cd frontend && npm install && cd ../backend && npm install

# Start PostgreSQL (Docker)
docker-compose up -d

# Initialize database
cd backend && npx prisma generate && npx prisma migrate dev && npx ts-node prisma/seed.ts

# Build backend
npm run build
```

## Common Commands

### Backend (`cd backend`)
```bash
npm run dev          # Development with hot reload (ts-node-dev)
npm run build        # Compile TypeScript → dist/
npm start            # Run production build
npm test             # Run Jest tests
npx prisma migrate dev   # Apply migrations
npx prisma generate      # Regenerate Prisma client
```

### Frontend (`cd frontend`)
```bash
npm start    # Dev server on port 3000
npm run build
npm test
```

### Root
```bash
docker-compose up -d    # Start PostgreSQL
docker-compose down     # Stop PostgreSQL
```

## Architecture

The backend follows a clean 4-layer architecture:

**Presentation** (`src/presentation/controllers/`) → HTTP handlers, response formatting  
**Application** (`src/application/services/`) → Business orchestration, validation (`validator.ts`), file upload with Multer  
**Domain** (`src/domain/models/`) → 12 domain classes; each wraps Prisma calls with `save()` and `findOne()` methods  
**Infrastructure** → Prisma + PostgreSQL, disk-based file storage at `../uploads/`

Entry point: `backend/src/index.ts` — registers middleware (JSON, CORS to `localhost:3000`, Prisma injection as `req.prisma`), mounts routes (`/candidates`, `/upload`).

## Key Domain Models

Core entities: `Candidate`, `Education`, `WorkExperience`, `Resume`, `Application`, `Position`, `Company`, `Employee`, `Interview`, `InterviewFlow`, `InterviewStep`, `InterviewType`. Schema defined in `backend/prisma/schema.prisma`.

## API Endpoints

Defined in `backend/src/routes/candidateRoutes.ts` and documented in `backend/api-spec.yaml`:

- `POST /candidates` — create candidate with educations, workExperiences, CV reference
- `GET /candidates/:id` — retrieve candidate with full relations
- `POST /upload` — upload PDF/DOCX (max 10MB)

## Validation Rules

Defined in `backend/src/application/validator.ts`:
- Names: 2–100 chars, Spanish characters allowed
- Phone: Spanish format (starts with 6, 7, or 9, then 8 digits)
- Dates: `YYYY-MM-DD`
- Files: PDF or DOCX only, 10 MB limit

## Environment

Credentials live in `.env` at the repo root. `DATABASE_URL` must point to the Docker PostgreSQL instance (`localhost:5432`, database `LTIdb`).

## Testing

Jest is configured in `backend/jest.config.js` with `ts-jest`. Test files go in `backend/src/tests/`. Run a single test file:

```bash
cd backend && npx jest src/tests/myTest.test.ts
```
