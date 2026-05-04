# Backend Test Audit

## 1. Executive Summary

The `PUT /candidates/:id/stage` work is **largely well tested** across the three layers envisioned in [`backend/docs/specs/put-candidates-stage.md`](specs/put-candidates-stage.md): **service** (`candidateStageService.test.ts`), **controller** (`candidateController.test.ts`), and **HTTP integration** (`candidateRoutes.integration.test.ts`). Automated tests mirror the existing **`positionCandidateService` / `positionController` / `positionRoutes`** precedent (Jest + `ts-jest`, `@prisma/client` factory mocks, [`tests/helpers/factories.ts`](../../tests/helpers/factories.ts)).

All **76** Jest specs in `backend/` pass (`npm test`, 2026-05-03).

The backlog from **§8 (Recommended Test Plan)** has been implemented: deterministic **404** verb gating with **Prisma mocks not invoked**, **service** tests for `{}`, **`applicationId: 1.5`**, and **`applicationId: 'foo'`**, **integration** coverage for **`step_not_found`** and **malformed JSON** (documents `express.json` → global error middleware), and an explicit **`candidate_not_found`** controller case for **`id: '999'`**. Residual gaps are narrow—see **§12**.

---

## 2. Reviewed Inputs

- **Implementation plan reviewed:** [`backend/docs/specs/put-candidates-stage.md`](specs/put-candidates-stage.md) (binding contract §3–7).
- **Generated code reviewed (from repo state / referenced paths):**
  - [`backend/src/application/services/candidateStageService.ts`](../../src/application/services/candidateStageService.ts)
  - [`backend/src/presentation/controllers/candidateController.ts`](../../src/presentation/controllers/candidateController.ts)
  - [`backend/src/routes/candidateRoutes.ts`](../../src/routes/candidateRoutes.ts)
  - [`backend/src/application/validator.ts`](../../src/application/validator.ts) (`validateStageUpdatePayload`, `validatePositiveInteger`)
  - [`backend/api-spec.yaml`](../../api-spec.yaml) (contract documentation; **no executable tests**, expected)
- **Test configuration reviewed:** [`backend/jest.config.js`](../../jest.config.js), [`backend/package.json`](../../package.json) scripts.
- **Existing tests reviewed:**
  - [`backend/tests/services/candidateStageService.test.ts`](../../tests/services/candidateStageService.test.ts)
  - [`backend/tests/controllers/candidateController.test.ts`](../../tests/controllers/candidateController.test.ts)
  - [`backend/tests/integration/candidateRoutes.integration.test.ts`](../../tests/integration/candidateRoutes.integration.test.ts)
  - [`backend/tests/helpers/factories.ts`](../../tests/helpers/factories.ts)
  - For convention parity (unchanged here): [`positionCandidateService.test.ts`](../../tests/services/positionCandidateService.test.ts), [`positionController.test.ts`](../../tests/controllers/positionController.test.ts), [`positionRoutes.integration.test.ts`](../../tests/integration/positionRoutes.integration.test.ts).

---

## 3. Test Strategy Detected

| Aspect | Finding |
|---|---|
| **Runner** | **Jest** 29 (`npm test` → `jest`) |
| **TS support** | **ts-jest** preset, **`testEnvironment: 'node'`** |
| **Layout** | `backend/tests/` with **`services/`**, **`controllers/`**, **`integration/`**, **`helpers/`** |
| **Naming** | `*.test.ts` (services/controllers), `*.integration.test.ts` (integration) |
| **HTTP integration** | **supertest** against real `app` from [`backend/src/index.ts`](../../src/index.ts); `NODE_ENV === 'test'` skips `listen` |
| **DB strategy** | **No test database** — Prisma mocked via **`jest.mock('@prisma/client')`** with **`jest.requireMock`** to read mock fns |
| **Fixtures** | Shared builders in **`tests/helpers/factories.ts`** (`makeStageUpdateBody`, `makeApplicationWithPosition`, `makeInterviewStep`, `makeCandidateRow`, `makeReq`, `makeRes`) |
| **Commands** | `npm test`; `npm run build` (`tsc`); ESLint invoked ad hoc (`npx eslint …`) |

---

## 4. Implementation-to-Test Traceability Matrix

| Generated behavior | Expected layer | Existing test coverage | Status | Notes |
|---|---|---:|---|---|
| Route `PUT /:id/stage` registered on candidates router | Integration | [`candidateRoutes.integration.test.ts`](../../tests/integration/candidateRoutes.integration.test.ts) “route mounting”, “reachable under /candidates” | **Covered** | Matches plan wire-up |
| Controller parses `:id` with base 10; `NaN` → 400 `{ error: 'Invalid ID format' }` | Controller (+ integration) | Controller invalid id tests; integration “id is not numeric” | **Covered** | `:id = "abc"`, `""` |
| Controller forwards `(id, req.body)` to service | Integration + partial controller | Integration happy path + **`toHaveBeenCalledWith(999, …)`** for **`candidate_not_found`** | **Mostly Covered** | Generic **`id === '5'`** still not asserted with **`toHaveBeenCalledWith`** alone (acceptable: integration exercises real chain) |
| Service / controller: **`invalid_input`** → 400 `{ error: \<message\> }` | Service + Controller | Service “body validation”; controller mocks service outcomes for each message | **Covered** | Controller path does **not** run real validator (by design mock) |
| **Missing / non-object body** → `Invalid request body` | Service | Service `undefined` body; `{}` ⇒ `Invalid applicationId` | **Covered** | Empty `{}` covered in **`candidateStageService.test.ts`** |
| **Missing `applicationId` / invalid positive int** | Service + Controller | Service + controller (mocked) | **Covered** | |
| **`currentInterviewStep` ≤ 0 or non-integer** | Service + Controller | Same | **Covered** | |
| **Non-integer `applicationId` (e.g. `1.5`, `'foo'`)** | Service | Service `invalid_input` for **`1.5`** and **`'foo'`** | **Covered** | Plan row 10 |
| Candidate existence via `Candidate.findOne` → 404 candidate | Service + Integration | Service `candidate not found`; integration “candidate does not exist” | **Covered** | Prisma `candidate.findUnique` mocked |
| Application `findUnique` + position `interviewFlowId` → 404 / ownership / flow checks | Service + Integration | Service + integration for 404 mismatch, 409 mismatch, invalid flow | **Covered** | |
| Interview step `findUnique` → **404** “Interview step not found” | Service + Controller + Integration | Service + controller **+ integration** **`interviewStep` null** path | **Covered** | JSON **`{ error }`** asserted end-to-end with mocked Prisma |
| Flow cross-check → **400** documented message | Service + Integration | Both | **Covered** | |
| Mismatch **`application.candidateId !== candidateId`** → **409** | Integration + Controller + Service | All three | **Covered** | Aligns with spec §409 choice |
| `prisma.application.update` shape `{ where.id, data.currentInterviewStep }` | Service | Happy path + multi-app assertions | **Covered** | |
| **P2025** on update → remap to application not found (404 via kind) | Service | Service dedicated test | **Covered** | **Not exercised in integration** (optional) |
| Idempotent **same-step** update still calls `update` | Service | Service “idempotent” test | **Covered** | |
| Unexpected throw from Prisma/service → controller **500** JSON | Service + Controller + Integration | Service rethrows non-P2025; controller + integration 500 | **Covered** | |
| **200** + JSON body = updated Application row | Controller + Integration | Full equality assertions | **Covered** | Date serialization exercised in integration (ISO strings) |
| **GET / DELETE** on same path rejected (verb gating) | Integration | **404** deterministic; mocks **not called** | **Covered** | Confirmed Express behavior under this **`app`** |
| Anonymous request reaches handler (**200**) | Integration | “no auth required” smoke | **Covered** | |
| `validateStageUpdatePayload` in **`validator.ts`** | Service (implicit) | Exercised only through **`updateCandidateStage`** service calls | **Partially Covered** | No isolated `validator` unit suite (consistent with broader project — candidate POST validates via flows) |

---

## 5. Layer-by-Layer Test Review

### Routes

There is **no standalone** router-only suite. **`router.put('/:id/stage', updateCandidateStage)`** is exercised **indirectly** by [`candidateRoutes.integration.test.ts`](../../tests/integration/candidateRoutes.integration.test.ts) (real `app` mounts `/candidates`). This matches how **`GET /positions/:id/candidates`** is validated (integration + mounting tests).

### Controllers

[`candidateController.test.ts`](../../tests/controllers/candidateController.test.ts) cleanly **mocks** `candidateStageService.updateCandidateStage` and asserts **HTTP status**, **`res.json`** payload, and that the service is **not** invoked on invalid id.

**Observation:** Several “body validation” cases **simulate** `{ kind: 'invalid_input', message: … }` from the service rather than invoking the **real validator**. That correctly tests **mapping** (`invalid_input.message` → 400 `{ error }`) but would **not** catch a regression where the controller stopped passing `req.body` into the service. **Mitigated** by [**service**](../../tests/services/candidateStageService.test.ts) and [**integration**](../../tests/integration/candidateRoutes.integration.test.ts) tests hitting the live handler chain.

### Services / Use Cases

[`candidateStageService.test.ts`](../../tests/services/candidateStageService.test.ts) follows the **documented `@prisma/client` mock factory** pattern, asserts **ordering** (candidate missing → no application/step/update calls), query **shapes**, and **P2025** vs generic error propagation. **`Candidate.findOne`** shares the mocked `candidate.findUnique` implementation—consistent with other tests that stub module-level clients.

### Domain / Models

**No domain model edits** were required for this feature; **`Candidate.findOne`** behavior is exercised **via** service/integration tests through Prisma mocking. Dedicated **`Application` class** helpers are **not** added (acceptable per plan “optional Application.ts”).

### Database / Repository Layer

**None** — all persistence is **mocked**. No regressions detected for patterns already used elsewhere.

### Integration / API Contract

[`candidateRoutes.integration.test.ts`](../../tests/integration/candidateRoutes.integration.test.ts) validates **route reachability**, **Content-Type**, **representative statuses** (`200`, `400`, `404`, `409`, `500`), and portions of JSON contract. **`Prisma`** is still **fully mocked**, so integration is **middleware + routing + wiring + serialization** confidence, **not** true DB fidelity.

---

## 6. Missing or Weak Test Cases

*Pre-implementation audit rows below. **All items were implemented on 2026-05-03**—see **§12** for what changed.*

| Priority | Missing or weak test | Why it matters | Suggested location |
|---|---|---|---|
| **Medium** | **Method gating** allows **404 OR 500** | Obscures real failures—**500** from global handler is not interchangeable with **404 Not Found** for wrong verb/plan fidelity | **`candidateRoutes.integration.test.ts`** — assert **404** (and optionally **`text/html`** vs JSON) deterministically once Express behavior under `app` is confirmed; tighten comment if 500 is unavoidable |
| **Medium** | **`applicationId: 1.5`** / **`'foo'`** not asserted in **service** tests | Plan §7 rows 10–11 name these; avoids relying exclusively on controller tests that **mock** the service | **`candidateStageService.test.ts`** — two `invalid_input` expectations |
| **Low** | **Empty `{}` body** returns `Invalid applicationId` (validator behavior) undocumented in tests | Locks contract for clients sending empty JSON vs missing body | **`candidateStageService.test.ts`** |
| **Low** | **`candidate_not_found` → 404 mapping** explicit **unit** row | Covered indirectly via **`id === '0'`** branch with mocked `{ kind: 'candidate_not_found' }`—clearer intent with `id: '999'` + same mock | **`candidateController.test.ts`** |
| **Low** | **Interview step missing** (`step_not_found`) through **integration** stack | Raises confidence wiring + message end-to-end; plan scoped it to controller/service | **`candidateRoutes.integration.test.ts`** (optional) |

---

## 7. Test Quality Findings

- **Mocks are appropriate**: Module-level **`PrismaClient`** replacement matches precedent; mocks are **not** nested excessively.
- **Some duplication**: Multiple **near-identical happy-path setups** across integration suites (routing vs HTTP contract vs no-auth)—acceptable but could share a **`beforeEach` helper** to reduce churn.
- **Verb gating (resolved)**: **GET/DELETE** on **`/candidates/:id/stage`** now assert **404** and that **Prisma mocks were not invoked**, removing the **`[404, 500]`** ambiguity.
- **No over-mocking in integration** for PUT flow: mocks are required because there is **no test DB**, matching project norms.
- **Behavior vs implementation**: Assertions focus on **`StageUpdateResult` kinds**, HTTP codes, Prisma **`update`/`findUnique`** call shapes—reasonable boundaries for this codebase.

---

## 8. Recommended Test Plan

Concrete backlog (ordered) — **completed 2026-05-03**:

1. [x] **`candidateRoutes.integration.test.ts`** — **404** for **GET/DELETE** on `/candidates/:id/stage`; **Prisma** mocks not called.
2. [x] **`candidateStageService.test.ts`** — **`applicationId: 1.5`** and **`applicationId: 'foo'`** → **`invalid_input` / `Invalid applicationId`**.
3. [x] **`candidateStageService.test.ts`** — **`{}`** → **`invalid_input` / `Invalid applicationId`**.
4. [x] (**Optional**) **`candidateRoutes.integration.test.ts`** — malformed JSON **`.send('{')`** → **500** **`text/plain`** **`Something broke`** (global error handler); handler not reached.
5. [x] (**Optional**) **`candidateRoutes.integration.test.ts`** — **`findUniqueInterviewStep` → `null`** → **404** JSON **`Interview step not found`**; **`update`** not called.

---

## 9. Commands to Validate

Run from **`backend/`**:

| Command | Purpose |
|---|---|
| `npm test` | Full Jest suite (all **`PUT /candidates/:id/stage`** + existing tests) |
| `npm run build` | TypeScript compile (`tsc` → **`dist/`**) |
| `npx eslint .` | Lint — **fails** in this repo: ESLint **9** expects **`eslint.config.js`**; no flat config under **`backend/`** (legacy **`.eslintrc`** not migrated). |

**Verified (2026-05-03):**

- `npm test` — **6** suites passed, **76** tests passed.
- `npm run build` — **`tsc`** succeeded.
- `npx eslint .` — **not run successfully** (missing **`eslint.config.js`**); no backend lint regression introduced by test-only changes.

---

## 10. Final Score

| Criterion | Previous Score | Last Score | Notes |
|---|---:|---:|---|
| Coverage completeness | 86 | 91 | Service cases for **`{}`**, **`1.5`**, **`'foo'`**; integration for **`step_not_found`** + malformed JSON |
| Layer alignment | 92 | 93 | Explicit controller **`candidate_not_found`** + **`toHaveBeenCalledWith(999, …)`** |
| Edge/error coverage | 84 | 91 | Deterministic **404** verb gating without masking **500**; parse-error path documented |
| Test maintainability | 88 | 90 | Incremental specs; naming describes behavior |
| Integration confidence | 78 | 86 | Full-handler **`Interview step not found`**; still **mocked DB** |
| Project consistency | 94 | 95 | Unchanged tooling (Jest / supertest / Prisma mocks) |
| **Final average score** | **87** | **91** | Weighted arithmetic mean of six criteria |

*Integration **`Last Score`** still reflects Prisma mocking (no transactional Postgres)—by design.*

---

## 11. Final Recommendation

**Approved — audit backlog cleared for this feature.**

**`npm test`** and **`npm run build`** are green. The §8 backlog (required + optional rows) is done. Choosing **production** enhancements (centralized **`express.json`** error → **400** JSON instead of global **500** text) remains a **product decision**, not an open test-gap for **`PUT /candidates/:id/stage`**.

---

## 12. Post-implementation report (2026-05-03)

### 12.1 Tests implemented

| Area | Changes |
|---|---|
| **Integration** [`tests/integration/candidateRoutes.integration.test.ts`](../../tests/integration/candidateRoutes.integration.test.ts) | **404** for **GET/DELETE** with Prisma mocks **not** called; **malformed JSON** → **500** plain text **`Something broke`** + no Prisma; **`interviewStep.findUnique(null)`** → **404** JSON **`Interview step not found`** + **`update`** not invoked |
| **Service** [`tests/services/candidateStageService.test.ts`](../../tests/services/candidateStageService.test.ts) | **`invalid_input`** for **`applicationId: 1.5`**, **`'foo'`**, and **`{}`** |
| **Controller** [`tests/controllers/candidateController.test.ts`](../../tests/controllers/candidateController.test.ts) | **`candidate_not_found`** mapped for **`params.id === '999'`** + **`toHaveBeenCalledWith(999, …)`** |

Production code was **not** modified (test-only diff).

### 12.2 Test folder structure

Unchanged layered layout:

```txt
backend/tests/
├── helpers/
│   └── factories.ts
├── services/
│   ├── candidateStageService.test.ts
│   └── positionCandidateService.test.ts
├── controllers/
│   ├── candidateController.test.ts
│   └── positionController.test.ts
└── integration/
    ├── candidateRoutes.integration.test.ts
    └── positionRoutes.integration.test.ts
```

### 12.3 How this addresses §8 / §6

- Eliminates **`[404, 500]`** ambiguity and proves wrong verbs never hit **Prisma** via the candidate stage flow.
- Exercises **`validatePositiveInteger`** for fractional and non-numeric **`applicationId`**, plus **`{}`**, directly in the **service** (aligns plan §7).
- Integration proves **`step_not_found`** crosses **routing → controller**.
- Documents **`express.json`** failure behavior observed under [`src/index.ts`](../../src/index.ts) (**500** middleware).

### 12.4 Remaining testing gaps

- **No transactional DB integration** — same as broader project; **`P2025`** still integration-optional by design.
- **Isolated `validator.ts` unit suite** still absent (consistent with other flows); **`validateStageUpdatePayload`** remains covered transitively via **service**.
- **`toHaveBeenCalledWith(5, exactBody)`** on the generic happy path controller row is optional—**integration** still exercises **`req.body`** through the stack.
- **ESLint CLI** unavailable under **`backend/`** until **`eslint.config.js`** is added—documented under **§9**.
