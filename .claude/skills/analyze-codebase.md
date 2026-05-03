---
name: analyze-codebase
description: Walks the repo (honouring .gitignore), detects business purpose, and emits or refreshes AGENTS.md at the repo root. Triggered by /analyze-codebase or bootstrap command.
---

# Skill: analyze-codebase

## Steps

1. Read `.gitignore` at the repo root. Build an exclusion list. Never read or list paths matching those patterns (e.g. `node_modules/`, `dist/`, `.env`, `prompts/`).

2. Detect business purpose:
   - Read `README.md` (repo root)
   - Read `backend/prisma/schema.prisma` — note model names and relations

3. Collect the following facts:
   - Top-level directories (one level deep, excluding `.gitignore` matches)
   - Backend layers: directories under `backend/src/`
   - Backend services: filenames in `backend/src/application/services/`
   - Backend controllers: filenames in `backend/src/presentation/controllers/`
   - Backend routes: read each `*Routes.ts` and list HTTP method + path
   - Frontend components: filenames in `frontend/src/components/`
   - Tooling: `backend/package.json` → `scripts`, `devDependencies` (test, lint, build keys)
   - Docker: `docker-compose.yml` → service names and ports

4. Write `AGENTS.md` at the repo root using the template below. Overwrite if it exists.

## AGENTS.md Template

```markdown
# AGENTS.md — LTI Talent Tracking System

## Business Purpose
<One paragraph from README.md + schema inference>

## Top-Level Folder Map

| Path | Purpose |
|---|---|
| `backend/` | Express + TypeScript API server |
| `frontend/` | React SPA |
| `docker-compose.yml` | PostgreSQL service |
| ... | ... |

## Backend Architecture

Layers under `backend/src/`:

| Layer | Path | Purpose |
|---|---|---|
| Domain | `domain/models/` | Business entities (Prisma-backed) |
| Application | `application/services/` | Orchestration + validation |
| Infrastructure | `infrastructure/repositories/` | Prisma repository implementations |
| Presentation | `presentation/controllers/` | HTTP request/response mapping |
| Routes | `routes/` | Express Router definitions |
| Tests | `tests/` | Jest integration + unit tests |

### API Endpoints
| Method | Path | Handler |
|---|---|---|
| ... | ... | ... |

## Frontend Architecture

React SPA (`frontend/src/`):
- **Components**: AddCandidateForm, FileUploader, RecruiterDashboard
- **Services**: candidateService (REST calls to backend)
- **Styling**: Bootstrap 5 + react-bootstrap

## Tooling

| Tool | Command |
|---|---|
| Run backend (dev) | `cd backend && npm run dev` |
| Run frontend (dev) | `cd frontend && npm start` |
| Run tests | `cd backend && npm test` |
| Lint | `cd backend && npm run lint` |
| DB migrate | `cd backend && npx prisma migrate dev` |

## Running Locally

```bash
cp .env.example .env          # set DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
docker-compose up -d          # start PostgreSQL
cd backend && npm install && npx prisma migrate deploy && npm run dev
cd frontend && npm install && npm start
```
```
