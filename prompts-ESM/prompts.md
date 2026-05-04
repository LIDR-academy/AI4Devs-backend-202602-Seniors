# Prompts — ESM

---

# 1. Generate Project Documentation

## Role

Act as a Senior Technical Writer and Full-Stack Engineer.

## Objective

Analyze the current codebase and generate accurate, maintainable project documentation in Markdown.

Document the intended and well-implemented architecture only. Use best-practice files as the source of truth, and ignore or explicitly exclude files that violate the expected architecture or quality standards.

## Project Context

- Stack:
  - TypeScript
  - Node.js
  - Express
  - Prisma ORM
  - PostgreSQL
  - React
- Target architecture:
  - Hexagonal Architecture / Ports & Adapters
  - DDD-aligned domain layer
- Codebase quality:
  - Mixed quality
  - Some files follow the intended architecture
  - Some files contain anti-patterns or inconsistencies
- Output directory:
  - `docs/`
  - Create it if it does not exist

## Mandatory Pre-Analysis

Before writing any documentation:

1. Inspect the full project structure, including:
   - `backend/src/`
   - `frontend/src/`
   - `prisma/schema.prisma`
   - relevant root configuration files

2. Identify files that follow best practices, using these criteria:

   - Domain files:
     - Must not import `@prisma/client`
     - Must not import Express
     - Must not import `multer`
     - Must contain domain logic or domain types only

   - Service/Application files:
     - Must depend on repository interfaces or ports
     - Must not use Prisma directly
     - Must contain application orchestration, not infrastructure logic

   - Controllers/Route handlers:
     - Should be thin
     - Should delegate to services/use cases
     - Should not contain business logic
     - Preferably ≤15 lines per handler

   - TypeScript quality:
     - No untyped `any`
     - Explicit return types on public functions
     - Clear interfaces and types

3. Use only best-practice files as references for:
   - Architecture
   - Patterns
   - Code examples
   - Naming conventions

4. Do not present anti-patterns as project standards.

5. If some files deviate from the intended architecture:
   - Mention them only as deviations or excluded examples when relevant
   - Do not use their patterns as documentation guidance

## Required Output Files

Create exactly the following Markdown files inside `docs/`:

```text
docs/
  architecture.md
  project-structure.md
  backend.md
  frontend.md
  database.md
```
---


# 2. Task: Implement `GET /positions/:id/candidates`

**Agent:** FullStack Expert (`.cursor/subagents/fullstack-expert.agent.md`)

## Read Before Implementing

Review and follow:

- `docs/architecture.md` — layer rules and dependency constraints
- `docs/backend.md` — controller, service, and error-handling patterns
- `docs/database.md` — schema, relations, and ERM
- `docs/project-structure.md` — file and route naming conventions

## Objective

Implement `GET /positions/:id/candidates`.

The endpoint must return all candidates in the hiring process for a given position, including:

- candidate full name
- current interview step name
- average interview score

## Data Context

Relevant Prisma relations:

```text
Position (id) ──< Application (positionId)
Application ──> Candidate       (candidateId → firstName, lastName)
Application ──> InterviewStep (currentInterviewStep → name)
Application ──< Interview       (applicationId → score Int?)
```

For each `Application` matching `positionId`, return a value of type `PositionCandidateDTO`:

```ts
type PositionCandidateDTO = {
  fullName: string
  currentInterviewStep: string
  averageScore: number | null
}
```

### Mapping rules

- `fullName` = `candidate.firstName + ' ' + candidate.lastName`
- `currentInterviewStep` = `interviewStep.name`
- `averageScore` = arithmetic mean of **non-null** `interviews[].score`
- `averageScore` is `null` when there are no numeric scores to average

## Expected response

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

## Files to create or edit

### 1. `backend/src/routes/positionRoutes.ts`

Create this file unless `docs/project-structure.md` requires another convention.

- Register: `GET /:id/candidates`

### 2. `backend/src/index.ts`

- Mount the position router under: `/positions`

### 3. `backend/src/presentation/controllers/positionController.ts`

Create a thin HTTP controller that:

- parses `req.params.id` as an integer
- returns **400** with `Invalid ID format` when the id is invalid
- delegates all business logic to the service
- returns **404** when the position does not exist
- returns **200** with the candidates array on success
- follows the error-handling rules in `docs/backend.md`

### 4. `backend/src/application/services/positionService.ts`

Create or extend this service with:

```ts
getCandidatesForPosition(positionId: number): Promise<PositionCandidateDTO[]>
```

The service must:

- verify whether the position exists
- return `[]` when the position exists but has no applications
- fetch applications and related data
- map results to `PositionCandidateDTO`
- compute `averageScore` in the service layer

## Prisma query requirement

Use **one** `prisma.application.findMany` call with nested `include` for applications and related data:

```ts
prisma.application.findMany({
  where: { positionId },
  include: {
    candidate: { select: { firstName: true, lastName: true } },
    interviewStep: { select: { name: true } },
    interviews: { select: { score: true } },
  },
})
```

Do not query candidates, interview steps, or interviews inside a loop.

## Constraints

- No N+1 queries
- No business logic in routes or controllers
- No `@prisma/client` imports in controllers or domain layer
- `PositionCandidateDTO` must be a named TypeScript type
- Do not use `any` in new files
- Do not modify existing endpoints or response shapes
- Follow `docs/backend.md` exactly for 400, 404, and 500 handling

## Acceptance criteria

- `GET /positions/1/candidates` returns **200** with the expected array shape
- `GET /positions/999/candidates` returns **404** when the position does not exist
- `GET /positions/abc/candidates` returns **400** with `Invalid ID format`
- Existing position with no applications returns **200** with `[]`
- `averageScore` is `null` when no numeric scores exist
- `averageScore` ignores null scores and averages only numeric scores
- Only one `application.findMany` query loads the application graph (nested includes); a separate `position.findUnique` (or equivalent) is allowed to assert the position exists before **404**
- TypeScript compiles without errors
- No `any` types are introduced

## Final output

Provide:

- the complete implementation for all changed files
- a brief summary of what changed
- any assumptions made, only if necessary

---


# 3. Task: Implement `PUT /candidates/:id/stage`

**Agent:** FullStack Expert (`.cursor/subagents/fullstack-expert.agent.md`)

## Read Before Implementing

Review and follow:

- `docs/architecture.md` — layer rules and dependency constraints
- `docs/backend.md` — controller, service, validation, and error-handling patterns
- `docs/database.md` — `Application` and `InterviewStep` model fields and relations

## Objective

Implement `PUT /candidates/:id/stage`.

The endpoint updates the `currentInterviewStep` field of a specific `Application`, moving a candidate to a new interview stage.

## Data Context

A candidate can have multiple applications, so the request must identify:

- the candidate: `req.params.id`
- the application to update: `req.body.applicationId`
- the target interview step: `req.body.currentInterviewStep`

Relevant relations:

```text
Candidate (id) ──< Application (candidateId, currentInterviewStep)
InterviewStep (id) ←── Application.currentInterviewStep
```

Relevant request body:

```json
{
  "applicationId": 4,
  "currentInterviewStep": 3
}
```

Success response, status `200`:

```json
{
  "id": 4,
  "candidateId": 1,
  "currentInterviewStep": 3
}
```

## Validation order

Validate in this exact order and fail fast:


| Step | Check | Error |
|---:|---|---|
| 1 | `req.params.id` is a valid integer | `400 Invalid candidate ID format` |
| 2 | `req.body.applicationId` is present and a valid integer | `400 Invalid or missing applicationId` |
| 3 | `req.body.currentInterviewStep` is present and a valid integer | `400 Invalid or missing currentInterviewStep` |
| 4 | Candidate with `id` exists | `404 Candidate not found` |
| 5 | Application with `applicationId` exists and belongs to candidate `:id` | `404 Application not found for this candidate` |
| 6 | InterviewStep with `currentInterviewStep` exists | `400 Invalid interview step` |

## Files to edit

### 1. `backend/src/routes/candidateRoutes.ts`

Add:


```ts
PUT /:id/stage
```

Do not create a new route file. This endpoint belongs to the candidate resource.

### 2. `backend/src/presentation/controllers/candidateController.ts`

Add an `updateCandidateStage` handler.

Controller responsibilities:

- perform validation steps 1–3 only
- delegate validation steps 4–6 and the update to the service
- map service errors to the correct HTTP statuses
- follow the thin-controller pattern from `docs/backend.md`
- do not import Prisma
- do not include business logic

### 3. `backend/src/application/services/candidateService.ts`

Add:


```ts
updateCandidateStage(
  candidateId: number,
  applicationId: number,
  interviewStepId: number
): Promise<{
  id: number
  candidateId: number
  currentInterviewStep: number
}>
```

Service responsibilities:
- validate that the candidate exists
- validate that the application exists and belongs to the candidate
- validate that the interview step exists
- update only `currentInterviewStep`
- throw exact error messages so the controller can map status codes correctly
- avoid `any` types

## Required Prisma strategy

Use this ownership check before updating:


```ts
const application = await prisma.application.findFirst({
  where: { id: applicationId, candidateId }
})

if (!application) {
  throw new Error('Application not found for this candidate')
}
```

Validate the interview step:

```ts
const step = await prisma.interviewStep.findUnique({
  where: { id: interviewStepId }
})

if (!step) {
  throw new Error('Invalid interview step')
}
```

Update with a single write query:

```ts
return prisma.application.update({
  where: { id: applicationId },
  data: { currentInterviewStep: interviewStepId },
  select: {
    id: true,
    candidateId: true,
    currentInterviewStep: true
  }
})
```

## Constraints

- No `@prisma/client` imports in controllers
- No business logic in routes or controllers
- Do not change existing `addCandidate` or `findCandidateById` behavior
- Do not modify existing endpoint response shapes
- Do not use `any`
- Only update `Application.currentInterviewStep`; leave all other fields unchanged
- Service error messages must exactly match:
  - `Candidate not found`
  - `Application not found for this candidate`
  - `Invalid interview step`

## Acceptance criteria

- `PUT /candidates/1/stage` with a valid body returns `200` and the updated application fields
- `PUT /candidates/abc/stage` returns `400 Invalid candidate ID format`
- Missing `applicationId` returns `400 Invalid or missing applicationId`
- Missing `currentInterviewStep` returns `400 Invalid or missing currentInterviewStep`
- Non-existent candidate returns `404 Candidate not found`
- Application belonging to another candidate returns `404 Application not found for this candidate`
- Non-existent interview step returns `400 Invalid interview step`
- Only `currentInterviewStep` changes
- TypeScript compiles without errors
- No `any` types are introduced

## Final Output

Provide:

1. Complete code changes for the edited files
2. A brief implementation summary
3. Any assumptions made, only if necessary
---

# 4. Task: Create an Idempotent Prisma Database Seeder

**Agent:** FullStack Expert (`.cursor/subagents/fullstack-expert.agent.md`)

## Read Before Implementing

Review and follow:

- `docs/database.md` — full schema, models, fields, and relations
- `docs/project-structure.md` — file placement and project conventions

## Objective

Create a Prisma seed setup that populates the database with realistic data for testing the Kanban-related endpoints immediately after seeding.

The database is currently empty, causing Kanban endpoints to return `[]` or `404`.

## Files to create or edit

### 1. `backend/prisma/schema.prisma`

Ensure the datasource uses an environment variable:

```prisma
url = env("DATABASE_URL")
```

Do not hardcode database credentials.

### 2. `backend/package.json`

Add the Prisma seed configuration (keep the `prisma` CLI package in `devDependencies`; this block is the **top-level** `prisma` seed hook):


```json
"prisma": {
  "seed": "ts-node --transpile-only prisma/seed.ts"
}
```

Preserve existing package.json content.

### 3. `backend/prisma/seed.ts`

Create an idempotent seed script using Prisma.

The script must:

- clear existing seeded data with `deleteMany` in reverse foreign-key order
- recreate the dataset below using `create`
- use IDs returned from previous `create` calls for all foreign keys
- avoid hardcoded relational IDs
- avoid `createMany` and `skipDuplicates`
- avoid `any` types
- disconnect Prisma in a `finally` block

## Required Seed Data

### Interview Types
Create 4 interview types:

| Name |
|---|
| HR Screen |
| Technical Screen |
| Technical Interview |
| Final Interview |

### Interview Flow
Create 1 interview flow:

```text
Standard Engineering Flow
```

### Interview Steps
Create 4 ordered steps in `Standard Engineering Flow`:

| orderIndex | Name | Interview Type |
|---:|---|---|
| 1 | HR Screen | HR Screen |
| 2 | Technical Screen | Technical Screen |
| 3 | Technical Interview | Technical Interview |
| 4 | Final Interview | Final Interview |

### Company
Create 1 company:

```text
LTI
```

### Employee
Create 1 employee:

| firstName | lastName | email | role | isActive |
|---|---|---|---|---|
| Sarah | Johnson | sarah@lti.com | HR Manager | true |

Associate Sarah with `LTI` if the schema requires a company relation.

### Position
Create 1 position:

| Field | Value |
|---|---|
| title | Senior QA Engineer |
| company | LTI |
| interviewFlow | Standard Engineering Flow |
| status | Open |
| isVisible | true |
| location | Remote |
| jobDescription | QA automation, test strategy, and release quality |
| salaryMin | 45000 |
| salaryMax | 75000 |

### Candidates
Create 10 candidates (científicos reconocibles; emails únicos de ejemplo):

| firstName | lastName | email |
|---|---|---|
| Marie | Curie | marie.curie@seed.example |
| Albert | Einstein | albert.einstein@seed.example |
| Isaac | Newton | isaac.newton@seed.example |
| Charles | Darwin | charles.darwin@seed.example |
| Nikola | Tesla | nikola.tesla@seed.example |
| Rosalind | Franklin | rosalind.franklin@seed.example |
| Stephen | Hawking | stephen.hawking@seed.example |
| Ada | Lovelace | ada.lovelace@seed.example |
| Galileo | Galilei | galileo.galilei@seed.example |
| Richard | Feynman | richard.feynman@seed.example |

### Applications
Create 10 applications, one per candidate, all linked to `Senior QA Engineer`:

| Candidate | currentInterviewStep |
|---|---|
| Marie Curie | HR Screen |
| Albert Einstein | HR Screen |
| Isaac Newton | Technical Screen |
| Charles Darwin | Technical Interview |
| Nikola Tesla | Final Interview |
| Rosalind Franklin | Technical Screen |
| Stephen Hawking | HR Screen |
| Ada Lovelace | Technical Interview |
| Galileo Galilei | Technical Screen |
| Richard Feynman | Final Interview |

### Interviews
Registrar entrevistas con **scores distintos**; **Galileo Galilei** falla exactamente **una** prueba (`Technical Screen`, `result` **Failed**, `score` numérico bajo). La media `averageScore` del endpoint sigue siendo la media aritmética de **todos** los `score` no nulos (incluye la prueba fallada).

| Candidate | Interview Step | Employee | score | result |
|---|---|---|---:|---|
| Albert Einstein | HR Screen | Sarah Johnson | 9 | Passed |
| Isaac Newton | HR Screen | Sarah Johnson | 7 | Passed |
| Isaac Newton | Technical Screen | Sarah Johnson | 8 | Passed |
| Charles Darwin | HR Screen | Sarah Johnson | 6 | Passed |
| Charles Darwin | Technical Screen | Sarah Johnson | 10 | Passed |
| Charles Darwin | Technical Interview | Sarah Johnson | 8 | Passed |
| Nikola Tesla | HR Screen | Sarah Johnson | 5 | Passed |
| Nikola Tesla | Technical Screen | Sarah Johnson | 7 | Passed |
| Nikola Tesla | Technical Interview | Sarah Johnson | 8 | Passed |
| Nikola Tesla | Final Interview | Sarah Johnson | 6 | Passed |
| Rosalind Franklin | HR Screen | Sarah Johnson | 10 | Passed |
| Rosalind Franklin | Technical Screen | Sarah Johnson | 9 | Passed |
| Stephen Hawking | HR Screen | Sarah Johnson | 4 | Passed |
| Ada Lovelace | HR Screen | Sarah Johnson | 9 | Passed |
| Ada Lovelace | Technical Screen | Sarah Johnson | 8 | Passed |
| Ada Lovelace | Technical Interview | Sarah Johnson | 10 | Passed |
| Galileo Galilei | HR Screen | Sarah Johnson | 8 | Passed |
| Galileo Galilei | Technical Screen | Sarah Johnson | 3 | Failed |
| Richard Feynman | HR Screen | Sarah Johnson | 7 | Passed |
| Richard Feynman | Technical Screen | Sarah Johnson | 8 | Passed |
| Richard Feynman | Technical Interview | Sarah Johnson | 9 | Passed |
| Richard Feynman | Final Interview | Sarah Johnson | 10 | Passed |

**Marie Curie** no tiene entrevistas registradas (sigue en `HR Screen` sin scores).

Expected averages (media de scores no nulos del listado anterior):

- Marie Curie: `null`
- Albert Einstein: `9.0`
- Isaac Newton: `7.5`
- Charles Darwin: `8.0` — media de 6, 10, 8
- Nikola Tesla: `6.5` — media de 5, 7, 8, 6
- Rosalind Franklin: `9.5`
- Stephen Hawking: `4.0`
- Ada Lovelace: `9.0` — media de 9, 8, 10
- Galileo Galilei: `5.5` — media de 8 (Passed) y 3 (**Failed**)
- Richard Feynman: `8.5` — media de 7, 8, 9, 10

## Implementation requirements

### Idempotency

The seed must be safe to run multiple times.

At the start of `seed.ts`, delete records in reverse dependency order, for example:


```ts
await prisma.interview.deleteMany()
await prisma.application.deleteMany()
// continue deleting dependent tables before parent tables
```

Adjust the exact delete order based on `docs/database.md` and `schema.prisma`.

### Prisma usage

- Use `create`, not `createMany`
- Do not use `skipDuplicates`
- Use returned records for all relations:

```ts
const company = await prisma.company.create(...)
const position = await prisma.position.create({
  data: {
    companyId: company.id
  }
})
```

### Safety

- Do not modify migrations
- Do not introduce `any`
- Keep changes minimal and consistent with the existing project style

## How to run

From the repository root:


```bash
docker-compose up -d
```

From `backend/`:


```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Run `npx prisma migrate dev` only if the schema changed.

## Acceptance criteria

- `schema.prisma` uses `env("DATABASE_URL")`
- `.env.example` exists and contains only placeholder database credentials
- `npx prisma db seed` runs without errors
- Running the seed twice does not fail or duplicate rows
- `GET /positions/{id}/candidates` returns **10** candidates with correct stages and average scores (según tablas anteriores); `{id}` es el `positionId` que imprime el seed al final (en PostgreSQL, tras reiniciar secuencias, suele ser **1** en la primera ejecución en BD vacía)
- `GET /positions/{id}/interviewSteps` returns 4 steps sorted por `orderIndex` (mismo `{id}` que arriba), si ese endpoint existe en el backend
- Marie Curie has `averageScore: null` (sin entrevistas con score)
- Galileo Galilei has exactamente una entrevista con `result: Failed` (Technical Screen) y `averageScore: 5.5`
- Richard Feynman has `averageScore: 8.5`
- TypeScript compiles without errors
- No `any` types are introduced
