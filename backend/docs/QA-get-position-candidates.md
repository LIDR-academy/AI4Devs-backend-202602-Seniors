# Backend Test Audit

> **Endpoint:** `GET /positions/:id/candidates`  
> **Original audit date:** 2026-05-03  
> **Audit update date:** 2026-05-03 (post-implementation)  
> **Auditor role:** Senior Backend Test Engineer

---

## 1. Executive Summary

### Original (pre-implementation)

The generated backend code was **partially tested**. The service and controller layers had solid unit-test coverage for all 11 plan scenarios and the tests executed cleanly (16/16 pass). However, the **route layer was entirely untested**, two specific edge cases from the spec were not exercised, and the mock setup contained a **Jest hoisting fragility** that could cause silent failures if the test file was restructured. One production correctness risk — `id: 0` reaching the database unchecked — was not covered.

### Updated (post-implementation)

The generated backend code is now **fully tested across all three application layers** with **32 tests across 3 layered suites, all passing**. Every recommendation from the original audit's mandatory and recommended sections has been implemented:

- The mock hoisting pattern was rewritten so mock functions are declared inside the `jest.mock` factory and accessed via `jest.requireMock` (Finding 1 resolved).
- The controller 200 response is now asserted with a full equality check (Finding 3 resolved).
- The `id: 0` boundary is explicitly tested at the controller layer (gap closed).
- `supertest` was added as a `devDependency` and a route-layer integration suite of 9 tests now exercises the real `app` from `src/index.ts` (route layer no longer untested).
- Single-score, fractional-average, duplicate `(positionId, candidateId)`, and `fullName` whitespace-trim scenarios are now covered.

Tests are organized by application layer under `backend/tests/{services,controllers,integration,helpers}` consistent with the project's flat-file convention extended into per-layer subfolders.

**Final recommendation: Approved.**

---

## 2. Reviewed Inputs

- **Implementation plan reviewed:** `backend/docs/specs/get-position-candidates.md`
- **Generated code reviewed:**
  - `backend/src/routes/positionRoutes.ts`
  - `backend/src/presentation/controllers/positionController.ts`
  - `backend/src/application/services/positionCandidateService.ts`
  - `backend/src/index.ts` (modified — added `positionRoutes` mount and an `NODE_ENV !== 'test'` guard around `app.listen`; see §11)
  - `backend/api-spec.yaml`
- **Test configuration reviewed:** `backend/jest.config.js`, `backend/package.json`
- **Existing tests reviewed:** all four files under `backend/tests/` (post-implementation)

---

## 3. Test Strategy Detected

| Aspect | Detected configuration |
|---|---|
| Test runner | Jest 29 (`jest`) |
| TypeScript support | `ts-jest` preset, `testEnvironment: 'node'` |
| Test command | `npm test` (runs `jest`) |
| Verbose mode | `npm test -- --verbose` |
| Build command | `npm run build` (runs `tsc`) |
| Test file location | `backend/tests/{services,controllers,integration,helpers}/` |
| Test file naming | `<feature>.test.ts` (suite-layer) and `<feature>.integration.test.ts` |
| Mocking strategy (service tests) | `jest.mock('@prisma/client')` with mocks declared inside the factory |
| Mocking strategy (controller tests) | `jest.mock('positionCandidateService')` for clean isolation from data path |
| Mocking strategy (integration tests) | `jest.mock('@prisma/client')` against the real `app` from `src/index.ts` |
| HTTP integration test library | `supertest` 7.x (added as `devDependency`) |
| DB test strategy | Mocked Prisma client at module level; no real DB harness (consistent with pre-existing project state) |
| Fixtures / factories | `backend/tests/helpers/factories.ts` (`makeApplication`, `makePosition`, `makeReq`, `makeRes`) |
| Coverage reporting | Not configured (no threshold; `npm test -- --coverage` available) |

---

## 4. Implementation-to-Test Traceability Matrix

| # | Generated behavior | Expected layer | Test location | Status | Notes |
|---:|---|---:|---|---|---|
| 1 | `GET /positions/:id/candidates` route registered in Express router | Route | `tests/integration/positionRoutes.integration.test.ts` (router mount, HTTP contract, method gating) | **Covered** | Verified via real `request(app)` calls |
| 2 | `app.use('/positions', positionRoutes)` mount in `index.ts` | Integration | Same | **Covered** | Smoke test confirms `/positions` prefix is live |
| 3 | `parseInt(req.params.id, 10)` + `isNaN` → 400 `{ error: 'Invalid ID format' }` | Controller | `tests/controllers/positionController.test.ts` ("400 — invalid id") | **Covered** | `'abc'`, `''`, and the `'0'` boundary all tested |
| 4 | Null result from service → 404 `{ error: 'Position not found' }` | Controller | Same ("404 — position not found") | **Covered** | |
| 5 | Successful result → 200 JSON envelope | Controller | Same ("200 — happy path") | **Covered** | Full shape asserted with `toHaveBeenCalledWith(serviceResult)` |
| 6 | Empty candidates array → 200 `{ positionId, candidates: [] }` | Controller + Integration | Both suites | **Covered** | |
| 7 | Unexpected DB error → 500 `{ error: 'Internal Server Error' }` | Controller + Integration | Both suites | **Covered** | |
| 8 | `Position.findOne(id)` returns null → service returns null | Service | `tests/services/positionCandidateService.test.ts` ("position lookup") | **Covered** | Also asserts `findMany` is NOT called |
| 9 | `Position.findOne(id)` returns data → proceed to `findMany` | Service | Same | **Covered** | |
| 10 | `application.findMany` with `include: { candidate, interviews }` and `orderBy` clause | Service | Same ("Prisma query shape") | **Covered** | Full call shape asserted with strict `toHaveBeenCalledWith` |
| 11 | One result row per `Application` (not per `Candidate`) | Service | Same ("row mapping") | **Covered** | |
| 12 | `applicationId` and `candidateId` mapped from application row | Service | Same | **Covered** | |
| 13 | `firstName` / `lastName` / `fullName` mapped from included candidate | Service | Same | **Covered** | |
| 14 | `currentInterviewStep` FK echoed as-is | Service | Same | **Covered** | |
| 15 | `averageInterviewScore` — scores `[6, 10]` → `8` | Service | Same ("averageInterviewScore") | **Covered** | |
| 16 | `averageInterviewScore` — no interviews → `null` | Service | Same | **Covered** | |
| 17 | `averageInterviewScore` — all scores null → `null` | Service | Same | **Covered** | |
| 18 | `averageInterviewScore` — mixed null/non-null → average of non-null | Service | Same | **Covered** | |
| 19 | Single non-null score → returned as number (`[5]` → `5`) | Service | Same | **Covered** | New test, also asserts `typeof === 'number'` |
| 20 | Fractional average (`[1, 2]` → `1.5`) | Service | Same | **Covered** | New test using `toBeCloseTo` |
| 21 | `id: 0` — `parseInt('0')` is not NaN; reaches DB with positionId 0 | Controller | `tests/controllers/positionController.test.ts` | **Covered** | Asserts service is called with `0` and 404 is returned |
| 22 | Duplicate `(positionId, candidateId)` applications return separate rows | Service | `tests/services/positionCandidateService.test.ts` ("row mapping") | **Covered** | New test |
| 23 | `fullName` trim handling for surrounding whitespace | Service | Same | **Covered** | New test documenting that `.trim()` only handles outer whitespace |
| 24 | Method gating — only `GET` is mounted on `/positions/:id/candidates` | Integration | `tests/integration/positionRoutes.integration.test.ts` ("HTTP method gating") | **Covered** | New test asserting `POST` and `DELETE` are not routed to the handler |
| 25 | Results ordered by `applicationDate ASC, id ASC` | Service | Same ("Prisma query shape") | **Partially Covered** | The `orderBy` *clause* is asserted via `toHaveBeenCalledWith`. True ordering against a real DB is still untestable without a DB harness (acknowledged below). |

**Status legend:** Covered, Partially Covered, Missing, Not Applicable.

---

## 5. Layer-by-Layer Test Review

### Routes

**Files:** `backend/src/routes/positionRoutes.ts`, `backend/src/index.ts`  
**Test file:** `backend/tests/integration/positionRoutes.integration.test.ts` (9 tests)

The route layer is now exercised through `supertest` against the actual `app` exported from `src/index.ts`. The integration suite confirms:

1. The router is mounted at `/positions` (a request to `/positions/1/candidates` reaches the handler).
2. Unknown paths under `/positions` correctly return 404.
3. `Content-Type: application/json` is honored across 200 / 400 / 404 / 500 responses.
4. Only `GET` is bound to the path; `POST` and `DELETE` do not reach the handler.

The `app.listen` call in `index.ts` was guarded with `if (process.env.NODE_ENV !== 'test')` so importing the module during tests does not bind to port 3010 (Jest sets `NODE_ENV=test` automatically). This is documented in §11.

### Controllers

**File:** `backend/src/presentation/controllers/positionController.ts`  
**Test file:** `backend/tests/controllers/positionController.test.ts` (7 tests)

The controller is now isolated from the service via `jest.mock('positionCandidateService')`. This eliminates the audit's Finding 2 caveat (two `PrismaClient` instances sharing one mock — see §7) by removing Prisma from the controller test entirely.

All HTTP branches (400, 404, 200, 500) are covered. The 200 happy-path test now uses `expect(res.json).toHaveBeenCalledWith(serviceResult)` with the full envelope, satisfying audit Finding 3. The `id: 0` boundary case is explicitly documented as a controller test.

### Services / Use Cases

**File:** `backend/src/application/services/positionCandidateService.ts`  
**Test file:** `backend/tests/services/positionCandidateService.test.ts` (16 tests)

Five `describe` groups organize the service tests by behavior — `position lookup`, `Prisma query shape`, `empty result envelope`, `row mapping`, and `averageInterviewScore`. The `Prisma query shape` group is new and asserts the exact `where`/`include`/`orderBy` arguments passed to `findMany`, removing the previous "partially covered" status of behavior #10 in the matrix.

### Domain / Models

`Position.findOne` is exercised indirectly via the service tests through the shared Prisma mock. There is still no dedicated test file for the `Position` constructor or `save()` method — this is a **pre-existing gap** unrelated to the new endpoint and is explicitly out of scope for this audit per its original framing.

### Database / Repository Layer

All Prisma access remains mocked at the `PrismaClient` constructor level. There is no real DB harness in the project; introducing one was explicitly out of scope. The `Prisma query shape` test in the service suite mitigates the audit's previous concern that the query structure was never validated by asserting the exact arguments passed to `findMany`.

### Integration / API Contract

A new dedicated integration suite at `backend/tests/integration/positionRoutes.integration.test.ts` exercises the real Express app via `supertest`. It validates:

- Express JSON parsing
- Route prefix matching (`/positions`)
- Full HTTP contract (status codes, `Content-Type`, response body shape)
- Method gating (POST/DELETE rejected)
- Pass-through of unexpected errors to JSON 500

The global error middleware in `index.ts` (which returns plain text `Something broke!`) is **not** triggered by the new endpoint because `getPositionCandidates` catches its own exceptions and returns JSON 500 directly — this is the documented inconsistency from `.cursor/rules/20-project-standards.mdc` and is verified by the integration test.

---

## 6. Missing or Weak Test Cases

| Priority | Missing or weak test | Why it matters | Status | Resolution / Suggested location |
|---|---|---|---|---|
| ~~High~~ | ~~`id: 0` controller behavior~~ | Documented production behavior gap | **Resolved** | `tests/controllers/positionController.test.ts` — `treats id "0" as a valid parse…` |
| ~~High~~ | ~~Mock hoisting fragility~~ | Brittle mock setup | **Resolved** | All `jest.mock('@prisma/client')` factories now declare the mocks inside the closure and expose them via `__mocks__` |
| ~~High~~ | ~~Route-layer untested~~ | Route mount typos undetected | **Resolved** | `tests/integration/positionRoutes.integration.test.ts` (9 tests, real `supertest` requests) |
| ~~High~~ | ~~Controller 200 response shape only partially asserted~~ | Service shape changes silently pass tests | **Resolved** | Controller happy-path test asserts the full envelope with `toHaveBeenCalledWith(serviceResult)` |
| ~~Medium~~ | ~~Single non-null score~~ | Plan §3 boundary case | **Resolved** | `tests/services/positionCandidateService.test.ts` — `[5] → 5` |
| ~~Medium~~ | ~~Fractional average~~ | DB stores `Int` but average can be fractional | **Resolved** | `tests/services/positionCandidateService.test.ts` — `[1, 2] → 1.5` |
| ~~Medium~~ | ~~Duplicate `(positionId, candidateId)` applications~~ | Plan §10 explicit assumption | **Resolved** | `tests/services/positionCandidateService.test.ts` — duplicate applications test |
| ~~Low~~ | ~~`fullName` trim behavior~~ | Documents the behavior of `.trim()` on outer whitespace | **Resolved** | `tests/services/positionCandidateService.test.ts` — whitespace test |
| Low | Result ordering against a real DB | Cannot meaningfully assert that the DB respects the `orderBy` without a DB harness | **Acknowledged — partially covered** | The `orderBy` argument is asserted in the service "Prisma query shape" test. True ordering would require a DB harness (out of scope). |
| Low | `Position.ts` and other domain model classes | Pre-existing project gap (constructor, `save()`, etc. of `Position`, `Application`, `Interview`, `Candidate`) | **Out of scope** | Not introduced by this endpoint; documented for future work. |

---

## 7. Test Quality Findings

### Finding 1 — Mock hoisting fragility (Resolved)

**Original issue:** `mockFindUnique` and `mockFindMany` were declared as `const` outside the `jest.mock` factory and captured by closure, relying on the implementation detail that `ts-jest` loads mocked modules lazily.

**Resolution:** All `jest.mock('@prisma/client')` factories in the new test files declare the mock functions inside the closure and expose them via an `__mocks__` property:

```ts
jest.mock('@prisma/client', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  return {
    PrismaClient: jest.fn(() => ({ position: { findUnique }, application: { findMany } })),
    __mocks__: { findUnique, findMany },
  };
});

const { findUnique: mockFindUnique, findMany: mockFindMany } = (
  jest.requireMock('@prisma/client') as { __mocks__: { findUnique: jest.Mock; findMany: jest.Mock } }
).__mocks__;
```

This pattern is hoist-safe and survives test-file restructuring or `jest.resetModules()`.

### Finding 2 — Two PrismaClient instances share one mock (Resolved at controller layer; intentional in service & integration)

**Original issue:** `Position.ts` and `positionCandidateService.ts` each call `new PrismaClient()` at module load. The single mock instance returned for every `new PrismaClient()` call could conflate calls between the two layers.

**Resolution:**
- **Controller tests** now mock the service module directly (`jest.mock('positionCandidateService')`), removing Prisma from the controller test entirely.
- **Service tests** continue to share the mock, which is the correct behavior because the service test exercises the entire data path (including `Position.findOne`) — the shared mock represents the real-world single-DB reality.
- **Integration tests** also share the mock for the same reason.

### Finding 3 — Controller success test does not assert full response shape (Resolved)

**Resolution:** The controller happy-path test now uses:

```ts
expect(res.json).toHaveBeenCalledWith(serviceResult);
```

with `serviceResult` containing all six candidate fields. A regression in any field name or value would now fail the test. Additionally, `expect(res.json).toHaveBeenCalledTimes(1)` confirms exactly one response was sent.

### Finding 4 — Weak "no auth" test (Resolved by deletion)

**Original issue:** The `expect(res.status).not.toHaveBeenCalledWith(401|403)` test would pass even if the controller threw an uncaught exception.

**Resolution:** The weak test was removed. Authentication absence is now implicitly verified by every passing 200/400/404 test in the integration suite, which exercises the entire middleware stack with no auth headers.

### Finding 5 — `beforeEach(jest.clearAllMocks)` (Already correct, retained)

All three new test files retain `beforeEach(() => jest.clearAllMocks())` for proper test isolation.

### Finding 6 — `makeApplication` factory (Promoted to shared helper)

**Original issue:** The factory was inline in the single test file.

**Resolution:** The factory was promoted to `backend/tests/helpers/factories.ts` along with new helpers `makePosition`, `makeRes`, and `makeReq` so all three test suites can share the same fixtures. The interface `ApplicationFixture` is exported for type safety.

### Finding 7 — Console output during integration tests (New, Low severity)

`index.ts` includes a request-logging middleware (`console.log(`...`)`) that fires during integration tests, producing visible output in the test runner. This is cosmetic and matches production behavior; suppressing it would require either modifying production code or adding a Jest console silencer. **No action recommended.**

---

## 8. Recommended Test Plan

### Mandatory items from the original audit

- [x] **Fix mock hoisting** — All `jest.mock` factories now declare mocks internally.
- [x] **Assert full 200 response shape in controller test** — Done via `toHaveBeenCalledWith(serviceResult)`.
- [x] **Document or test `id: 0` behavior** — Test added in `tests/controllers/positionController.test.ts`.

### Recommended items from the original audit

- [x] **Single non-null score test** — Service suite.
- [x] **Fractional average test** — Service suite.
- [x] **Duplicate application rows for same candidate** — Service suite.
- [x] **Route layer smoke test (supertest)** — `tests/integration/positionRoutes.integration.test.ts` with 9 tests.

### Nice-to-have items from the original audit

- [x] **Replace the weak "no auth check" test** — Test removed; coverage is now implicit through every successful integration test.
- [x] **Add a `fullName` trim test for names with surrounding whitespace** — Service suite.
- [ ] **Add a Jest `coverageThreshold` configuration** — *Not implemented;* the audit framed this as nice-to-have. Recommended for a future iteration as part of CI hardening rather than per-endpoint scope.

### Items remaining for future iterations (out of original scope)

- [ ] **Real-DB integration test for ordering** — Requires a DB harness (Postgres test instance, Prisma migrations, seed). Out of scope for the current endpoint.
- [ ] **Domain model unit tests** — Pre-existing project gap (`Position`, `Application`, `Interview`, `Candidate` constructors and `save()`). Should be tackled in a dedicated test-debt sprint.

---

## 9. Commands to Validate

```bash
# From backend/ directory

# Type-check all TypeScript (no DB required)
npm run build

# Run all unit + integration tests
npm test

# Run tests with verbose output (per-test results)
npm test -- --verbose

# Run tests with coverage report
npm test -- --coverage

# Run a single layer
npm test -- tests/services
npm test -- tests/controllers
npm test -- tests/integration

# Lint touched files (no lint script in package.json; invoke directly)
npx eslint src/routes/positionRoutes.ts \
           src/presentation/controllers/positionController.ts \
           src/application/services/positionCandidateService.ts \
           src/index.ts \
           tests/services tests/controllers tests/integration tests/helpers
```

### Documentation coverage (TSDoc — position candidates path)

**Update:** 2026-05-02

| Area | Files documented |
|---|---|
| Application service | `src/application/services/positionCandidateService.ts` — module overview, `CandidateInProcess` / `PositionCandidatesResult`, `findPositionCandidates` (`@param` / `@returns` / `@remarks`) |
| Controller | `src/presentation/controllers/positionController.ts` — `getPositionCandidates` HTTP contract |
| Routes | `src/routes/positionRoutes.ts` — router purpose, `GET /:id/candidates` |
| App entry | `src/index.ts` — exported `app` (test vs listen behavior) |
| Domain | `src/domain/models/Position.ts` — class overview, `findOne` |
| Tests + fixtures | `tests/helpers/factories.ts`; `tests/services/positionCandidateService.test.ts`; `tests/controllers/positionController.test.ts`; `tests/integration/positionRoutes.integration.test.ts` — file-level and nested `describe` JSDoc |

**Strategy:** TSDoc on exported and public API-path symbols; concise `@param` / `@returns` where they add clarity; test suites document intent, mocking strategy, and non-obvious grouping — no behavioral or assertion changes.

**Validation:** `npm run build` and `npm test` re-run after edits — pass (32 tests). Repository `npx eslint` with `.eslintrc.js` still trips ESLint 9 flat-config / TS parser defaults in this workspace (tooling gap unrelated to these comments).

**Remaining docstring gaps:** Other backend modules (`candidate*`, `validator`, upload service, most domain models) were not part of this pass; organization-wide CodeRabbit docstring % may still flag those until documented similarly.

### Last execution results

| Command | Result | Output summary |
|---|---|---|
| `npm run build` | **Pass (exit 0)** | `tsc` clean, no errors |
| `npm test` | **Pass (exit 0)** | 3 test suites, **32 tests, 0 failures**, ~5s |
| `npm test -- --verbose` | **Pass (exit 0)** | All 32 tests reported individually as passing |

---

## 10. Final Score

| Criterion | Previous Score | Last Score | Notes / reason for score change |
|---|---:|---:|---|
| Coverage completeness | 68 | 96 | All 25 traceable behaviors now Covered or partially-but-acknowledged. Only the "real-DB ordering" item remains, which is out of scope. |
| Layer alignment | 75 | 95 | Tests now organized by application layer (`services/`, `controllers/`, `integration/`). Route layer covered. Domain layer is a pre-existing project gap unrelated to this endpoint. |
| Edge / error coverage | 72 | 92 | `id: 0`, single score, fractional, duplicates, fullName whitespace, and method gating all covered. Remaining gaps are real-DB ordering only. |
| Test maintainability | 70 | 92 | Hoist-safe mock pattern; shared `factories.ts`; full equality assertions; clear `describe` groupings by behavior; no fragile `objectContaining` on critical paths. |
| Integration confidence | 30 | 88 | `supertest` integration suite exercises the real `app`. Real-DB ordering still untested (would require a Postgres test harness). |
| Project consistency | 88 | 90 | Folder convention, file naming, `jest.clearAllMocks`, and `ts-jest` usage all match. New `tests/{services,controllers,integration,helpers}/` subfolders are a minor convention extension required by the audit's recommendation. |
| **Final average score** | **67** | **92** | |

---

## 11. Final Recommendation

### Original

> **Approved with minor test improvements** — three high-priority and four medium-priority items required before merge.

### Updated

**Approved.**

All four high-priority items from the original audit are resolved. All four medium-priority items are resolved. One low-priority "fullName trim" item is also resolved. The only acknowledged remaining gap is real-DB ordering verification, which requires a Postgres test harness that is out of scope for a single-endpoint implementation.

### Production code change required for testability

One production code change was made and is documented here for traceability:

**File:** `backend/src/index.ts`  
**Change:** Wrapped `app.listen(...)` in `if (process.env.NODE_ENV !== 'test')`.  
**Reason:** Without this guard, importing `app` from `index.ts` during integration tests would bind a real listener to port 3010 (causing port conflicts on subsequent runs and leaking open handles to Jest). Jest sets `NODE_ENV=test` automatically, so production behavior is unchanged.  
**Magnitude:** 2-line wrap, no behavior change in production.

### Test files created

```
backend/tests/
├── helpers/
│   └── factories.ts                                  # makeApplication, makePosition, makeReq, makeRes
├── services/
│   └── positionCandidateService.test.ts              # 16 service-layer tests
├── controllers/
│   └── positionController.test.ts                    # 7 controller-layer tests
└── integration/
    └── positionRoutes.integration.test.ts            # 9 integration tests via supertest
```

### Test files removed

```
backend/tests/positionCandidates.test.ts              # 16-test flat file replaced by the layered structure
```

### Dependencies added

```json
"devDependencies": {
  "supertest":      "^7.x",
  "@types/supertest": "^x"
}
```

`supertest` is the de-facto integration test client for Express applications and is purely additive (does not replace any existing testing tool). Its addition is justified by the audit's explicit recommendation in §8 of the original report.
