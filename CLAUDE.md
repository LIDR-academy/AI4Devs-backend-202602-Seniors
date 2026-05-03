# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LTI - Talent Tracking System**: Full-stack recruitment management application. Manages candidate profiles, job positions, interviews, and recruitment workflows.

- **Backend**: Node.js + Express + TypeScript (port 3010)
- **Frontend**: React 18 + React Bootstrap + CRA (port 3000)
- **Database**: PostgreSQL via Docker + Prisma ORM
- **Structure**: Monorepo with `/backend` and `/frontend` directories

## Commands

### Backend

```bash
cd backend && npm run dev              # Dev server with auto-restart (ts-node-dev)
cd backend && npm run build            # Compile TypeScript to dist/
cd backend && npm start                # Run compiled JS
cd backend && npm test                 # Run Jest tests
cd backend && npx prisma generate      # Generate Prisma client after schema changes
cd backend && npx prisma migrate deploy # Apply pending migrations
cd backend && npm run seed             # Seed database with sample data
```

### Frontend

```bash
cd frontend && npm start               # Dev server (port 3000)
cd frontend && npm run build           # Production build
cd frontend && npm test                # Run tests (jest --config jest.config.js)
```

### Infrastructure

```bash
docker-compose up -d                   # Start PostgreSQL
docker-compose down                    # Stop PostgreSQL
```

### Full Setup (from scratch)

```bash
# 1. Start database
docker-compose up -d

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Initialize database
cd ../backend
npx prisma generate
npx prisma migrate deploy
npm run seed

# 4. Run backend (port 3010)
npm run dev

# 5. In another terminal, run frontend (port 3000)
cd frontend && npm start
```

## Architecture

### Backend (Layered / DDD-lite)

```
backend/src/
├── index.ts                    # Express app, middleware, CORS (allows localhost:3000)
├── domain/models/              # Entities wrapping Prisma operations (save, findOne)
├── application/
│   ├── services/               # Business logic orchestration
│   │   ├── candidateService.ts # Candidate CRUD with nested entity creation
│   │   └── fileUploadService.ts# Multer config (PDF/DOCX, 10MB limit)
│   └── validator.ts            # Regex-based input validation
├── presentation/controllers/   # HTTP request handlers
└── routes/                     # Express route definitions
```

**Key patterns:**
- Domain models wrap Prisma client (injected via Express middleware into `req.prisma`)
- Service layer validates then delegates to domain models
- File uploads go to `../uploads/` directory
- API spec in `backend/api-spec.yaml` (OpenAPI 3.0.0)

### Database Schema

Central entities: Candidate (with Education, WorkExperience, Resume) -> Application -> Position -> InterviewFlow -> InterviewStep. Interview records track scores/results per step.

Schema defined in `backend/prisma/schema.prisma`. Migrations in `backend/prisma/migrations/`.

### Frontend

Standard CRA structure with `src/components/`, `src/services/` (axios client to backend on port 3010), and React Bootstrap for UI.

## Environment

Required `.env` in project root:
```
DB_PASSWORD=<password>
DB_USER=<user>
DB_NAME=<database>
DB_PORT=5432
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"
```

## Validation Rules

- Phone: Spanish format (starts with 6/7/9, then 8 digits)
- Names: 2-100 chars, letters + Spanish accents
- Dates: YYYY-MM-DD format
- CVs: PDF or DOCX only, max 10MB

## API Endpoints

- `POST /candidates` - Create candidate with nested educations, work experiences, CV
- `GET /candidates/:id` - Get candidate by ID
- `POST /upload` - Upload CV file (multipart/form-data)

## Adding a New Endpoint

Follow these steps in order when creating a new endpoint (use the `candidate` implementation as reference):

### 1. Prisma Schema (`backend/prisma/schema.prisma`)
- Add or update the model definition with fields and relations
- Run `npx prisma migrate dev --name <migration_name>` to generate migration
- Run `npx prisma generate` to update the client

### 2. Domain Model (`backend/src/domain/models/<Entity>.ts`)
- Create a class with typed properties matching the Prisma model
- Constructor accepts `data: any` and maps fields
- Instance method `save()`: uses `prisma.<model>.create()` or `.update()` depending on whether `this.id` exists
- Static method `findOne(id: number)`: uses `prisma.<model>.findUnique()` with relevant `include` relations
- Instantiate PrismaClient at module level: `const prisma = new PrismaClient()`

### 3. Validator (`backend/src/application/validator.ts`)
- Add a new exported `validate<Entity>Data(data: any)` function
- Use existing regex constants (NAME_REGEX, EMAIL_REGEX, PHONE_REGEX, DATE_REGEX) where applicable
- Throw `new Error('Invalid <field>')` for each validation failure
- Validate nested entities in loops if present

### 4. Service (`backend/src/application/services/<entity>Service.ts`)
- Export async functions for each operation (e.g., `addEntity`, `findEntityById`)
- Call the validator first, then instantiate the domain model and call its methods
- Handle Prisma error codes (e.g., `P2002` for unique constraint violations)

### 5. Controller (`backend/src/presentation/controllers/<entity>Controller.ts`)
- Export async handler functions with `(req: Request, res: Response)` signature
- Parse params/body, call the service, return appropriate HTTP status codes
- Pattern: 201 for creation, 200 for retrieval, 400 for validation errors, 404 for not found, 500 for unexpected errors

### 6. Routes (`backend/src/routes/<entity>Routes.ts`)
- Create a `Router()` instance
- Map HTTP methods to controller functions with try/catch wrappers
- Export the router as default

### 7. Register in `backend/src/index.ts`
- Import the routes file
- Add `app.use('/<entity-plural>', entityRoutes)` alongside existing route registrations
