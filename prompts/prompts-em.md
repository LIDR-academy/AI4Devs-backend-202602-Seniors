## Project Setup

Prepare the LTI backend project for forward-only feature development using Claude Code and Windsurf with the OpenSpec framework, ensuring AI code generation always follows the target architecture and never drifts toward legacy patterns.

---

## Step 1 — Spec File Review and Update (`ai-specs/specs/backend-standards.md`)

Analysed the existing backend standards spec against the actual codebase and identified gaps where the document was inaccurate or incomplete. Applied three targeted fixes:

**Fix 1 — Added `api-spec.yaml` to the Current Project Structure tree**
The file existed in the repo but was missing from the spec. It is the authoritative OpenAPI 3.0 contract for the API.

**Fix 2 — Added dead code warning to Technical Debt #1**
`src/index.ts` already injects a `PrismaClient` singleton onto `req.prisma` via middleware, but no controller or route uses it. Without an explicit warning, AI codegen could build new features on this dead pattern instead of the correct constructor-injected repository approach. A warning block was added under Debt #1.

**Fix 3 — Added OpenAPI Specification subsection to API Design Standards**
A new subsection documents that `backend/api-spec.yaml` is the API contract, that `swagger-jsdoc` and `swagger-ui-express` are already installed, and that every new endpoint must be reflected in the spec file before or alongside implementation.

---

## Step 2 — Skills Setup

### Global skills (remain global — used as-is)

These skills are installed at `~/.claude/skills/` and apply across all projects:

- **`agile-product-owner`** — stack-agnostic, no project-specific customisation needed. Use for writing INVEST-compliant user stories before starting a new feature.

### Project-level skill override (`.claude/skills/typescript-unit-testing/skill.md`)

The global `typescript-unit-testing` skill is written for NestJS + `@golevelup/ts-jest`. This project uses plain Express + `ts-jest`. A project-level override was created at `.claude/skills/typescript-unit-testing/skill.md` that:

- Removes all NestJS utilities (`@golevelup/ts-jest`, `createMock`, `DeepMocked`, `Test.createTestingModule`)
- Replaces with native `jest.fn()` and `jest.Mocked<T>` patterns
- Includes Express-specific `req`/`res` mock helpers for controller tests
- Uses `.test.ts` extension (project convention, not `.spec.ts`)
- Sets 90% coverage threshold (matching the spec, not global's 80%)
- Updates trigger keywords to include `express`, `controller`, `repository`

Project-level skills override global ones with the same name, so this applies only to this project.

---

## Step 3 — CLAUDE.md

Created `CLAUDE.md` at the project root. This file is loaded automatically into every Claude Code conversation and encodes all project constraints so they don't need to be repeated each session.

Key sections:

- **Forward-only development rule** — never refactor legacy code unless strictly required by the feature being built
- **Target layer order** — `api-spec.yaml` → route → controller → service → repository interface → infrastructure implementation
- **Dead code warning** — explicit instruction not to build on `req.prisma`
- **API contract rule** — `api-spec.yaml` must be updated with every new endpoint
- **Response envelope standard** — `{ success, data }` / `{ success, error: { message, code } }`
- **Testing requirements** — `.test.ts` co-located files, `jest.fn()` mocks, 90% coverage, `npm test` before done
- **Tech stack quick reference** and dev scripts
- **Known technical debt summary** — patterns that must never be replicated in new code

---

## Step 4 — OpenSpec Configuration (`openspec/config.yaml`)

The project context and rules were added to `openspec/config.yaml`. This is the correct extension point: context and rules are injected automatically into every `openspec instructions` call, so both Claude Code (`/opsx:propose`, `/opsx:apply`) and Windsurf pick them up from a single source of truth.

**`context` block** includes:
- Full tech stack and testing tools
- The six-layer architecture with numbered order
- Forward-only rule and explanation
- Known dead code patterns to avoid
- API contract rule
- Response envelope standard
- Language requirement (English only)

**`rules` block** enforces per-artifact constraints:
- `proposal` — must declare which layers will be created and include a Non-goals section listing legacy files not being touched
- `design` — must show full file paths, define the repository interface before implementation detail, and include `api-spec.yaml` changes
- `tasks` — first task is always updating `api-spec.yaml`; every implementation task is paired with a test task; last task is always running `npm test` at 90% coverage

---

## Step 5 — Feature Development Workflow: `GET /positions/:id/candidates`

### `/enrich-us` — Requirement Enrichment

**Raw requirement provided:**
> `GET /positions/:id/candidates` — retrieve all candidates in process for a position, with full name, current interview step, and average score across interviews.

**What the command did:**

Invoked the `agile-product-owner` skill to produce an INVEST-compliant draft, then evaluated it against 8 completeness criteria. All 8 were missing or incomplete:

| # | Gap | Resolution |
|---|---|---|
| 1 | No actor or business value | Recruiter persona + pipeline view benefit |
| 2 | Field types/nullability unclear | Full DTO: `candidateId`, `fullName`, `currentInterviewStep`, `averageScore` (nullable) |
| 3 | No full endpoint spec | Request params + 4 response shapes with status codes and JSON examples |
| 4 | No file list | 9 new files + 3 modified files mapped to each architecture layer |
| 5 | No DoD | 14-item checklist |
| 6 | No docs update | `api-spec.yaml` listed as required change |
| 7 | No test spec | 3 units to test, mocking strategy, AAA example |
| 8 | No NFRs | Validation, error handling via `NotFoundError`/`next()`, performance note, security note |

**Output:** `ai-specs/changes/get-position-candidates.md`

---

### `/opsx-propose` — OpenSpec Change Proposal

Used the enriched story as context to run `openspec propose`, generating a full 4-artifact change at `openspec/changes/get-position-candidates/`.

**Artifacts created:**

- **`proposal.md`** — Why (missing pipeline query), What (new endpoint across full target stack), Capabilities (`position-candidates`), Impact (file list), Non-goals (all legacy files explicitly excluded).

- **`design.md`** — 6 key technical decisions with rationale: repository interface in `src/domain/repositories/`, single Prisma `include` query (no N+1), average score computed in service layer, position existence check separate from data fetch, `NotFoundError` custom class, constructor-injected `PrismaClient`. Includes full repository interface contract, `PositionCandidateDto` type, and the exact `api-spec.yaml` YAML block to add.

- **`specs/position-candidates/spec.md`** — 12 WHEN/THEN scenarios across 5 requirements: endpoint behaviour (happy path, empty, 404, 400), full name composition, average score edge cases (all null, mixed null/non-null, no interviews), response envelope consistency, OpenAPI contract presence.

- **`tasks.md`** — 19 tasks across 10 groups, ordered by dependency (API contract → domain errors → repository interface → infrastructure → service → controller → routes → error middleware → app wiring → test infrastructure → verification). Every implementation task paired with a test task.

---

### `/opsx-apply` — Implementation (`get-position-candidates`)

Implemented all 17 tasks from `openspec/changes/get-position-candidates/tasks.md` using Windsurf/Cascade.

**Files created:**

| File | Purpose |
|---|---|
| `backend/src/domain/errors/NotFoundError.ts` | Custom error class (`name = "NotFoundError"`) |
| `backend/src/domain/repositories/IPositionRepository.ts` | `ApplicationWithCandidate` interface + `IPositionRepository` contract |
| `backend/src/infrastructure/repositories/PositionRepository.ts` | Prisma implementation with constructor-injected `PrismaClient` |
| `backend/src/infrastructure/repositories/PositionRepository.test.ts` | 6 unit tests: `existsById` true/false, `findCandidatesByPositionId` mapping, correct Prisma clauses |
| `backend/src/application/services/positionService.ts` | `PositionService.getCandidatesByPosition` — existence check, averageScore computation, DTO mapping |
| `backend/src/application/services/positionService.test.ts` | 8 unit tests: NotFoundError, empty array, null scores, mixed scores, fullName composition |
| `backend/src/presentation/controllers/positionController.ts` | `makeGetPositionCandidates` factory handler — 400 for invalid id, 404/500 via error name check |
| `backend/src/presentation/controllers/positionController.test.ts` | 6 unit tests: 400 (non-numeric, zero, negative), 404, 200 envelope, next(error) |
| `backend/src/routes/positionRoutes.ts` | Express router wiring `GET /:id/candidates` with injected dependencies |

**Files modified:**

| File | Change |
|---|---|
| `backend/api-spec.yaml` | Added `GET /positions/{id}/candidates` with 200/400/404/500 schemas |
| `backend/src/index.ts` | Mounted `/positions` route; updated error middleware to return 404 for `NotFoundError` |
| `backend/jest.config.js` | Added `coverageThreshold` (90% branches/functions/lines/statements) |
| `backend/package.json` | Added `test:coverage` script |

**Test results:** 20/20 passing · 100% statements/functions/lines · 94.44% branches (all above 90% threshold) ✓

**Notable implementation decision:** `instanceof NotFoundError` checks use `error.name === 'NotFoundError'` instead to avoid ts-jest module isolation issues where the same class imported across test boundaries may not satisfy `instanceof`.

---

## Session 2 — Feature Development: `PUT /candidates/:id/stage`

### `/enrich-us` — Requirement Enrichment

**Raw requirement provided:**
> `PUT /candidates/:id/stage` — Este endpoint actualizará la etapa del candidato movido. Permite modificar la fase actual del proceso de entrevista en la que se encuentra un candidato específico.

**Analysis:**

The requirement was evaluated against 8 completeness criteria. All 8 were missing or incomplete:

| # | Gap | Resolution |
|---|---|---|
| 1 | No actor or business value | Recruiter/hiring manager persona + tracking pipeline progress |
| 2 | No data fields listed | `applicationId`, `newInterviewStep`, `notes` (optional) |
| 3 | Endpoint structure incomplete | Full request/response with 200/400/404/500 status codes |
| 4 | No architecture mapping | 7 new files + 3 modified files across all layers |
| 5 | No DoD checklist | 12-item checklist including api-spec update |
| 6 | No documentation requirement | OpenAPI spec update explicitly required |
| 7 | No test requirements | Repository, Service, Controller tests with 90% coverage |
| 8 | No NFRs | Security (IDOR prevention), performance, error handling |

**Output:** `ai-specs/changes/update-candidate-stage.md`

---

### `/opsx-propose` — OpenSpec Change Proposal

Used the enriched story as context to run `openspec propose update-candidate-stage`, generating a full 4-artifact change at `openspec/changes/update-candidate-stage/`.

**Artifacts created:**

- **`proposal.md`** — Why (missing stage progression capability), What (PUT endpoint across full target stack), Capabilities (`update-candidate-stage`), Impact (file list), Non-goals (explicitly excludes all legacy refactoring).

- **`design.md`** — 7 key technical decisions: repository interface with 4 methods, service layer with validation sequence, IDOR protection via application ownership check, interview step validation against position's flow, enriched response with previous/current step, `ValidationError` for 400s, unit test strategy with Jest mocking.

- **`specs/update-candidate-stage/spec.md`** — 13 WHEN/THEN scenarios: happy path, candidate not found, application not found (IDOR protection), invalid interview step, missing/invalid body fields, non-numeric/negative IDs, notes too long, optional notes omitted, database error handling.

- **`tasks.md`** — 14 tasks across 8 groups, ordered by dependency (API contract → domain → infrastructure → application validation → service → controller → routes → verification). Every implementation task paired with a test task; final task verifies 90% test coverage.

**All artifacts complete! Ready for `/opsx-apply` to begin implementation.**

---

### `/opsx-apply` — Implementation

All 13 tasks from `tasks.md` implemented across two sessions.

**Files created:**

| File | Purpose |
|---|---|
| `backend/src/domain/repositories/IApplicationRepository.ts` | Interface with 5 methods: `candidateExists`, `findByIdAndCandidateId`, `updateInterviewStep`, `isValidInterviewStepForPosition`, `getInterviewStepName` |
| `backend/src/infrastructure/repositories/ApplicationRepository.ts` | Prisma implementation with constructor-injected `PrismaClient` |
| `backend/src/infrastructure/repositories/ApplicationRepository.test.ts` | 16 unit tests across all 5 repository methods |
| `backend/src/application/services/candidateStageService.ts` | `CandidateStageService.updateCandidateStage` — candidate existence, IDOR check, step validation, update, DTO mapping |
| `backend/src/application/services/candidateStageService.test.ts` | 9 unit tests: NotFoundError (candidate), NotFoundError (app/IDOR), ValidationError (bad step), success, notes passing, argument verification, edge cases |
| `backend/src/presentation/controllers/candidateStageController.ts` | `makeUpdateCandidateStage` factory handler — 400 for invalid ID, ValidationError from validator, 404/400 from service, 200 success envelope |
| `backend/src/presentation/controllers/candidateStageController.test.ts` | 11 unit tests covering all HTTP response paths |
| `backend/src/application/validator.test.ts` | 33 unit tests for `validateStageUpdateData` (new) and `validateCandidateData` (legacy, added to meet global coverage threshold) |

**Files modified:**

| File | Change |
|---|---|
| `backend/api-spec.yaml` | Added `PUT /candidates/{id}/stage` with full request/response schemas |
| `backend/src/application/validator.ts` | Added `ValidationError` class, `ValidationErrorDetail` interface, `StageUpdateData` interface, `validateStageUpdateData` function |
| `backend/src/routes/candidateRoutes.ts` | Added `PUT /:id/stage` with full DI chain: `PrismaClient → ApplicationRepository → CandidateStageService → makeUpdateCandidateStage` |

**Test results:** 96/96 passing · 100% statements/functions/lines · 98.4% branches (all above 90% threshold) ✓

**Notable implementation decisions:**

- Added `candidateExists` to `IApplicationRepository` (beyond the original spec) to distinguish `Candidate not found` (404) from `Application not found for this candidate` (404) — required for spec compliance.
- `instanceof ValidationError` checks in the controller use `error.name === 'ValidationError'` instead, matching the existing `NotFoundError` pattern and avoiding ts-jest module isolation issues. This is a production-safe improvement, not a workaround — the `name` check is more robust across module boundaries.
- `jest.mock` with `...jest.requireActual` pattern used for controller tests so `validateStageUpdateData` can be mocked while keeping the real `ValidationError` class reference consistent for `error.name` checks.

**Manual verification (curl):** All 4 test cases confirmed against live DB:
- `200` — stage updated from step 2 → 3 with correct `previousStep`, `stepName`, `updatedAt`
- `404` — candidate not found
- `400` — invalid interview step for position
- `400` — missing body fields with `details` array

---