# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LTI (Talent Tracking System) is a full-stack application for managing candidate recruitment and interviews. It uses:
- **Frontend**: React 18 with TypeScript, Bootstrap 5, Create React App
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Architecture**: Layered architecture (presentation → application → domain → infrastructure)

## Quick Start

### Prerequisites
- Node.js installed
- Docker Desktop (for PostgreSQL)
- Database credentials in `.env` file

### Development Setup

```bash
# Start PostgreSQL database
docker-compose up -d

# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev

# Frontend setup (in another terminal)
cd frontend
npm install
```

## Common Development Commands

### Backend (from `backend/` directory)

- **Development mode** (with hot reload): `npm run dev`
- **Build**: `npm run build`
- **Start production build**: `npm run start:prod`
- **Run tests**: `npm test`
- **Generate Prisma client**: `npm run prisma:generate`
- **Run database migrations**: `npx prisma migrate dev`
- **Seed database**: `ts-node prisma/seed.ts`

### Frontend (from `frontend/` directory)

- **Development server**: `npm start` (runs on http://localhost:3000)
- **Build for production**: `npm run build`
- **Run tests**: `npm test`

### Root-level commands

- **Root package.json** includes `dotenv` and Prisma schema reference; database operations typically run from backend directory

## Architecture

### Backend Structure (src/)

- **`presentation/`**: Controllers that handle HTTP requests and responses (e.g., `candidateController.ts`)
- **`application/`**: Business logic and services (e.g., `candidateService.ts`, `fileUploadService.ts`, `validator.ts`)
- **`domain/`**: Domain models with database interaction logic (e.g., `Candidate.ts`, `Application.ts`)
- **`routes/`**: Route definitions for API endpoints
- **`index.ts`**: Express app setup with middleware (CORS, JSON parsing, Prisma injection)

### Key Architectural Patterns

**Request Flow**: Route → Controller → Service → Domain Model → Prisma Client → Database

**Domain Models Pattern**: Each domain model (e.g., Candidate) has:
- Constructor that initializes properties
- `save()` instance method for create/update via Prisma
- Static `findOne()` for queries with related data includes

**Middleware**: Prisma instance is injected into `req.prisma` globally via middleware, allowing access in any handler.

### Frontend Structure (src/)

- **`components/`**: Reusable React components
- **`services/`**: API service calls and utilities
- **`assets/`**: Static files (images, etc.)
- **`App.tsx`**: Main app component (currently minimal, to be populated with routes)

## Database Setup

### Environment Variables

Database connection is configured via `.env` at root:
```
DB_PASSWORD=<password>
DB_USER=<username>
DB_NAME=<database_name>
DB_PORT=5432
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"
```

### Prisma Workflow

1. **Schema**: Defined in `backend/prisma/schema.prisma` (PostgreSQL provider)
2. **Migrations**: `npx prisma migrate dev --name <migration_name>`
3. **Client generation**: `npx prisma generate` (auto-runs on migrate)
4. **Seeding**: `ts-node prisma/seed.ts` (if seed.ts exists)

### Key Models

- **Candidate**: Contains personal info, related educations, work experiences, resumes, applications
- **Application**: Links candidate to position, tracks interview step progress
- **Interview**: Records individual interview results, scores, notes
- **Position**: Job opening with company, interview flow, salary info
- **Employee**: Company staff member who conducts interviews
- **Company**: Organization with employees and positions

## API Endpoints

### Candidates
- `POST /candidates` - Create new candidate (accepts nested educations, workExperiences, cv)
- `GET /candidates/:id` - Get candidate by ID with full relations (educations, work experience, resumes, applications with interview history)
- `PUT /candidates/:applicationId/stage` - Update an application's current interview stage (requires auth + recruiter/hiring_manager role + CANDIDATE_STAGE_UPDATE feature flag)

### Positions
- `GET /positions/:id/candidates` - List all candidates in the interview process for a position (requires auth + recruiter/hiring_manager role)

### File Upload
- `POST /upload` - Upload CV/resume file (handled by multer middleware)

## Important Notes

### Prisma Client Usage

- Instantiated at top of `src/index.ts` and injected into `req.prisma` for global access
- Each domain model imports its own `PrismaClient` instance (separate from the global one in index.ts)
- Error codes like `P2002` (unique constraint) and `P2025` (record not found) are handled in catch blocks

### CORS Configuration

Currently allows requests only from `http://localhost:3000` in development. Update in `src/index.ts` for different origins.

### File Upload

- `fileUploadService.ts` handles multipart form data via multer
- Uploaded files are stored in `uploads/` directory with timestamp-prefixed filenames
- Resume file metadata (filePath, fileType, uploadDate) stored in database

### TypeScript Configuration

- **Backend**: Targets ES5, strict mode enabled, CommonJS modules
- **Frontend**: React app standard configuration
- **Compiler options**: esModuleInterop enabled for library compatibility

### Testing Setup

- **Backend**: Jest configured in `jest.config.js` with ts-jest preset
- **Frontend**: Jest with React Testing Library via Create React App

## Development Workflow

1. **Backend changes**: Modify files in `backend/src/`, changes auto-reload with `npm run dev`
2. **Database changes**: Update `schema.prisma`, run migration, commit both schema and migration files
3. **Frontend changes**: Modify files in `frontend/src/`, hot-reload in browser
4. **API testing**: POST candidate example in README.md; test endpoints via Postman, curl, or similar

## Build and Deployment

- **Backend production**: `npm run build` generates `dist/` directory, then `npm run start:prod` runs compiled JavaScript
- **Frontend production**: `npm run build` creates optimized bundle in `build/` directory
- Both built outputs are ready for containerization or server deployment

## Claude Skills

### enriched-user-stories Skill
**Purpose**: Generate production-ready user stories with explicit linkage to project analysis.

**Status**: Production-Ready (93.7% quality score, Iteration 1)

**When to Use**: 
- Writing feature stories (with discovery research, business case, OKR alignment)
- Documenting bug fixes (with tech debt references, architectural constraints)
- Creating OKR-driven stories (with metric traceability)
- Refactoring vague story drafts

**Skill Location**: `.claude/skills/enriched-user-stories/`

**Key Features**:
- ✅ Mandatory analysis linkage (discovery, ADRs, impact assessments, OKRs) with file paths
- ✅ Testable acceptance criteria (HTTP codes, error messages, exact behaviors)
- ✅ Honest gap-flagging in Definition of Ready (not pretending to have analysis we lack)
- ✅ Complete technical design (NFRs, security, observability, rollout plans)
- ✅ Domain-driven design respecting LTI architecture (Prisma constraints, aggregate boundaries)

**Story Output**:
- Location: `/stories/STORY-XXX-[title-slug].md`
- Includes: Narrative, ACs, Technical Design, Analysis Linkage, DoR/DoD checklists

**Validate Generated Story**:
```bash
cd .claude/skills/enriched-user-stories
python3 scripts/validate_story.py /path/to/STORY-XXX.md
```

**Reference**: See `.claude/skills/enriched-user-stories/README.md` for detailed documentation.

### task-writer Skill
**Purpose**: Decompose enriched user stories into discipline-specific engineering tasks with full coverage and explicit traceability.

**Status**: Production-Ready (100% quality score, Iteration 1)

**When to Use**:
- Breaking enriched user stories into actionable engineering tasks
- Assigning work across Frontend, Backend, Database, QA, DevOps, Security teams
- Validating that story decomposition is technically complete (100% AC coverage)
- Establishing task dependencies and parallel execution tracks
- Transitioning from story planning to sprint execution

**Skill Location**: `.claude/skills/task-writer/`

**Key Features**:
- ✅ Discipline-specific tasks (9 disciplines: Backend, Frontend, Database, API, QA, DevOps, Security, Observability, Documentation)
- ✅ Mandatory task structure (15+ required sections per task: Purpose, Scope, Where, Why, How, Inputs/Outputs, Dependencies, ACs, Tests, NFRs, Risks, DoD)
- ✅ 100% acceptance criteria coverage (coverage matrix proves all ACs mapped to tasks)
- ✅ Correct task dependencies (Database → Backend → Frontend → QA with parallel tracks)
- ✅ Explicit traceability (every task links to parent story and project analysis)
- ✅ Per-discipline output files (separate Markdown file per discipline for team assignment)
- ✅ Configurable validation (basic or deep, with vague language detection)

**Task Output**:
- Location: `/tasks/TASK-STORY-XXX-[DISCIPLINE].md` (one file per discipline)
- Includes: 9 discipline files + coverage matrix + validation report
- Each task includes all mandatory sections with implementation guidance

**Validate Generated Tasks**:
```bash
cd .claude/skills/task-writer
python3 scripts/validate_tasks.py /path/to/TASK-STORY-XXX-*.md --level deep
```

**Usage Example**:
```
Create enriched tasks for this user story:
Input: /stories/STORY-042-multiple-resume-uploads.md
Project context: /CLAUDE.md
Validation level: deep
Output format: separate files per discipline
```

**Reference**: See `.claude/skills/task-writer/README.md` for detailed documentation and examples.

### source-project-documentation Skill
**Purpose**: Auto-generate comprehensive technical documentation with Mermaid diagrams for any source project.

**Status**: Production-Ready (100% quality score, Iteration 1)

**When to Use**:
- Documenting an unfamiliar codebase for team onboarding
- Generating architecture diagrams from source code (avoid manual Visio/Lucidchart)
- Creating ER diagrams from database schema files (Prisma, SQL, Mongoose)
- Mapping technology stack and dependencies
- Building comprehensive documentation that reflects current code state

**Skill Location**: `.claude/skills/source-project-documentation/`

**Key Features**:
- ✅ Automatic project type detection (frontend-only, backend-only, full-stack)
- ✅ Technology stack analysis with version detection (React, Express, PostgreSQL, etc.)
- ✅ Architecture diagrams with Mermaid (4-7 diagrams per project)
- ✅ Database ER diagram generation from Prisma/SQL/Mongoose schemas
- ✅ API endpoint documentation (30+ endpoints for full-stack projects)
- ✅ Complete request flow and data flow diagrams
- ✅ Security, deployment, and cross-cutting concerns documented
- ✅ 8-14 markdown files generated per project (README, ARCHITECTURE, TECH_STACK, DATABASE, FRONTEND, BACKEND, API, DEPLOYMENT, etc.)

**Documentation Output**:
- Location: `/documentation/` (configurable)
- Includes: 8-14 markdown files with professional formatting
- Contains: 4-7 Mermaid diagrams, 50+ code examples, 10-30 API endpoints documented
- Quality: 95-100% (production-ready)

**Validate Generated Documentation**:
```bash
cd .claude/skills/source-project-documentation
python3 scripts/validate_docs.py /path/to/project --output /path/to/documentation
```

**Usage Example**:
```
Generate technical documentation for this project:
Project path: /path/to/my-project
Output directory: /documentation
Include diagrams: Mermaid (architecture, ER, sequence diagrams)
```

**Reference**: See `.claude/skills/source-project-documentation/README.md` for detailed documentation.

## Useful Paths

- Backend source: `backend/src/`
- Database schema: `backend/prisma/schema.prisma`
- Database migrations: `backend/prisma/migrations/`
- Frontend components: `frontend/src/components/`
- Frontend services: `frontend/src/services/`
- Environment config: `.env` (root level)
- Docker config: `docker-compose.yml`
- Skills directory: `.claude/skills/`
- Stories directory: `/stories/` (for generated enriched user stories)
- Tasks directory: `/tasks/` (for generated enriched tasks per story)
