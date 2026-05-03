# AGENTS.md — LTI Talent Tracking System

## Business Purpose

LTI is a full-stack Applicant Tracking System (ATS) that enables recruiters to manage candidates, job positions, and interview pipelines. It stores candidate profiles (education, work experience, resumes), tracks applications through configurable interview flows, records interview results and scores, and provides a recruiter dashboard for visibility across the hiring pipeline.

---

## Top-Level Folder Map

| Path | Purpose |
|---|---|
| `backend/` | Express + TypeScript API server (port 3010) |
| `frontend/` | React 18 SPA (port 3000) |
| `openspec/` | Spec-driven development artifacts (proposals, designs, archive) |
| `.claude/` | AI agent, skill, and command definitions |
| `docker-compose.yml` | PostgreSQL 14+ service |
| `backend/prisma/` | Prisma schema + migrations |
| `prompts/` | (gitignored) Orchestrator prompts |

---

## Backend Architecture

Layers under `backend/src/`:

| Layer | Path | Purpose |
|---|---|---|
| Domain | `domain/models/` | Business entities backed by PrismaClient |
| Application | `application/services/` | Orchestration, validation, use-cases |
| Infrastructure | `infrastructure/repositories/` | Prisma repository implementations (hexagonal ports) |
| Presentation | `presentation/controllers/` | HTTP request/response mapping |
| Routes | `routes/` | Express Router definitions |
| Tests | `tests/` | Jest integration + unit tests |

### Domain Models

| Model | Key Fields |
|---|---|
| `Candidate` | id, firstName, lastName, email, phone, address |
| `Application` | id, positionId, candidateId, currentInterviewStep, notes |
| `Interview` | id, applicationId, interviewStepId, employeeId, score, result |
| `InterviewStep` | id, interviewFlowId, interviewTypeId, name, orderIndex |
| `InterviewFlow` | id, description |
| `Position` | id, companyId, interviewFlowId, title, status |
| `Company` | id, name |
| `Employee` | id, companyId, name, email, role, isActive |
| `Education` | id, candidateId, institution, title, startDate, endDate |
| `WorkExperience` | id, candidateId, company, position, startDate, endDate |
| `Resume` | id, candidateId, filePath, fileType |

### Existing API Endpoints

| Method | Path | Handler | Layer |
|---|---|---|---|
| GET | `/` | inline | index.ts |
| POST | `/candidates` | addCandidateController | candidateController |
| GET | `/candidates/:id` | getCandidateById | candidateController |
| POST | `/upload` | uploadFile | fileUploadService |
| GET | `/api/v1/positions/:id/candidates` | getPositionCandidates | positionController |
| PUT | `/api/v1/candidates/:id/stage` | updateCandidateStage | applicationController |

### Key Services

- `candidateService.ts` — creates candidate with related education, work experience, and resume
- `fileUploadService.ts` — handles PDF/DOCX uploads via Multer (max 10 MB)
- `validator.ts` — regex-based input validation

---

## Frontend Architecture

React 18 SPA under `frontend/src/`:

| Component | Purpose |
|---|---|
| `RecruiterDashboard.js` | Main dashboard; lists positions and candidates |
| `AddCandidateForm.js` | Form to create a new candidate with education and experience |
| `FileUploader.js` | Uploads CV files to the `/upload` endpoint |

**Services**: `candidateService.js` — REST calls to the backend API.  
**Styling**: Bootstrap 5 + react-bootstrap.  
**Routing**: React Router v6.

---

## Tooling

| Tool | Command |
|---|---|
| Run backend (dev) | `cd backend && npm run dev` |
| Run frontend (dev) | `cd frontend && npm start` |
| Run backend tests | `cd backend && npm test` |
| Lint backend | `cd backend && npm run lint` |
| Format | `cd backend && npm run format` |
| Build backend | `cd backend && npm run build` |
| DB migrate (dev) | `cd backend && npx prisma migrate dev` |
| DB migrate (deploy) | `cd backend && npx prisma migrate deploy` |
| Regenerate client | `cd backend && npx prisma generate` |

---

## Running Locally

```bash
# 1. Copy and configure environment
cp .env.example .env
# Set: DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DATABASE_URL

# 2. Start PostgreSQL
docker-compose up -d

# 3. Start backend
cd backend
npm install
npx prisma migrate deploy
npm run dev          # listens on http://localhost:3010

# 4. Start frontend (separate terminal)
cd frontend
npm install
npm start            # opens http://localhost:3000

# 5. Run tests
cd backend && npm test
```

---

## Design Patterns in Use

| Pattern | Location | Applied to |
|---|---|---|
| Repository + CQRS read model | `infrastructure/repositories/PositionRepository.ts` | `GET /api/v1/positions/:id/candidates` |
| Repository + Result/Either | `infrastructure/repositories/ApplicationRepository.ts` | `PUT /api/v1/candidates/:id/stage` |
