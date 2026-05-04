# Spec-Driven Plan: GET /positions/:id/candidates

## 1. Backend Context Analysis

- **Backend framework detected:** Express 4 (`backend/package.json`), TypeScript compiled with `tsc`, entry wiring in `backend/src/index.ts`.
- **Relevant architecture pattern:** Layered structure already in use (`routes/` → optional `presentation/controllers/` → `application/services/` → `domain/models/` holding Prisma access). **`GET /positions/:id/candidates` has no analogue yet** — first **position-scoped read** endpoint. **`GET /candidates/:id`** is the closest reference for path-param validation, HTTP status semantics, controller style, and error JSON shape (`backend/src/routes/candidateRoutes.ts`, `backend/src/presentation/controllers/candidateController.ts`).
- **Relevant existing endpoint references:**
  - `GET /candidates/:id` — `parseInt`-based path validation, **`400`** for non-numeric id (`{ error: 'Invalid ID format' }`), **`404`** `{ error: '... not found' }`, **`200`** JSON body (`candidateController.ts` / mounted in `candidateRoutes.ts` + `index.ts`).
  - `POST /candidates` — route-level inline try/catch, **`400`** `{ message }` on `Error`; different from GET pattern (documented discrepancy in `.cursor/rules/20-project-standards.mdc`). **New endpoint should mirror the GET family** (`candidateController`-style **`json`** + **`error`** / structured fields).
- **Relevant folders/files inspected:**
  - `backend/src/index.ts` — mounts `/candidates`, `/upload`; no `/positions`.
  - `backend/src/routes/candidateRoutes.ts`, `backend/src/presentation/controllers/candidateController.ts`
  - `backend/prisma/schema.prisma` — authoritative for `Candidate`, `Position`, `Application`, `Interview`
  - `backend/src/domain/models/Position.ts`, `Application.ts`, `Interview.ts`, `InterviewStep.ts`, `Candidate.ts`
  - `backend/api-spec.yaml` — candidates + `/upload` only (no position paths yet).
  - `backend/jest.config.js` — Jest `ts-jest`, `node` env; **no sample tests present in repo**.
- **Existing conventions to follow:**
  - **Routing:** Export `Router()` from `backend/src/routes/<resource>Routes.ts`; mount via `app.use('/...', importedRouter)` from `index.ts`.
  - **Naming:** camelCase TS files (`positionRoutes.ts` or `candidateRoutes`-parallel naming), PascalCase domain classes aligned with Prisma models.
  - **Formatting:** ESLint + Prettier (`singleQuote`, `trailingComma: 'all'`) per `.cursor/rules/20-project-standards.mdc`.
  - **Data access:** Prisma via **`PrismaClient` inside domain model classes** (`static findOne`, `save`, etc.). Avoid introducing repositories/DI frameworks unless explicitly approved.

**Documentation placement:** Repository has **`backend/api-spec.yaml`** but **no existing `backend/docs/` tree**. This plan lives at **`backend/docs/specs/get-position-candidates.md`** per project instruction fallback when no prior planning folder exists.

---

## 2. Endpoint Specification

### Method and Path

- **`GET /positions/:id/candidates`**  
  Implemented as a nested route mounted under **`/positions`** (e.g. `router.get('/:id/candidates', handler)` mounted with `app.use('/positions', positionRoutes)`), so `:id` is the **numeric position primary key**.

### Purpose

Return every **application in process for the given position** (all `Application` rows with `positionId` equal to `:id`). For each application, expose **candidate full name**, **`currentInterviewStep`** (application’s current step reference), and **average interview score** derived from **`Interview`** records.

### Path Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | integer | **`Position.id`** (Prisma `@id`), must be parseable positive integer semantics consistent with **`getCandidateById`** |

### Request Body

None (`GET`).

### Success Response

- **`200 OK`**
- **Content-Type:** `application/json`

**Suggested response body (implementer aligns field names with existing JSON style — camelCase, matching Prisma/JavaScript norms):**

```json
{
  "positionId": 1,
  "candidates": [
    {
      "applicationId": 10,
      "candidateId": 5,
      "firstName": "Jane",
      "lastName": "Doe",
      "fullName": "Jane Doe",
      "currentInterviewStep": 3,
      "averageInterviewScore": 7.5
    }
  ]
}
```

- **`firstName` / `lastName`:** sourced from `Candidate` model fields `firstName`, `lastName` in `schema.prisma`.
- **`fullName`:** optional convenience string `trim(\`${firstName} ${lastName}\`)`; include if trivial, or omit and let clients concatenate—**implementer chooses one convention and documents in OpenAPI**.
- **`currentInterviewStep`:** scalar **`Application.currentInterviewStep`** in schema — FK value referencing **`InterviewStep.id`** (`fields: [currentInterviewStep]` on relation `interviewStep`) — expose as **`currentInterviewStep`** (camelCase JSON) unless product mandates snake_case; **matching Prisma/export style is preferred** for consistency with GET candidate payloads.
- **`averageInterviewScore`:** number (**see §3 aggregation rule**) or **`null`** when undefined per §3.

**Ordering:** Stable order not specified — **recommended:** `ORDER BY application.applicationDate ASC`, then `application.id ASC`.

### Empty Response

- Position **exists** but has **zero** applications: **`200 OK`** with same envelope and **`"candidates": []`** (or empty array-only if alternate shape chosen—prefer non-breaking nested key for clarity).

### Error Responses

Align with **`getCandidateById`** where applicable:

| Status | Condition | Body shape (match existing GET style) |
|--------|-----------|---------------------------------------|
| **400** | `id` not a finite integer (`NaN`), negative/zero if validated as invalid | `{ "error": "Invalid ID format" }` (same message key as candidate GET) |
| **404** | No `Position` row for parsed `id` | `{ "error": "Position not found" }` |
| **500** | Unexpected DB / server failure | `{ "error": "Internal Server Error" }` (mirror `getCandidateById` catch branch) |

**Note:** Avoid plain-text **500** from unhandled rejects; propagate to Express error middleware only if intentional—today global handler responds text `Something broke!` (**inconsistency** called out in `20-project-standards.mdc`). Prefer **`try/catch` in handler** returning JSON **500** like `candidateController.ts`.

### Authentication and Authorization

- **None** in current codebase. **No middleware** guarding routes. Endpoint remains **anonymous** unless product adds auth later (**out of scope** for this implementation pass).

---

## 3. Data Model and Relationship Analysis

Verified from **`backend/prisma/schema.prisma`**:

- **Candidate source:** Model **`Candidate`** — fields `firstName`, `lastName` (among others).
- **Application source:** Model **`Application`** — `id`, **`positionId`**, **`candidateId`**, **`currentInterviewStep`** (`Int`), `applicationDate`, optional `notes`. Relations: `position`, **`candidate`**, **`interviewStep`** (InterviewStep FK), **`interviews`** Interview[].

- **Interview source:** Model **`Interview`** — `applicationId`, `interviewStepId`, `employeeId`, `interviewDate`, optional `score` (**`Int?`**), optional `result`, optional `notes`.
- **Position / application:** **`Position`** has `applications Application[]`. **`Application.positionId`** → **`Position.id`**.

### Candidate / application / interview relationship

- **`Application`** links **one candidate** (`candidateId`) to **one position** (`positionId`).
- **`Interview`** rows are **`application`-scoped**: `Interview.applicationId` → **`Application.id`**.
- **`Application.currentInterviewStep`** stores the FK to **`InterviewStep.id`** defining the applicant’s pipeline step (**not free text**).

**Schema caveat:** No `@@unique([positionId, candidateId])` on **`Application`** — *the same candidate may have multiple application rows for the same position*. The endpoint MUST return **one list item per `Application`** (not aggregated per distinct candidate unless product later forbids duplicates).

### Score calculation rule (verified linkage)

Compute **average of `Interview.score`** for **`Interview`** rows where **`Interview.applicationId` equals the returned application’s id**.

- Include only interviews where **`score IS NOT NULL`** (Prisma: filter `score: { not: null }`).
- **`averageInterviewScore`** = arithmetic mean as **floating-point** (e.g. sum / count).
- **`averageInterviewScore`: `null`** when **no interviews exist** OR **all scores are null** (**no interviews with numeric score**).

**Ambiguity (explicit assumption):**

- Requirement text could be read as “all interviews ever for the candidate globally.” **`Interview`** has **no direct `candidateId`**; linkage is **`Interview` → Application → Candidate**. **This plan adopts application-scoped average** because the resource is candidates **in process for this position**, keyed by **`Application`** per row.

### Null or missing score behavior

| Situation | `averageInterviewScore` |
|-----------|--------------------------|
| No `Interview` rows for this application | `null` |
| Interviews exist, every `score` is `null` | `null` |
| Mixed null and non-null scores | Average **non-null scores only** |
| Single non-null score | That value as Number (still float if decimals allowed—scores are **`Int`** in DB, average may be fractional) |

---

## 4. Proposed Backend Changes

**Do not implement in this phase** — filenames and responsibilities below.

| Path | Purpose | Expected responsibility | Pattern to follow |
|------|---------|------------------------|-------------------|
| `backend/src/routes/positionRoutes.ts` (new) | Mount nested `GET /:id/candidates` | Wire Express `Router()`, export default; handlers delegate to controller or service consistent with **`candidateRoutes`** (prefer **`getPositionCandidates`** style handler imported from presentation layer vs duplicating POST inline pattern unless justified) | `candidateRoutes.ts` |
| `backend/src/presentation/controllers/positionController.ts` (new) | Parse `params.id`, call service, respond with status/body JSON | Mirrors **`getCandidateById`**: **`parseInt`**, `isNaN` → 400 JSON; service returns null position → **404**; success → **200** JSON envelope | `candidateController.ts` |
| `backend/src/application/services/positionCandidateService.ts` (new name OK) | Load position, fetch applications projection, aggregation | Compose Prisma/domain calls; optionally map to plain DTOs | `candidateService.ts` orchestration patterns |
| `backend/src/domain/models/Application.ts` or `Position.ts` (extend) OR new static method | Encapsulated data access | Prefer **new static finder** (`Application.findManyByPositionIdWithAggregates(...)`) inside **`Application`** or **`Position`** class using **existing `PrismaClient` instantiation pattern** matching sibling models | **`Application.static findOne`** / **`Position.static findOne`** |
| `backend/src/index.ts` | Register router | `import positionRoutes from './routes/positionRoutes'; app.use('/positions', positionRoutes);` | Existing `candidateRoutes` mount |

**Alternative (acceptable if thinner):**

- Invoke **`req.prisma`** from service/controller matching **`index.ts` middleware** injection — **`20-project-standards.mdc`** notes `req.prisma` is currently underused vs model-local clients; extending **either** pattern is acceptable if **localized to new code** without repo-wide refactor.

**Explicitly avoid (this task):**

- New npm dependencies (`prisma`/Express already suffice).
- `infrastructure/` package or generic repository abstraction.
- Migrations (**no schema change needed**).

---

## 5. Query and Aggregation Strategy

**ORM:** Use **Prisma** only (consistent with codebase).

### Recommended retrieval flow (conceptual — pseudocode marking)

**Pseudocode:**

```text
positionId ← parse validated path id
position ← prisma.position.findUnique({ where: { id: positionId } })
IF position NOT FOUND THEN return HTTP 404
applications ← prisma.application.findMany({
  where: { positionId },
  include: {
    candidate: { select: { id, firstName, lastName } },
    interviews: { select: { score } }
  },
  orderBy: [{ applicationDate: 'asc' }, { id: 'asc' }]
})
FOR EACH application Row:
    scores ← application.interviews where score ≠ null → map score
    average ← scores empty ? NULL : SUM(scores) / scores.length
    emit DTO(application.id, candidateId, names, average, application.currentInterviewStep)
RETURN 200 envelope { positionId, candidates: DTO[] }
```

**Why not pure domain class iteration:** Aggregation can live in **`positionCandidateService`** with **one query** (`findMany` + includes) unless team insists all Prisma touches stay inside models — splitting N+1 is avoided via includes.

Optional **single grouped query:** `prisma` does not expose SQL `AVG` in include easily without raw/groupBy—**computed in TS** post-fetch is simplest and avoids raw SQL (**aligns with “no new patterns”** unless performance requires `groupBy`).

**Including step details:** Requirement names scalar **`currentInterviewStep`** — include **`InterviewStep`** name only if stakeholder wants human-readable pipeline label; extend `include: { interviewStep: { select: { id, name, orderIndex } } }`.

---

## 6. Validation and Error Handling Plan

1. **`id` parsing:** **`parseInt(req.params.id, 10)`**; reject **`NaN`**, **`<= 0`** if team wants strict positive ints (currently candidate GET accepts any integer that parses—notably **0** may pass—isNaN-only; align new endpoint with **same laxity OR** tighten together in future).
2. **Position lookup:** **`findUnique`** on **`Position`** before listing applications — **404** when missing (distinguishes “unknown position” from “known position, no applicants”).
3. **Empty applications:** Still **200** with empty **`candidates`** array.
4. **DB failures:** **`try/catch`**, log with **`console.error`** consistent with **`index.ts` / services**; return **JSON 500**.
5. **JSON shape consistency:** Prefer **`Content-Type: application/json`** matching **`candidateController`** (not **`res.send` plain strings**).

---

## 7. Testing Plan

Existing backend has **Jest preset only** (`backend/jest.config.js`) — **no tests** to copy. Prefer **integration-style tests against Prisma test DB** once harness exists, or **`jest.mock('@prisma/client')`** temporarily if DB bootstrap is burdensome (**document bootstrap steps** alongside first test suite).

Each case: clarify **Setup** assumes seed or manual `create` payloads matching schema.

| # | Scenario | Setup data | Expected result | Status |
|---|----------|-----------|-----------------|--------|
| 1 | Valid position, multiple applicants | Position P; Applications A1, A2 for P with candidates C1, C2 | **200**, `positionId` = P, `candidates.length === 2` | **200** |
| 2 | Correct full-name mapping | Candidate with known `firstName`/`lastName` | Entries contain matching names / `fullName` | **200** |
| 3 | `currentInterviewStep` mapping | Known `InterviewStep.id` stored on Application | Returned value equals seeded FK **`Application.currentInterviewStep`** | **200** |
| 4 | Average score | Multiple interviews same application with scores 6,10 | `averageInterviewScore === 8` | **200** |
| 5 | No interviews | Application with zero Interview rows | `averageInterviewScore === null` | **200** |
| 6 | Interviews present, all scores null | Interviews rows with score `null` | `averageInterviewScore === null` | **200** |
| 7 | Mixed null/non-null scores | Scores `{null,4,8}` | Average **non-null**: **6** | **200** |
| 8 | Position with zero applications | Valid position, zero Application rows | `candidates: []` | **200** |
| 9 | Invalid id format (`"abc"`) | n/a | **400**, `{ error: 'Invalid ID format' }` | **400** |
| 10 | Nonexistent position numeric id unused in DB | n/a | **404**, `{ error: 'Position not found' }` | **404** |
| 11 | Auth | n/a — no middleware | Confirm **no authorization check** fires (smoke requesting without headers) — **implicit pass** documenting absence | **200** |

**Note:** If tests run without DB, mocked Prisma should assert **`findUnique`/`findMany`** invocation & mapping logic.

---

## 8. Documentation Plan

1. **`backend/api-spec.yaml`:** Add **`paths` entry** for **`/positions/{id}/candidates`** (`GET`), documenting parameters, **`200`** schema (envelope + item properties), **`400`** / **`404`** / **`500`** consistent with YAML style used for **`/candidates`**.
2. **`README.md`:** Optional sample `curl`; **Spanish/English duplication** mirrors existing README bilingual pattern (**only if README changes are requested** — otherwise **`api-spec`** + this spec suffice).
3. **`.cursor/rules/20-project-standards.mdc`:** **No mandatory update** unless new route patterns warrant note after implementation.

---

## 9. Implementation Checklist for Backend Agent

1. [ ] Add **`backend/src/routes/positionRoutes.ts`** with **`GET '/:id/candidates'`** mapped to **`getPositionCandidates`** (or similarly named exported handler).
2. [ ] Add **`backend/src/presentation/controllers/positionController.ts`** with validation + **`Position`/`Application` lookups** delegated to application service (**mirror `candidateController`** error JSON).
3. [ ] Implement **`backend/src/application/services/positionCandidateService.ts`** (**name flexible**) assembling Prisma **`findUnique`/`findMany`** + average computed in TS.
4. [ ] Extend **`backend/src/domain/models/Application.ts`** (**or**) **`Position.ts`** with a **focused static finder** IF team wants Prisma encapsulated in domain (optional—service direct Prisma allowed per standards conflict note — pick one locality and stay consistent inside new code).
5. [ ] **`mount`** router **`app.use('/positions', positionRoutes)`** inside **`backend/src/index.ts`** **before global error middleware** ordering matches existing mounts (log middleware placement optional—follow **`index.ts` order consciously**).
6. [ ] **Manual sanity check** with seeded DB (**position + applications + interviews**).
7. [ ] **`backend/api-spec.yaml`** updated with **`GET`** contract.
8. [ ] **`backend`** **Jest** tests scaffolding first file (e.g. `backend/tests/positionCandidates.integration.test.ts` OR colocated)—cover rows in §7.
9. [ ] ESLint/prettier on touched TS files (**`npm run build`** prerequisite per project scripts).

---

## 10. Assumptions and Open Questions

1. **`averageInterviewScore`** is **computed per application** (interviews for that **`applicationId`**) rather than aggregated across unrelated applications of the same candidate — **chosen for position-process relevance**.
2. **Full name formatting** joins `firstName` + space + `lastName` trim; localization (single-field names) unspecified.
3. **Duplicate `(positionId, candidateId)` applications** produce **duplicate response rows** unless business rules disallow duplicates externally.
4. **Integer average display:** despite DB `score` **`Int`**, average may be fractional — API returns **`number`** (float).
5. **No `@map` discrepancy checked** — Prisma client field names **`currentInterviewStep`**, **`positionId`** per schema (DB column casing managed by Prisma defaults).
6. **Blocking risks:** minimal — schema fully supports joins; **risk** lies in undocumented business rule forbidding fractional averages or needing **lifetime candidate average** instead of **per-application**.
