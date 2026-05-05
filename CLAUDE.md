# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LTI is a full-stack recruitment/talent-tracking application (React frontend + Express backend + PostgreSQL). The backend follows a Clean Architecture pattern with explicit domain, application, and presentation layers.

## Commands

### Backend (`cd backend` first)

```bash
npm run dev          # Development server with auto-restart (ts-node-dev), port 3010
npm run build        # Compile TypeScript → dist/
npm start            # Run compiled output
npm test             # Run Jest tests
```

### Frontend (`cd frontend` first)

```bash
npm start            # Dev server on port 3000 (Create React App)
npm run build        # Production build
```

### Database

```bash
docker-compose up -d              # Start PostgreSQL 15 container
npx prisma generate               # Regenerate Prisma client after schema changes
npx prisma migrate dev            # Apply migrations (run from backend/)
npx ts-node prisma/seed.ts        # Seed initial data
docker-compose down               # Stop database
```

### Run a single test

```bash
cd backend && npx jest --testPathPattern="<filename>"
```

## Architecture

The backend (`backend/src/`) has four layers:

1. **`routes/`** — Express Router definitions; map HTTP paths to controllers.
2. **`presentation/controllers/`** — Handle req/res, delegate to services.
3. **`application/services/`** — Business logic orchestration (`candidateService.ts`, `fileUploadService.ts`). Input validation lives in `application/validator.ts`.
4. **`domain/models/`** — Prisma-backed domain entities. Each model class wraps Prisma queries directly (no separate repository layer). Key entities: `Candidate`, `Education`, `WorkExperience`, `Resume`, `Position`, `Company`, `Application`, `InterviewFlow`, `InterviewStep`, `Interview`.

**Data flow:** Route → Controller → Service → Domain Model → Prisma → PostgreSQL.

**File uploads:** Handled by `multer`; CV paths and MIME types are stored in the `Resume` model.

**API documentation:** OpenAPI 3.0 spec at `backend/api-spec.yaml`; served live via Swagger UI.

## Key Configuration

- **Environment:** `.env` at repo root sets `DATABASE_URL` and DB credentials. Backend loads it via `dotenv`.
- **Prisma schema:** `backend/prisma/schema.prisma` — single source of truth for all DB models.
- **CORS:** Backend allows only `http://localhost:3000` (frontend dev server).
- **TypeScript:** `target: ES5`, `module: CommonJS`, strict mode enabled, output to `backend/dist/`.
- **Linting/Formatting:** ESLint + Prettier (single quotes, trailing commas everywhere). Run `npx eslint src/` and `npx prettier --check src/`.
- **Testing:** `ts-jest` preset, Node environment. No test files exist yet — Jest is configured but the suite is empty.
