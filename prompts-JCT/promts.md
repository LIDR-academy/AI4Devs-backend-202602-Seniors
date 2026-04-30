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
