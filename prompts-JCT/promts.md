# Prompts — JCT

---

## 1. Generate Full Project Documentation

**Role**: Senior Technical Writer + Full-Stack Engineer

**Objective**: Analyze the current codebase and produce comprehensive, accurate project documentation. Use only code that follows best practices as the reference source. Skip or explicitly exclude files/patterns that violate architecture or quality standards.

**Context**:
- Stack: TypeScript, Node.js, Express, Prisma ORM, PostgreSQL, React (frontend)
- Architecture target: Hexagonal Architecture (Ports & Adapters) with DDD-aligned domain layer
- The codebase is mixed quality — some files follow best practices, others do not
- Documentation must reflect the intended/correct architecture, not accidental inconsistencies
- Output directory: `docs/` (create if not exists)

**Pre-Analysis Step** (do this before writing any doc):
1. Read the entire project structure (`backend/src/`, `frontend/src/`, `prisma/schema.prisma`)
2. Identify which files follow best practices (proper layer separation, no Prisma in domain, thin controllers, typed interfaces, etc.)
3. Use ONLY those files as reference for documenting patterns and architecture
4. Note any files that deviate — do NOT document their patterns as "how the project works"

**Required Documents** (one file per section inside `docs/`):

### `docs/architecture.md`
- Overall architectural pattern (Hexagonal / Ports & Adapters)
- Layer diagram (text-based): Presentation → Application → Domain ← Infrastructure
- Dependency rules: what each layer can and cannot import
- How Express, Prisma, and domain entities relate to each layer
- Real file path examples from the codebase for each layer

### `docs/project-structure.md`
- Full directory hierarchy (backend + frontend + root config)
- Purpose of each top-level folder and key subdirectories
- Naming conventions observed in best-practice files
- Where to place new features (endpoint, service, repository, domain entity)

### `docs/backend.md`
- Express app entry point and middleware chain
- Route registration pattern
- Controller/handler responsibilities (what belongs here, what does not)
- Service layer: purpose, injection pattern
- Repository pattern: interface definition location, Prisma implementation location
- Error handling strategy
- Input validation approach
- Representative code snippets from best-practice files only

### `docs/frontend.md`
- React app structure (pages, components, services/api layer)
- How frontend calls backend API (fetch/axios, base URL config)
- State management approach (if any)
- Folder conventions
- Representative code snippets from best-practice files only

### `docs/database.md`
- Prisma schema overview: all models, fields, relations
- Entity-Relationship diagram (text/Mermaid format)
- Naming conventions in schema
- How Prisma models map to domain entities (and where that mapping lives)
- Migration strategy (how to run, where migrations live)
- Seed data (if exists)

**Constraints**:
- Do NOT document anti-patterns as if they are the project standard
- Do NOT invent architecture not present in the best-practice files
- Do NOT copy-paste large code blocks — use short, illustrative snippets (max 20 lines)
- Do NOT create a single monolithic doc — one file per section above
- Mermaid diagrams preferred for ERM and layer diagrams where supported
- All docs in English, Markdown format

**Quality Bar for "Best Practice" files** (use as filter):
- Domain layer files: zero imports from `@prisma/client`, Express, or `multer`
- Service files: depend on repository interfaces, not Prisma directly
- Route handlers: ≤15 lines, delegate to service, no business logic
- TypeScript: no untyped `any`, explicit return types on public functions

**Expected Output**:
```
docs/
  architecture.md
  project-structure.md
  backend.md
  frontend.md
  database.md
```

**Acceptance Criteria**:
- [ ] Each doc exists and is non-empty
- [ ] ERM in `database.md` covers all Prisma models and their relations
- [ ] Architecture doc includes actual file paths as examples
- [ ] No anti-pattern code appears as a "this is how we do it" example
- [ ] All Mermaid diagrams render without syntax errors

---

## 2. New Endpoint — GET /positions/:id/candidates

**Agent**: FullStack Expert (`@.ai-context/agents/fullstack-expert.agent.md`)

**Reference docs** (read before implementing):
- `docs/architecture.md` — layer rules and dependency constraints
- `docs/backend.md` — controller, service, and error-handling patterns
- `docs/database.md` — full schema, relations, and ERM

---

**Objective**: Implement `GET /positions/:id/candidates` — returns all candidates currently in the hiring process for a given position, with their stage and performance summary.

---

**Context**:

Relevant Prisma models and their relations:

```
Position (id) ──< Application (positionId)
Application ──> Candidate      (candidateId  → firstName, lastName)
Application ──> InterviewStep  (currentInterviewStep → name)
Application ──< Interview      (applicationId → score Int?)
```

The endpoint must aggregate: for each Application of the given positionId, return the candidate's full name, the name of the interview step they are currently at, and the arithmetic mean of all `Interview.score` values recorded for that application (null scores excluded).

Expected response shape:
```json
[
  {
    "fullName": "Jane Doe",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 8.5
  },
  {
    "fullName": "John Smith",
    "currentInterviewStep": "HR Interview",
    "averageScore": null
  }
]
```
`averageScore` is `null` when no interviews with a score exist yet.

---

**Requirements**:

### 1. Route
- Add `GET /:id/candidates` to `backend/src/routes/candidateRoutes.ts` (or create `positionRoutes.ts` if the resource warrants its own file — follow naming convention in `docs/project-structure.md`)
- Register the new router in `backend/src/index.ts` under `/positions`

### 2. Controller
- Create `backend/src/presentation/controllers/positionController.ts`
- Handler: parse `req.params.id` as integer, return 400 on `isNaN`
- Delegate to service; return 404 if position does not exist
- Return 200 with the candidates array
- Follow the thin-controller pattern from `docs/backend.md`

### 3. Service
- Create or extend `backend/src/application/services/positionService.ts`
- Function signature: `getCandidatesForPosition(positionId: number): Promise<PositionCandidateDTO[]>`
- Define `PositionCandidateDTO` type: `{ fullName: string; currentInterviewStep: string; averageScore: number | null }`
- Single Prisma query using `include` — no N+1 (see constraint below)
- Compute `averageScore` in the service layer: filter null scores, return `null` if no scores exist
- Return empty array (not 404) when position exists but has no applications

### 4. Prisma Query Strategy
Use a single `prisma.application.findMany` with nested `include`:
```typescript
prisma.application.findMany({
  where: { positionId },
  include: {
    candidate:     { select: { firstName: true, lastName: true } },
    interviewStep: { select: { name: true } },
    interviews:    { select: { score: true } },
  },
})
```
Map in service: `fullName = candidate.firstName + ' ' + candidate.lastName`, `averageScore` = mean of non-null `interviews[].score`.

---

**Constraints**:
- One Prisma query total — no per-application queries in a loop
- No `@prisma/client` import in domain layer or controller
- No business logic (score averaging) in the controller or route handler
- `PositionCandidateDTO` must be a named TypeScript type, not `any`
- Do not modify existing endpoints or their response shapes
- Follow error-handling table in `docs/backend.md` exactly (400 / 404 / 500)

---

**Expected Output**:

| File | Action |
|------|--------|
| `backend/src/routes/positionRoutes.ts` | Create — registers GET `/:id/candidates` |
| `backend/src/presentation/controllers/positionController.ts` | Create — thin HTTP handler |
| `backend/src/application/services/positionService.ts` | Create — query + DTO mapping + score averaging |
| `backend/src/index.ts` | Edit — mount `positionRoutes` at `/positions` |

---

**Acceptance Criteria**:
- [ ] `GET /positions/1/candidates` returns 200 with correct array shape
- [ ] `GET /positions/999/candidates` returns 404 (position not found)
- [ ] `GET /positions/abc/candidates` returns 400 (`Invalid ID format`)
- [ ] Position with no applications returns 200 with `[]`
- [ ] `averageScore` is `null` when no interview scores exist
- [ ] `averageScore` correctly ignores null scores and averages only numeric ones
- [ ] Single DB query — no N+1
- [ ] TypeScript compiles without errors
- [ ] No `any` types in new files

---

## 3. New Endpoint — PUT /candidates/:id/stage

**Agent**: FullStack Expert (`@.ai-context/agents/fullstack-expert.agent.md`)

**Reference docs** (read before implementing):
- `docs/architecture.md` — layer rules and dependency constraints
- `docs/backend.md` — controller, service, validation, and error-handling patterns
- `docs/database.md` — Application model fields and relations

---

**Objective**: Implement `PUT /candidates/:id/stage` — updates the `currentInterviewStep` field on a specific `Application`, moving a candidate to a new phase in the interview process.

---

**Context**:

A `Candidate` can have multiple `Application` records (one per `Position`). The request must identify both which candidate and which of their applications to update, plus the target step:

```
Candidate (id) ──< Application (candidateId, currentInterviewStep)
InterviewStep  (id) ←── Application.currentInterviewStep FK
```

Relevant Prisma models:
```prisma
model Application {
  id                   Int           @id
  candidateId          Int
  currentInterviewStep Int           // FK → InterviewStep.id
  candidate            Candidate     @relation(...)
  interviewStep        InterviewStep @relation(...)
}

model InterviewStep {
  id    Int    @id
  name  String
  orderIndex Int
  interviewFlowId Int
}
```

Request body:
```json
{
  "applicationId": 4,
  "currentInterviewStep": 3
}
```

Expected response on success (`200`):
```json
{
  "id": 4,
  "candidateId": 1,
  "currentInterviewStep": 3
}
```

---

**Validation chain** (in this exact order — fail fast):

| # | Check | Error |
|---|-------|-------|
| 1 | `req.params.id` is a valid integer | 400 `Invalid candidate ID format` |
| 2 | `req.body.applicationId` is present and a valid integer | 400 `Invalid or missing applicationId` |
| 3 | `req.body.currentInterviewStep` is present and a valid integer | 400 `Invalid or missing currentInterviewStep` |
| 4 | Candidate with that `id` exists | 404 `Candidate not found` |
| 5 | Application with `applicationId` exists **and** its `candidateId` matches `:id` | 404 `Application not found for this candidate` |
| 6 | InterviewStep with `currentInterviewStep` exists | 400 `Invalid interview step` |

---

**Requirements**:

### 1. Route
- Add `PUT /:id/stage` to `backend/src/routes/candidateRoutes.ts`
- No new route file needed — this belongs with the candidate resource

### 2. Controller
- Add `updateCandidateStage` handler to `backend/src/presentation/controllers/candidateController.ts`
- Perform validations 1–3 (input shape) in the controller
- Delegate to service for validations 4–6 and the update
- Follow thin-controller pattern: no Prisma, no business logic

### 3. Service
- Add `updateCandidateStage(candidateId: number, applicationId: number, interviewStepId: number)` to `backend/src/application/services/candidateService.ts`
- Run validations 4–6 here; throw typed `Error` messages the controller can map to HTTP status
- Use a single `prisma.application.update` for the write — do not fetch-then-update unnecessarily
- Define return type: `Promise<{ id: number; candidateId: number; currentInterviewStep: number }>`

### 4. Prisma Strategy
Verify ownership in one query before updating:
```typescript
const application = await prisma.application.findFirst({
  where: { id: applicationId, candidateId },
});
if (!application) throw new Error('Application not found for this candidate');
```
Then validate step exists:
```typescript
const step = await prisma.interviewStep.findUnique({ where: { id: interviewStepId } });
if (!step) throw new Error('Invalid interview step');
```
Then update:
```typescript
return prisma.application.update({
  where: { id: applicationId },
  data: { currentInterviewStep: interviewStepId },
  select: { id: true, candidateId: true, currentInterviewStep: true },
});
```

---

**Constraints**:
- No `@prisma/client` in controller
- No business logic (ownership check, step validation) in controller or route
- Error messages thrown by service must be the exact strings the controller checks to map 400 vs 404
- Do not modify existing `addCandidate` or `findCandidateById` behaviour
- No `any` types in new code
- `PUT` semantics: only `currentInterviewStep` changes — do not touch other Application fields

---

**Expected Output**:

| File | Action |
|------|--------|
| `backend/src/routes/candidateRoutes.ts` | Edit — add `PUT /:id/stage` |
| `backend/src/presentation/controllers/candidateController.ts` | Edit — add `updateCandidateStage` handler |
| `backend/src/application/services/candidateService.ts` | Edit — add `updateCandidateStage` function |

No new files required.

---

**Acceptance Criteria**:
- [ ] `PUT /candidates/1/stage` with valid body returns 200 with updated application fields
- [ ] `PUT /candidates/abc/stage` returns 400 `Invalid candidate ID format`
- [ ] Missing `applicationId` in body returns 400
- [ ] Missing `currentInterviewStep` in body returns 400
- [ ] Valid IDs but candidate does not exist → 404 `Candidate not found`
- [ ] `applicationId` exists but belongs to a different candidate → 404 `Application not found for this candidate`
- [ ] `currentInterviewStep` does not exist as an InterviewStep → 400 `Invalid interview step`
- [ ] Only `currentInterviewStep` is modified — all other Application fields unchanged
- [ ] TypeScript compiles without errors
- [ ] No `any` types in modified or new code

---

## 4. Fix Database — Connection String + Seed Data

**Agent**: FullStack Expert (`@.ai-context/agents/fullstack-expert.agent.md`)

**Reference docs**:
- `docs/database.md` — full schema, all models and relations
- `docs/project-structure.md` — where to place new files

---

**Objective**: Fix two database issues that prevent the project from running correctly: a hardcoded connection string in `schema.prisma`, and the absence of seed data needed to test the Kanban endpoints.

---

### Issue 1 — Hardcoded Connection String

**Current state** (`backend/prisma/schema.prisma`):
```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://LTIdbUser:D1ymf8wyQEGthFR1E9xhCq@localhost:5432/LTIdb"
}
```

**Problem**: credentials committed to source, not configurable per environment.

**Fix**: replace with env var — `.env` already defines `DATABASE_URL`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Files to change**:
| File | Action |
|------|--------|
| `backend/prisma/schema.prisma` | Replace hardcoded URL with `env("DATABASE_URL")` |
| `.env.example` | Create with `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB` as placeholder |

Do NOT modify `.env` — `DATABASE_URL` is already defined there correctly.

---

### Issue 2 — Seed Data

**Problem**: DB is empty — all Kanban endpoints return `[]` or 404.

**Goal**: create realistic data that lets a developer verify all three Kanban endpoints immediately after running the seed.

#### Seed file location

`backend/prisma/seed.ts`

#### Register seed in `backend/package.json`

Add a `prisma` key:
```json
"prisma": {
  "seed": "ts-node --transpile-only prisma/seed.ts"
}
```

#### Seed dataset (implement exactly this)

**InterviewTypes** (4):
| id | name |
|----|------|
| 1 | HR Screen |
| 2 | Technical Screen |
| 3 | Technical Interview |
| 4 | Final Interview |

**InterviewFlow** (1): `"Standard Engineering Flow"`

**InterviewSteps** (4, ordered, all in the flow above):
| orderIndex | name | interviewType |
|------------|------|---------------|
| 1 | HR Screen | HR Screen |
| 2 | Technical Screen | Technical Screen |
| 3 | Technical Interview | Technical Interview |
| 4 | Final Interview | Final Interview |

**Company** (1): `LTI`

**Employee** (1): Sarah Johnson, `sarah@lti.com`, role `HR Manager`, `isActive: true`

**Position** (1): `Senior Backend Engineer` at LTI, using the flow above, `status: "Open"`, `isVisible: true`, `location: "Remote"`, `jobDescription: "Backend role"`, `salaryMin: 50000`, `salaryMax: 80000`

**Candidates** (4):
| firstName | lastName | email |
|-----------|----------|-------|
| John | Doe | john.doe@email.com |
| Jane | Smith | jane.smith@email.com |
| Carlos | García | carlos.garcia@email.com |
| María | López | maria.lopez@email.com |

**Applications** (4 — one per candidate, all for the position above):
| Candidate | currentInterviewStep |
|-----------|----------------------|
| John Doe | Step 1 — HR Screen |
| Jane Smith | Step 2 — Technical Screen |
| Carlos García | Step 3 — Technical Interview |
| María López | Step 4 — Final Interview |

**Interviews** (give scores to all except John, to test null averageScore):
| Application | interviewStep | employee | score | result |
|-------------|---------------|----------|-------|--------|
| Jane Smith | Step 1 | Sarah | 7 | Passed |
| Carlos García | Step 1 | Sarah | 8 | Passed |
| Carlos García | Step 2 | Sarah | 9 | Passed |
| María López | Step 1 | Sarah | 8 | Passed |
| María López | Step 2 | Sarah | 9 | Passed |
| María López | Step 3 | Sarah | 10 | Passed |

Expected `averageScore` after seed: John `null`, Jane `7.0`, Carlos `8.5`, María `9.0`.

#### Seed implementation pattern

Use `upsert` or `deleteMany` + `create` at the top to make the seed idempotent (safe to re-run):
```typescript
await prisma.interview.deleteMany();
await prisma.application.deleteMany();
// ... clear all tables in reverse FK order before inserting
```

---

**Constraints**:
- Do NOT use `createMany` with `skipDuplicates` — use `deleteMany` + `create` for clarity
- Seed must be idempotent — running it twice must not fail or duplicate data
- All FK references must use the IDs returned from prior `create` calls, not hardcoded integers
- No `any` types in seed script
- Do not modify existing migrations

---

**Expected Output**:
| File | Action |
|------|--------|
| `backend/prisma/schema.prisma` | Edit — one line change (`url`) |
| `.env.example` | Create — placeholder `DATABASE_URL` |
| `backend/prisma/seed.ts` | Create — full idempotent seed |
| `backend/package.json` | Edit — add `prisma.seed` key |

---

**How to run after implementation**:
```bash
# From repo root
docker-compose up -d

# From backend/
npx prisma migrate dev   # only if schema changed
npx prisma db seed
npm run dev
```

**Acceptance Criteria**:
- [ ] `schema.prisma` uses `env("DATABASE_URL")` — no hardcoded credentials
- [ ] `.env.example` exists with placeholder (no real credentials)
- [ ] `npx prisma db seed` runs without errors
- [ ] Running seed twice does not fail or duplicate rows
- [ ] `GET /positions/1/candidates` returns 4 candidates with correct steps and scores
- [ ] `GET /positions/1/interviewSteps` returns 4 steps in `orderIndex` order
- [ ] John Doe has `averageScore: null`
- [ ] María López has `averageScore: 9.0`

---

## 5. Tests — New Endpoints

**Agent**: FullStack Expert (`@.ai-context/agents/fullstack-expert.agent.md`)

**Reference docs**:
- `docs/backend.md` — error-handling table, HTTP status conventions
- `docs/database.md` — model shapes used in assertions

---

**Objective**: Write a complete test suite for the three new endpoints and their service functions. Two layers: unit tests (service logic, Prisma mocked) and integration tests (HTTP layer, service mocked).

---

**Context**:

Test framework already installed: Jest + ts-jest (`jest.config.js` uses `preset: 'ts-jest'`, `testEnvironment: 'node'`). No existing tests in the project.

**supertest is NOT installed** — add it as a devDependency before writing integration tests:
```bash
npm install --save-dev supertest @types/supertest
```

Functions and files under test:

| Function | File |
|----------|------|
| `getPositionCandidates` | `src/application/services/positionService.ts` |
| `getPositionInterviewSteps` | `src/application/services/positionService.ts` |
| `updateCandidateStage` | `src/application/services/candidateService.ts` |
| `GET /positions/:id/candidates` | `src/routes/positionRoutes.ts` |
| `GET /positions/:id/interviewSteps` | `src/routes/positionRoutes.ts` |
| `PUT /candidates/:id/stage` | `src/routes/candidateRoutes.ts` |

---

### Part 1 — Unit Tests (service layer)

**Prisma mock pattern** — use at the top of each service test file:

```typescript
const mockPrisma = {
    position:      { findUnique: jest.fn() },
    candidate:     { findUnique: jest.fn() },
    application:   { findFirst: jest.fn(), update: jest.fn() },
    interviewStep: { findUnique: jest.fn() },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));
```

Call `jest.clearAllMocks()` in `beforeEach`.

---

#### `src/__tests__/unit/positionService.test.ts`

**`getPositionCandidates`** — 6 cases:

| # | Scenario | Mock setup | Expected result |
|---|----------|------------|-----------------|
| 1 | Position not found | `findUnique` returns `null` | returns `null` |
| 2 | Position exists, no applications | `findUnique` returns `{ applications: [] }` | returns `[]` |
| 3 | One application, no interviews | applications with `interviews: []` | `averageScore: null` |
| 4 | One application, one score | `interviews: [{ score: 7 }]` | `averageScore: 7` |
| 5 | One application, multiple scores | `interviews: [{ score: 8 }, { score: 9 }]` | `averageScore: 8.5` |
| 6 | One application, mixed null/numeric scores | `interviews: [{ score: 6 }, { score: null }]` | `averageScore: 6` (null excluded) |

Also assert DTO shape on case 4:
```typescript
expect(result[0]).toEqual({
    candidateId: expect.any(Number),
    applicationId: expect.any(Number),
    fullName: 'Jane Smith',
    currentInterviewStep: 'Technical Screen',
    currentInterviewStepId: expect.any(Number),
    averageScore: 7,
});
```

**`getPositionInterviewSteps`** — 3 cases:

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Position not found | returns `null` |
| 2 | Position with 3 steps | returns array of 3 `InterviewStepDTO` |
| 3 | Steps returned in `orderIndex` order | assert `result[0].orderIndex < result[1].orderIndex` |

---

#### `src/__tests__/unit/candidateService.test.ts`

**`updateCandidateStage`** — 5 cases:

| # | Scenario | Mock setup | Expected |
|---|----------|------------|----------|
| 1 | Candidate not found | `candidate.findUnique` returns `null` | throws `'Candidate not found'` |
| 2 | Application not found | `application.findFirst` returns `null` | throws `'Application not found for this candidate'` |
| 3 | Application belongs to different candidate | `findFirst` returns `null` (where includes candidateId) | throws `'Application not found for this candidate'` |
| 4 | InterviewStep not found | `interviewStep.findUnique` returns `null` | throws `'Invalid interview step'` |
| 5 | Happy path | all mocks return valid data | returns `{ id, candidateId, currentInterviewStep }` |

Use `await expect(fn()).rejects.toThrow('exact error message')` for error cases.

---

### Part 2 — Integration Tests (HTTP layer)

**Service mock pattern** — mock the entire service module so no DB is hit:

```typescript
jest.mock('../../application/services/positionService');
import * as positionService from '../../application/services/positionService';
const mockGetCandidates = positionService.getPositionCandidates as jest.Mock;
```

Import `app` from `src/index.ts` and use supertest:
```typescript
import request from 'supertest';
import { app } from '../../index';
```

---

#### `src/__tests__/integration/positionRoutes.test.ts`

**`GET /positions/:id/candidates`** — 4 cases:

| # | Scenario | Service mock | Expected status | Expected body |
|---|----------|--------------|-----------------|---------------|
| 1 | Valid position with candidates | returns candidate array | 200 | array with correct shape |
| 2 | Position exists, no candidates | returns `[]` | 200 | `[]` |
| 3 | Position not found | returns `null` | 404 | `{ error: 'Position not found' }` |
| 4 | Non-numeric ID | — (no service call) | 400 | `{ error: 'Invalid ID format' }` |

**`GET /positions/:id/interviewSteps`** — 3 cases:

| # | Scenario | Service mock | Expected status |
|---|----------|--------------|-----------------|
| 1 | Valid position | returns steps array | 200 |
| 2 | Position not found | returns `null` | 404 |
| 3 | Non-numeric ID | — | 400 |

---

#### `src/__tests__/integration/candidateRoutes.test.ts`

**`PUT /candidates/:id/stage`** — 7 cases:

| # | Scenario | Expected status | Expected body |
|---|----------|-----------------|---------------|
| 1 | Valid request | 200 | `{ id, candidateId, currentInterviewStep }` |
| 2 | Non-numeric candidateId | 400 | `{ error: 'Invalid candidate ID format' }` |
| 3 | Missing `applicationId` in body | 400 | `{ error: 'Invalid or missing applicationId' }` |
| 4 | Missing `currentInterviewStep` in body | 400 | `{ error: 'Invalid or missing currentInterviewStep' }` |
| 5 | Service throws `'Candidate not found'` | 404 | `{ error: 'Candidate not found' }` |
| 6 | Service throws `'Application not found for this candidate'` | 404 | `{ error: 'Application not found for this candidate' }` |
| 7 | Service throws `'Invalid interview step'` | 400 | `{ error: 'Invalid interview step' }` |

---

**Expected Output**:

| File | Action |
|------|--------|
| `backend/package.json` | Edit — add `supertest` and `@types/supertest` to `devDependencies` |
| `backend/src/__tests__/unit/positionService.test.ts` | Create — 9 unit tests |
| `backend/src/__tests__/unit/candidateService.test.ts` | Create — 5 unit tests |
| `backend/src/__tests__/integration/positionRoutes.test.ts` | Create — 7 integration tests |
| `backend/src/__tests__/integration/candidateRoutes.test.ts` | Create — 7 integration tests |

---

**Constraints**:
- No real DB connections — unit tests mock Prisma, integration tests mock services
- Use `jest.clearAllMocks()` in `beforeEach` in every file
- Error cases use `rejects.toThrow('exact string')` — match the exact error messages thrown by services
- No `any` types in test files
- Do not test implementation details — assert inputs and outputs only
- `npm test` must pass with all tests green

---

**Acceptance Criteria**:
- [ ] `npm test` exits 0 — all tests pass
- [ ] 28 total tests across 4 files
- [ ] Unit tests make zero real DB calls
- [ ] Integration tests make zero real DB calls
- [ ] Every error branch in each service function has a corresponding test
- [ ] Every HTTP status code in the error-handling table (`docs/backend.md`) is covered by at least one test
- [ ] No `any` in test files
