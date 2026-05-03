# Spec-Driven Plan: PUT /candidates/:id/stage

## 1. Backend Context Analysis

- **Backend framework detected:** Express **4.19.2** in **TypeScript** (`backend/package.json`), entry `backend/src/index.ts`. Compiled with `tsc` to `dist/`. Default port **3010**. `NODE_ENV !== 'test'` guards `app.listen` (used by integration tests).
- **Relevant architecture pattern:** Layered, identical to the `GET /positions/:id/candidates` plan: `routes/` → `presentation/controllers/` → `application/services/` → `domain/models/` (Prisma access lives in models or in services that instantiate `PrismaClient` directly — both patterns are present and acceptable per `20-project-standards.mdc`).
- **Relevant existing endpoint references:**
  - `GET /candidates/:id` — `backend/src/presentation/controllers/candidateController.ts` `getCandidateById`. Path-param parse via `parseInt`, **400** `{ error: 'Invalid ID format' }`, **404** `{ error: 'Candidate not found' }`, **500** `{ error: 'Internal Server Error' }`. **This is the canonical model for path validation, JSON shape, and status codes for read-by-id semantics — the new PUT will reuse the same `{ error }` shape.**
  - `POST /candidates` — `backend/src/routes/candidateRoutes.ts` inline handler. Returns **201** + Prisma row on success, **400** `{ message }` on `Error`. **Documented inconsistency** (`20-project-standards.mdc` §error handling). The new PUT MUST pick one shape; this plan adopts the GET-style `{ error }` for consistency with all read+id-validation operations on `/candidates/:id/...`.
  - `GET /positions/:id/candidates` — `backend/src/routes/positionRoutes.ts` + `positionController.ts` + `positionCandidateService.ts`. Most recent precedent for **layered service-backed handler with Prisma module-level client**. New endpoint should mirror its file structure exactly.
- **Relevant folders/files inspected:**
  - `backend/src/index.ts` — mounts `/candidates` (line 42) and `/positions` (line 45); has `req.prisma` middleware (currently underused).
  - `backend/src/routes/candidateRoutes.ts` — inline `POST /` handler + `GET /:id` delegated to controller.
  - `backend/src/presentation/controllers/candidateController.ts` — `addCandidateController`, `getCandidateById`, re-exports `addCandidate`.
  - `backend/src/application/services/candidateService.ts` — `addCandidate`, `findCandidateById`. Uses domain models; surfaces Prisma `P2002` as friendly message.
  - `backend/src/application/services/positionCandidateService.ts` — module-level `new PrismaClient()` pattern + service-orchestrated mapping.
  - `backend/src/application/validator.ts` — runtime validators that throw `Error('Invalid …')`. **No DTO/Zod stack** in the project.
  - `backend/src/domain/models/Candidate.ts`, `Application.ts`, `InterviewStep.ts`, `Position.ts` — all expose `static findOne(id)` and `save()` with `if (this.id)` update branching.
  - `backend/prisma/schema.prisma` — authoritative schema; verified below in §2.
  - `backend/api-spec.yaml` — OpenAPI 3.0.0 doc currently covers `/candidates`, `/candidates/{id}`, `/positions/{id}/candidates`, `/upload`. New path MUST be appended in the same style.
  - `backend/jest.config.js` — `ts-jest` preset, `testEnvironment: 'node'`. Tests live in `backend/tests/{services,controllers,integration,helpers}` per the `GET /positions/:id/candidates` precedent.
- **Existing conventions to follow:**
  - **Routing:** Resource routers in `backend/src/routes/<resource>Routes.ts` exporting `Router()`; mount in `index.ts`. The new PUT lives under the **already-mounted** `/candidates` router — **no `index.ts` mount change required**.
  - **Naming:** `camelCase.ts` files, `PascalCase` domain classes. Handler exports `getXyz`, `addXyz`, `findXyzById`. New handler: `updateCandidateStage`.
  - **Formatting:** ESLint + Prettier (`singleQuote`, `trailingComma: 'all'`).
  - **JSON shape on `/candidates/:id/...`:** prefer **`{ error: '...' }`** keys (matches `getCandidateById`).
  - **Tests:** mirror the layered pattern from `tests/services/positionCandidateService.test.ts`, `tests/controllers/positionController.test.ts`, `tests/integration/positionRoutes.integration.test.ts`; reuse `tests/helpers/factories.ts`.

**Plan placement:** This document lives at **`backend/docs/specs/put-candidates-stage.md`**, alongside the existing `get-position-candidates.md`. No alternative location exists in the repository.

---

## 2. Data Model and Stage Ownership Analysis

Verified directly in **`backend/prisma/schema.prisma`** (lines 17–153):

### Candidate model

```prisma
model Candidate {
  id                Int               @id @default(autoincrement())
  firstName         String            @db.VarChar(100)
  lastName          String            @db.VarChar(100)
  email             String            @unique @db.VarChar(255)
  phone             String?           @db.VarChar(15)
  address           String?           @db.VarChar(100)
  educations        Education[]
  workExperiences   WorkExperience[]
  resumes           Resume[]
  applications      Application[]
}
```

`Candidate` has **no `stage`, `currentInterviewStep`, or interview-step field** of its own. The candidate is connected to interview steps **only through `Application`**.

### Application/process model

```prisma
model Application {
  id                   Int            @id @default(autoincrement())
  positionId           Int
  candidateId          Int
  applicationDate      DateTime
  currentInterviewStep Int
  notes                String?
  position             Position       @relation(fields: [positionId], references: [id])
  candidate            Candidate      @relation(fields: [candidateId], references: [id])
  interviewStep        InterviewStep  @relation(fields: [currentInterviewStep], references: [id])
  interviews           Interview[]
}
```

- `Application` is the **process record** linking one `Candidate` to one `Position`.
- **`Application.currentInterviewStep`** is an `Int` foreign key referencing `InterviewStep.id` (named `interviewStep` on the relation; the FK column is the scalar `currentInterviewStep`).
- **No `@@unique([candidateId, positionId])`** — a candidate may legally have **multiple applications** (same or different positions), each with its **own current step**.

### Stage / interview step model

```prisma
model InterviewStep {
  id              Int            @id @default(autoincrement())
  interviewFlowId Int
  interviewTypeId Int
  name            String
  orderIndex      Int
  interviewFlow   InterviewFlow  @relation(fields: [interviewFlowId], references: [id])
  interviewType   InterviewType  @relation(fields: [interviewTypeId], references: [id])
  applications    Application[]
  interviews      Interview[]
}
```

- A `Position` belongs to an `InterviewFlow`; that flow exposes `InterviewStep[]` ordered by `orderIndex`.
- Every step is tied to **exactly one** `interviewFlowId`. A candidate's "next step" is therefore meaningful **only inside the flow attached to that candidate's `Application.position.interviewFlowId`**.

### Where the current stage is stored

**`Application.currentInterviewStep` (Int, FK → `InterviewStep.id`).**

The stage is **not** on `Candidate`. The endpoint path `/candidates/:id/stage` therefore expresses the **subject** (the moved candidate) but the **owning record being mutated** is an `Application` row.

### How the correct record should be identified

`:id` alone is **insufficient** because a candidate can have multiple `Application` rows. The request body MUST disambiguate the application via **`applicationId`**, and MUST carry the new step value via **`currentInterviewStep`** (matching the Prisma column name).

Identification algorithm:

1. Parse `:id` as the `Candidate.id` (numeric).
2. Read `applicationId` (numeric) and `currentInterviewStep` (numeric, FK to `InterviewStep.id`) from the body.
3. Look up `Application` by `applicationId`. **MUST exist** AND **MUST have `candidateId === :id`**. Reject mismatches to prevent updating the wrong process.
4. Look up `InterviewStep` by `currentInterviewStep`. **MUST exist**.
5. **(Recommended cross-check)** Verify `InterviewStep.interviewFlowId === Application.position.interviewFlowId`. If the schema permits the cross-check at write-time (it does — `Position.interviewFlowId` is non-null), this prevents moving a candidate to a step that doesn't belong to their pipeline.
6. Persist `Application.currentInterviewStep = body.currentInterviewStep` and return the updated row.

### Ambiguities or risks

| # | Ambiguity | Resolution chosen by this plan |
|---:|---|---|
| 1 | `:id` is "candidate" but stage is on `Application` | Require `applicationId` in body; verify `application.candidateId === :id`. |
| 2 | Multiple applications per candidate | Body must specify which application to update. |
| 3 | "Stage" wording vs schema field name `currentInterviewStep` (FK to `InterviewStep.id`) | Body field name = **`currentInterviewStep`** (matches Prisma column + JSON convention used by `GET /positions/:id/candidates` response). Document as integer FK. Reject string stage names. |
| 4 | Should the endpoint also allow moving by step name (e.g. `"Technical Interview"`) instead of FK id? | **No.** Project has no slug/lookup helper; FK id keeps schema consistency with `Application.currentInterviewStep`. Document as assumption (§10). |
| 5 | Should we require the new step to belong to the candidate's flow? | **Yes — reject 422 (or 400 if 422 not used elsewhere) with `Invalid stage for application`** if `interviewStep.interviewFlowId !== application.position.interviewFlowId`. Project has no other 422 in use → **fall back to 400** for consistency with the existing error vocabulary. |
| 6 | Backwards step transitions, idempotent same-step writes | Allowed — no business rule in schema enforces forward-only progression. Same-step PUT is a no-op success (200). |
| 7 | Concurrent writers | Single-row update; Prisma `update` is atomic. No optimistic-locking column exists on `Application`. Document as known limitation; do **not** add a `version` column in this scope. |

---

## 3. Endpoint Specification

### Method and Path

`PUT /candidates/:id/stage`

Mounted under the existing `/candidates` router via `router.put('/:id/stage', updateCandidateStage)` in `backend/src/routes/candidateRoutes.ts`. **No change to `index.ts` mounts** is required.

### Purpose

Update the **current interview step** (`Application.currentInterviewStep`) for a specific application belonging to the candidate identified by `:id`. Used when a recruiter "moves" a candidate forward (or backward) in the pipeline.

### Path Parameters

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `id`      | integer | `Candidate.id` (Prisma `@id`). Must be parseable as an integer (`parseInt(req.params.id, 10)`); rejected as `400` when `isNaN`. |

### Request Body

`Content-Type: application/json`

```json
{
  "applicationId": 10,
  "currentInterviewStep": 3
}
```

| Field                  | Type    | Required | Description |
|------------------------|---------|----------|-------------|
| `applicationId`        | integer | **yes**  | Primary key of the `Application` row to mutate. Must belong to candidate `:id`. |
| `currentInterviewStep` | integer | **yes**  | New `InterviewStep.id` value. Must reference an existing `InterviewStep`. Recommended (see §6) to also belong to the same `interviewFlowId` as the application's position. |

**Rejected variations:**

- Missing field → `400 { error: 'Invalid request body' }`.
- Non-integer values, negative values, or `0` → `400 { error: 'Invalid <fieldName>' }` (mirrors `Invalid …` validator language).
- Unknown extra fields → ignored (consistent with current candidate POST behavior, which forwards only known fields through validators/models).

### Success Response

- **`200 OK`**
- **Content-Type:** `application/json`
- **Body:** the **updated `Application` row** as returned by Prisma (camelCase scalar fields). This mirrors the `POST /candidates` body shape (Prisma `create` row) and is friendlier to integration tests than `204 No Content`.

```json
{
  "id": 10,
  "positionId": 1,
  "candidateId": 5,
  "applicationDate": "2024-01-01T00:00:00.000Z",
  "currentInterviewStep": 3,
  "notes": null
}
```

**Why 200 with body (not 204):**

- `POST /candidates` returns 201 + Prisma row body — same family of write response.
- Existing tests use `expect(response.body).toEqual(...)` on full payloads (audit Finding 3); 204 would force a different assertion style.
- Keeps frontend round-trips predictable (echo of the persisted state, including the FK actually written).

### Empty Response

Not applicable. PUT always either succeeds (200 with row) or returns an error status.

### Error Responses

All errors return `Content-Type: application/json`. Body shape mirrors `getCandidateById` (`{ error: '...' }`):

| Status | Condition | Body |
|-------:|-----------|------|
| **400** | `:id` is not parseable as integer (`isNaN`) | `{ "error": "Invalid ID format" }` |
| **400** | Body missing or not an object | `{ "error": "Invalid request body" }` |
| **400** | `applicationId` missing or not a positive integer | `{ "error": "Invalid applicationId" }` |
| **400** | `currentInterviewStep` missing or not a positive integer | `{ "error": "Invalid currentInterviewStep" }` |
| **400** | `interviewStep.interviewFlowId !== application.position.interviewFlowId` (cross-check) | `{ "error": "Stage does not belong to the candidate's interview flow" }` |
| **404** | `Candidate` with `:id` does not exist | `{ "error": "Candidate not found" }` |
| **404** | `Application` with `applicationId` does not exist | `{ "error": "Application not found" }` |
| **404** | `InterviewStep` with `currentInterviewStep` does not exist | `{ "error": "Interview step not found" }` |
| **409** | `Application.candidateId !== :id` (application belongs to a different candidate) | `{ "error": "Application does not belong to candidate" }` |
| **500** | Unexpected DB / server failure | `{ "error": "Internal Server Error" }` |

**Status-code rationale:**

- **`409 Conflict`** is the only code in this plan not currently used by the project. The plan recommends introducing it **here** because the request is syntactically valid but semantically inconsistent (candidate/application mismatch). Acceptable fallback if reviewers prefer to keep the project at 400/404/500 only: **return `400`** with the same message. The implementation agent should pick one and stay consistent across tests + OpenAPI doc.
- **No `422`** because the project has no other `422` and the existing inconsistency note in `20-project-standards.mdc` warns against introducing a "third pattern".

### Authentication and Authorization

**None.** No JWT, session, RBAC, or middleware guards exist in `backend/src/index.ts`. CORS is restricted to `http://localhost:3000` with `credentials: true`. The new endpoint stays anonymous, consistent with all existing routes. Adding auth is **out of scope** for this plan and would require explicit stakeholder sign-off per `20-project-standards.mdc` §authentication.

---

## 4. Proposed Backend Changes

> **Do not implement in this phase.** File paths, responsibilities, and patterns to follow only.

| # | File path | Action | Purpose | Expected responsibility | Pattern to follow |
|---|-----------|--------|---------|-------------------------|-------------------|
| 1 | `backend/src/routes/candidateRoutes.ts` | **Modify** | Register `router.put('/:id/stage', updateCandidateStage)`. | Wire the PUT verb to the new controller export; preserve the existing `POST /` and `GET /:id` routes. | Existing `router.get('/:id', getCandidateById)` line 20. |
| 2 | `backend/src/presentation/controllers/candidateController.ts` | **Modify** | Add and export `updateCandidateStage`. | Parse `:id` (`parseInt` + `isNaN`), forward body + id to the service, map service results to HTTP status codes (200 / 400 / 404 / 409 / 500), respond with JSON `{ error }` on failures and the updated Application row on success. **Do not** put Prisma calls here. | `getCandidateById` (lines 18–32). |
| 3 | `backend/src/application/services/candidateStageService.ts` | **Create (new file)** | Orchestrate the update. | Validate body shape (delegated to `validator.ts`), perform Prisma lookups (`Candidate.findUnique` or domain `Candidate.findOne`, `Application` with `include: { position: { select: { interviewFlowId: true } } }`, `InterviewStep.findUnique`), enforce candidate↔application ownership, enforce step↔flow cross-check, perform `prisma.application.update`. Return a tagged result discriminating `ok / not_found / conflict / invalid_stage` so the controller can map status codes. | `findPositionCandidates` in `positionCandidateService.ts` (module-level `new PrismaClient()` + orchestration with mapping). |
| 4 | `backend/src/application/validator.ts` | **Modify** | Add `validateStageUpdatePayload(body): { applicationId: number; currentInterviewStep: number }` and the small per-field helpers (`validatePositiveIntegerField`). | Throw `Error('Invalid <field>')` matching existing validator vocabulary. Keep behavior pure — no Prisma calls. | Existing `validateName`, `validateEmail`, `validateCandidateData` shape (lines 8–107). |
| 5 | `backend/src/domain/models/Application.ts` | **Optionally modify** | Add `static updateStage(id: number, currentInterviewStep: number): Promise<Application>` and/or `static findOneWithPositionFlow(id: number)` finder so service does not access Prisma directly for application reads/writes. | Encapsulates Prisma access in the domain class, consistent with `Candidate.findOne` includes. **Optional** because `positionCandidateService.ts` precedent allows direct Prisma in services. The implementation agent picks one locality and stays consistent. | Existing `Application.save()` `if (this.id) prisma.application.update(...)` branch. |
| 6 | `backend/src/index.ts` | **No change** | `/candidates` router is already mounted (line 42). |  — | — |
| 7 | `backend/api-spec.yaml` | **Modify** | Append `paths: /candidates/{id}/stage: put: ...` describing path param, request body schema, 200 / 400 / 404 / 409 / 500 responses. | Stay in OpenAPI 3.0.0; mirror the field/schema documentation depth of the existing `/positions/{id}/candidates` entry. | `/positions/{id}/candidates` block (lines 216–303 of `api-spec.yaml`). |
| 8 | `backend/tests/services/candidateStageService.test.ts` | **Create (new file)** | Unit tests for the new service with `jest.mock('@prisma/client')`. | Mirror `tests/services/positionCandidateService.test.ts` mock factory pattern (mocks declared inside the factory + `jest.requireMock`). | `positionCandidateService.test.ts`. |
| 9 | `backend/tests/controllers/candidateController.test.ts` | **Create (new file)** | Unit tests for `updateCandidateStage` controller with the service mocked out. | Mirror `tests/controllers/positionController.test.ts` (full equality on happy path, 400/404/409/500 mappings, id boundaries). | `positionController.test.ts`. |
| 10 | `backend/tests/integration/candidateRoutes.integration.test.ts` | **Create (new file)** | Supertest integration tests against the real `app` from `src/index.ts` with Prisma mocked. | Cover route mounting, JSON `Content-Type`, full envelope happy path, all error statuses, and HTTP method gating. | `tests/integration/positionRoutes.integration.test.ts`. |
| 11 | `backend/tests/helpers/factories.ts` | **Modify** | Add `makeStageUpdateBody(overrides)`, `makeApplicationWithPosition(overrides)`, and `makeInterviewStep(overrides)` factories. Reuse existing `makeReq` / `makeRes`. | Keep API surface stable; only **add**, do not rename. | Existing `makeApplication`, `makePosition` helpers. |
| 12 | `backend/docs/QA-get-position-candidates.md` | **Optional update (post-impl)** | Append a section for `PUT /candidates/:id/stage` mirroring the existing audit table. | Out of scope for the spec — only relevant after the implementation/test pass. | Existing audit structure. |

**Explicitly avoided (this task):**

- New npm dependencies (`prisma`, `express`, `supertest` already cover the use case).
- New top-level architecture layers (`infrastructure/`, repositories, DI containers, CQRS) — forbidden by `20-project-standards.mdc` §mandatory workflow.
- Prisma migrations — **no schema change is required**.
- Renaming or refactoring existing models / services as part of this endpoint.
- Wiring `swagger-ui-express` (declared but not mounted today).

---

## 5. Validation and Error Handling Plan

### 5.1 Path parameter validation

In `updateCandidateStage` controller, **before** any service call:

1. `const candidateId = parseInt(req.params.id, 10);`
2. `if (isNaN(candidateId)) return res.status(400).json({ error: 'Invalid ID format' });`

Mirror exactly `getCandidateById`. Note (per audit Finding §controller): `parseInt('0', 10) === 0` is **not** `NaN`, so `0` reaches the service — the service then returns `Candidate not found` (404). Same documented behavior.

### 5.2 Request body validation

Delegated to a new helper in `backend/src/application/validator.ts`:

```ts
// Pseudocode (do not paste verbatim; match existing style)
export const validateStageUpdatePayload = (body: any): {
  applicationId: number;
  currentInterviewStep: number;
} => {
  if (!body || typeof body !== 'object') throw new Error('Invalid request body');
  validatePositiveInteger(body.applicationId, 'applicationId');
  validatePositiveInteger(body.currentInterviewStep, 'currentInterviewStep');
  return {
    applicationId: body.applicationId,
    currentInterviewStep: body.currentInterviewStep,
  };
};
```

`validatePositiveInteger(value, fieldName)` throws `Error('Invalid <fieldName>')` when value is not a finite integer ≥ 1. Service catches the validator error and maps it to `400`.

### 5.3 Candidate existence validation

Service step:

1. `const candidate = await Candidate.findOne(candidateId);` (existing static finder; already wraps Prisma).
2. If `null` → return discriminated result `{ kind: 'candidate_not_found' }` → controller responds **404 `Candidate not found`**.

Skipping this lookup and relying solely on the application-ownership check would silently 404 for non-existent candidates with the wrong message. Explicit lookup keeps error specificity and matches existing GET semantics.

### 5.4 Application existence and ownership validation

Service steps:

1. `const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { position: { select: { interviewFlowId: true } } } });`
2. If `null` → `{ kind: 'application_not_found' }` → **404 `Application not found`**.
3. If `application.candidateId !== candidateId` → `{ kind: 'application_candidate_mismatch' }` → **409 `Application does not belong to candidate`** (or 400 fallback per §3 rationale).

### 5.5 InterviewStep existence and flow consistency

Service steps:

1. `const step = await InterviewStep.findOne(currentInterviewStep);` or `prisma.interviewStep.findUnique({ where: { id }, select: { id: true, interviewFlowId: true } });`
2. If `null` → `{ kind: 'step_not_found' }` → **404 `Interview step not found`**.
3. If `step.interviewFlowId !== application.position.interviewFlowId` → `{ kind: 'invalid_stage_for_flow' }` → **400 `Stage does not belong to the candidate's interview flow`**.

### 5.6 Database update failure handling

Service step:

1. `try { return await prisma.application.update({ where: { id: applicationId }, data: { currentInterviewStep } }); }`
2. `catch (error) { if ((error as any).code === 'P2025') return { kind: 'application_not_found' }; throw error; }`
3. Controller wraps the entire async path in `try/catch` and returns **500 `Internal Server Error`** for anything not mapped above (mirrors `getCandidateById`).

Why catch `P2025` defensively even after the explicit `findUnique`: a row could be deleted between the lookup and the update. Mapping it back to **404** keeps the response truthful.

### 5.7 Consistency with existing backend error patterns

| Concern | Choice | Justification |
|---|---|---|
| Body shape on errors | `{ "error": "..." }` | Matches `getCandidateById`. POST `/candidates` uses `{ message }`; the new endpoint sits in the `/candidates/:id/...` family of `{ error }` responses. |
| Plain-text 500 from global handler | **Avoided.** Controller catches and returns JSON 500. | Documented inconsistency in `20-project-standards.mdc`; latest plan (`get-position-candidates.md`) already opts into JSON 500. |
| Validator throws `Error('Invalid …')` | Reused | Existing convention in `validator.ts`. |
| `instanceof Error` check | Used in controller catch when re-throwing | Mirrors existing `addCandidate` route try/catch. |

---

## 6. Database Update Strategy

- **Model/table updated:** `Application` (Prisma `application` table).
- **Field updated:** `currentInterviewStep` (Int FK → `InterviewStep.id`).
- **Operation:** `prisma.application.update({ where: { id: applicationId }, data: { currentInterviewStep } })`.
- **Transaction needed?** **No.** Single-row update; Prisma `update` is atomic and the validation reads (`Candidate.findOne`, `Application.findUnique`, `InterviewStep.findUnique`) are read-only and cannot leave the DB in an inconsistent state. A `prisma.$transaction([...])` wrapper would be over-engineering for this scope — explicitly **avoid** it (per `20-project-standards.mdc` §architecture principles, do not introduce new patterns).
- **Avoiding the wrong candidate/application:** the candidate↔application ownership check (§5.4) is the structural guard. Without it, the endpoint would silently update an application belonging to another candidate. The check MUST run **before** the update.
- **Concurrent transitions:** Prisma's update is last-writer-wins on `currentInterviewStep`. Two simultaneous PUTs against the same `applicationId` end up with whichever request commits last. Since `Application` has no `version`/`updatedAt` for optimistic locking and adding one is out of scope, document this in §10 and reuse the same behavior as `Candidate.save()` updates (which also have no locking).
- **Invalid state transitions:** No business rule in the schema enforces forward-only step movement. Backwards moves and same-step writes are accepted as 200.

---

## 7. Testing Plan

Reuse the existing testing conventions: `ts-jest` preset, `tests/{services,controllers,integration}` layout, `tests/helpers/factories.ts` reused, `jest.mock('@prisma/client')` factory pattern with `jest.requireMock` (Finding 1 of `QA-get-position-candidates.md`).

> **`409` rows below assume the implementation agent adopts `409 Conflict` for candidate↔application mismatch (§3 rationale). If the agent falls back to `400 { error: "Application does not belong to candidate" }`, change the expected status accordingly in those rows and in the integration test file.**

| # | Scenario | Setup Data | Expected Result | Expected Status Code |
|---|----------|-----------|-----------------|----------------------|
| 1 | Successful stage update | Candidate id=5; Application id=10 with candidateId=5, position.interviewFlowId=1; InterviewStep id=3 with interviewFlowId=1 | Body equals updated Application row with `currentInterviewStep === 3`; `prisma.application.update` called with `{ where: { id: 10 }, data: { currentInterviewStep: 3 } }` | **200** |
| 2 | Idempotent same-stage update | Same as #1 but Application already has `currentInterviewStep === 3` | Body unchanged shape; update still called | **200** |
| 3 | Invalid candidate ID format (`abc`) | Path `:id = "abc"` | `{ error: 'Invalid ID format' }`; service NOT called | **400** |
| 4 | Empty `:id` (`""`) | Path `:id = ""` | `{ error: 'Invalid ID format' }` | **400** |
| 5 | `:id = "0"` boundary (parses but candidate absent) | `Candidate.findOne(0)` resolves null | `{ error: 'Candidate not found' }` | **404** |
| 6 | Candidate not found | `:id = 999`, `Candidate.findOne` resolves null | `{ error: 'Candidate not found' }`; `prisma.application.update` NOT called | **404** |
| 7 | Body missing | `req.body = undefined` (or `{}`) | `{ error: 'Invalid request body' }` (or `Invalid applicationId` if `{}` is treated as object) | **400** |
| 8 | Missing `applicationId` | Body `{ currentInterviewStep: 3 }` | `{ error: 'Invalid applicationId' }` | **400** |
| 9 | Missing `currentInterviewStep` | Body `{ applicationId: 10 }` | `{ error: 'Invalid currentInterviewStep' }` | **400** |
| 10 | Non-integer `applicationId` (`"foo"`, `1.5`) | Body `{ applicationId: 'foo', currentInterviewStep: 3 }` | `{ error: 'Invalid applicationId' }` | **400** |
| 11 | Negative or zero `currentInterviewStep` | Body `{ applicationId: 10, currentInterviewStep: 0 }` | `{ error: 'Invalid currentInterviewStep' }` | **400** |
| 12 | Application not found | Body refers to applicationId=999; `application.findUnique` returns null | `{ error: 'Application not found' }` | **404** |
| 13 | Interview step not found | applicationId valid; `interviewStep.findUnique` returns null for given id | `{ error: 'Interview step not found' }` | **404** |
| 14 | Application belongs to a different candidate (multi-applications case) | Candidate id=5; Application id=11 with candidateId=7 (legal: schema allows multiple apps per candidate) | `{ error: 'Application does not belong to candidate' }` | **409** (or **400** fallback) |
| 15 | Step belongs to wrong InterviewFlow | application.position.interviewFlowId=1; InterviewStep.interviewFlowId=2 | `{ error: "Stage does not belong to the candidate's interview flow" }` | **400** |
| 16 | Race-condition delete (P2025 from update) | All lookups return data; `application.update` rejects with `{ code: 'P2025' }` | `{ error: 'Application not found' }` | **404** |
| 17 | Unexpected DB failure | `application.findUnique` rejects with generic `Error('DB connection lost')` | `{ error: 'Internal Server Error' }`; no stack leak | **500** |
| 18 | Method gating — `GET /candidates/:id/stage` | Real app via supertest | Express returns 404 (path/verb combo not mounted as GET) | **404** |
| 19 | Method gating — `DELETE /candidates/:id/stage` | Real app via supertest | Express returns 404 | **404** |
| 20 | Authorization smoke (no auth in project) | Request without any headers | Reaches handler; returns the same status as #1 | **200** |
| 21 | Candidate with multiple applications — only the matching one is updated | Candidate id=5; Applications id=10 (candidateId=5) and id=11 (candidateId=5); body targets applicationId=10 | Update called with `{ where: { id: 10 }, data: { currentInterviewStep: 3 } }`; application id=11 untouched (verify `update` invoked exactly once with the correct id) | **200** |

**Test layer assignment (mirrors `get-position-candidates.md` precedent):**

- **Service unit tests** (`tests/services/candidateStageService.test.ts`): rows 1, 2, 6, 12–16, 21.
- **Controller unit tests** (`tests/controllers/candidateController.test.ts`, new file or extension): rows 3, 4, 5, 7–11, plus 200 happy-path full equality and 500 mapping with the service mocked.
- **Integration tests** (`tests/integration/candidateRoutes.integration.test.ts`): rows 1, 3, 6, 12, 14, 15, 17, 18, 19, 20 against the real `app`.

**Mock pattern reminder (Finding 1 of `QA-get-position-candidates.md`):**

```ts
jest.mock('@prisma/client', () => {
  const findUniqueApplication = jest.fn();
  const findUniqueInterviewStep = jest.fn();
  const updateApplication = jest.fn();
  const findUniqueCandidate = jest.fn();
  const mockPrismaInstance = {
    candidate: { findUnique: findUniqueCandidate },
    application: { findUnique: findUniqueApplication, update: updateApplication },
    interviewStep: { findUnique: findUniqueInterviewStep },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
    __mocks__: { findUniqueApplication, findUniqueInterviewStep, updateApplication, findUniqueCandidate },
  };
});
```

(Then `const { ... } = (jest.requireMock('@prisma/client') as { __mocks__: ... }).__mocks__;`).

**Coverage:** Project does not enforce coverage thresholds. Run with `npm test`. Verify all suites green with `npm test -- --verbose`.

---

## 8. Documentation Plan

| Doc | Action | Notes |
|-----|--------|-------|
| `backend/api-spec.yaml` | **Required.** Append `paths: /candidates/{id}/stage: put: ...` block. | Mirror the depth of the `/positions/{id}/candidates` block: parameters, requestBody schema (with `applicationId` + `currentInterviewStep` as integers, both `required`), 200 schema (Application row), and 400 / 404 / 409 / 500 examples. |
| `backend/docs/specs/put-candidates-stage.md` | **This file.** | Canonical implementation plan. |
| `backend/docs/QA-get-position-candidates.md` | **Optional, post-impl.** | After tests are written, the test-writer agent should append a `PUT /candidates/:id/stage` audit section parallel to the existing one. Out of scope for this spec. |
| `README.md` | **Optional.** | The repo README is bilingual EN/ES. If the team wants a sample `curl http://localhost:3010/candidates/5/stage -X PUT -H 'Content-Type: application/json' -d '{"applicationId":10,"currentInterviewStep":3}'`, mirror the existing examples. Do not block on this. |
| `.cursor/rules/20-project-standards.mdc` | **No change.** | New endpoint follows existing patterns; no new convention introduced. The `409` choice is a one-off documented in this plan, not a global rule. |
| `swagger-ui-express` mount | **No change.** | Declared but not mounted today; do not wire it as part of this work. |

---

## 9. Implementation Checklist for Backend Agent

Execute in order. Each box should be checked off as the implementation progresses.

1. [ ] **Read** `backend/docs/specs/put-candidates-stage.md` (this plan), `.cursor/rules/20-project-standards.mdc`, and `backend/docs/specs/get-position-candidates.md` (sibling precedent).
2. [ ] **Re-verify** the schema fields used in §2 against `backend/prisma/schema.prisma`. Abort and ask for clarification if `Application.currentInterviewStep` no longer exists or its type has changed.
3. [ ] **Extend** `backend/src/application/validator.ts`:
   - Add `validatePositiveInteger(value, fieldName)` (private helper).
   - Add `export const validateStageUpdatePayload`.
4. [ ] **Create** `backend/src/application/services/candidateStageService.ts`:
   - Module-level `const prisma = new PrismaClient();` (matches `positionCandidateService.ts`).
   - Export `updateCandidateStage(candidateId, body): Promise<DiscriminatedResult>` returning `{ kind: 'ok', application }`, `{ kind: 'candidate_not_found' }`, `{ kind: 'application_not_found' }`, `{ kind: 'application_candidate_mismatch' }`, `{ kind: 'step_not_found' }`, `{ kind: 'invalid_stage_for_flow' }`, or `{ kind: 'invalid_input', field }`.
   - Internally use `Candidate.findOne(candidateId)` (domain model), `prisma.application.findUnique({ where: { id }, include: { position: { select: { interviewFlowId: true } } } })`, `InterviewStep.findOne(currentInterviewStep)` (or `prisma.interviewStep.findUnique({ where, select: { interviewFlowId: true } })` if the include shape pulled by `InterviewStep.findOne` is undesirable), and `prisma.application.update(...)`.
   - Catch `P2025` from the update and remap to `application_not_found`.
5. [ ] **Modify** `backend/src/presentation/controllers/candidateController.ts`:
   - Add and export `updateCandidateStage` handler.
   - Validate `:id`, call the service, switch on the discriminated result, respond per §3 status table.
   - Use `try/catch` around the service call; on unhandled errors respond `500 { error: 'Internal Server Error' }`.
6. [ ] **Modify** `backend/src/routes/candidateRoutes.ts`:
   - Import `updateCandidateStage` alongside existing imports.
   - `router.put('/:id/stage', updateCandidateStage);`
7. [ ] **Confirm** `backend/src/index.ts` already mounts `/candidates` (it does — line 42). Do not add a duplicate mount.
8. [ ] **Update** `backend/api-spec.yaml` with the `/candidates/{id}/stage` PUT entry (request body schema, 200, 400, 404, 409, 500). Match the formatting of existing entries.
9. [ ] **Add factories** to `backend/tests/helpers/factories.ts` (`makeApplicationWithPosition`, `makeInterviewStep`, `makeStageUpdateBody`). **Do not** rename existing exports.
10. [ ] **Create** `backend/tests/services/candidateStageService.test.ts` (rows 1, 2, 6, 12–16, 21 of §7).
11. [ ] **Create** `backend/tests/controllers/candidateController.test.ts` (rows 3, 4, 5, 7–11, plus full-equality 200 happy path and 500 mapping).
12. [ ] **Create** `backend/tests/integration/candidateRoutes.integration.test.ts` (rows 1, 3, 6, 12, 14, 15, 17, 18, 19, 20 against the real `app`).
13. [ ] **Run** `npm run build` and `npm test` from `backend/`; confirm all suites green with no behavior regression in existing `getPositionCandidates` tests.
14. [ ] **Run** lint: `npx eslint . --ext .ts` (or whatever `package.json` exposes); apply Prettier defaults.
15. [ ] **Manual smoke (optional)**: with seeded DB, `curl -X PUT http://localhost:3010/candidates/5/stage -H 'Content-Type: application/json' -d '{"applicationId":10,"currentInterviewStep":3}'`.
16. [ ] **Optional follow-up:** request the test-writer agent to append the `PUT /candidates/:id/stage` audit section to `backend/docs/QA-get-position-candidates.md`.

---

## 10. Assumptions and Open Questions

> Documented assumptions that could not be verified from backend code. The plan adopts each assumption as the safest default; the implementation agent may proceed unless a reviewer objects.

1. **`:id` refers to `Candidate.id`** (not `Application.id`). Justified by the literal path `/candidates/:id/stage` and by candidate-scoped sibling routes.
2. **The "stage" field on the request body is named `currentInterviewStep`** (matching the Prisma column and the response shape of `GET /positions/:id/candidates`), and its value is an **integer FK to `InterviewStep.id`**, not a step slug or name. Risk: a frontend may want a friendlier identifier; this can be added later via an additional `stageName` lookup helper without breaking the FK contract.
3. **Step ↔ flow consistency check is enforced server-side** (§5.5). If a stakeholder requires the server to accept any existing step regardless of flow, drop the cross-check and remove test row #15 — but this is unsafe and should be confirmed.
4. **Single-application updates only.** No bulk-move endpoint (`PUT /candidates/:id/stages`) is part of this spec.
5. **Status code 409** is introduced for the candidate↔application mismatch case. Acceptable fallback: collapse to 400 with the same body. The implementation agent and test rows must agree.
6. **No optimistic locking.** Concurrent PUTs against the same `applicationId` are last-writer-wins. Adding an `updatedAt` / `version` column is **out of scope** (would require a Prisma migration).
7. **No audit trail / history.** The current move overwrites `currentInterviewStep` in place — no separate `ApplicationStageHistory` table is introduced. If history is required, file a follow-up plan.
8. **No `Interview` row creation.** Moving a candidate to a new step does **not** create a new `Interview` record automatically. The schema models `Interview` rows as separate explicit events (with `employeeId`, `interviewDate`, `score`); creating one is the responsibility of a different endpoint.
9. **No frontend coordination.** Per the project rule, this plan does not propose frontend changes. Once the endpoint is live, the frontend may be wired against `http://localhost:3010/candidates/{id}/stage` consistent with the hardcoded base URL pattern documented in `20-project-standards.mdc`.
10. **No new dependencies.** All work uses Express, Prisma, Jest, ts-jest, and supertest already declared in `backend/package.json`.

---

**End of plan.** The Backend Implementation Agent should treat sections 3, 4, 5, 6, and 7 as the binding contract and use sections 1, 2, 8, 9, and 10 as supporting context.
