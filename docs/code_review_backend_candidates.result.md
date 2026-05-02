# Code Review: GET /positions/:id/candidates and PUT /candidates/:id/stage

**Reviewed commit range:** b89f159..1286a785779e280b726c403e180e1441e5a53fa1
**Date:** 2026-05-02

---

## Strengths

**1. Dependency injection pattern for testability**
Both `getCandidatesForPosition` (`positionService.ts:15-17`) and `updateCandidateStage` (`candidateService.ts:76-79`) accept an optional `db: PrismaClient = prisma` parameter. This is a clean, lightweight approach to making the service functions testable without a full IoC container, and it diverges from the plan in a positive way by going beyond direct module-level PrismaClient reliance.

**2. Type-safe score filtering**
`positionService.ts:56-57` uses a TypeScript type predicate `(score): score is number => score !== null` rather than a cast. This is correct and idiomatic TypeScript.

**3. Defensive controller validation in `updateCandidateStageController`**
`candidateController.ts:53-63` performs exhaustive type checking (`=== undefined`, `=== null`, `typeof !== 'number'`, `<= 0`) rather than relying on falsy coercion, which would incorrectly pass `0`. This matches the plan precisely.

**4. Clear service-level guard clauses in `updateCandidateStage`**
The service (`candidateService.ts:81-110`) performs input validation, candidate existence check, interview step existence check, and no-applications check in a clear, ordered sequence with explicit guard returns. Each error message is specific and maps directly to an HTTP status code in the controller.

**5. `findMany` + `updateMany` avoids an N+1 update**
`candidateService.ts:105-116` uses `findMany` to confirm applications exist, then a single `updateMany` for the bulk update. This is a single SQL UPDATE rather than per-row updates.

**6. Controller test for `candidateController` uses integration-style supertest**
`candidateController.test.ts` wires up a real Express app with `supertest` rather than mocking `req`/`res` objects. This tests the full Express middleware stack (body parsing, routing, JSON serialization), giving higher confidence that the endpoint works end-to-end in isolation.

**7. Service-layer validation guards redundantly checked in controller**
The service throws `'Invalid candidate ID'` / `'Invalid interview step ID'` for negative/NaN inputs, but the controller catches and converts these before they ever reach the service. This is belt-and-suspenders and prevents any internal error details from leaking via a 500.

---

## Issues

### Critical (Must Fix)

**1. Failing test was silently fixed between runs — root cause was a test isolation bug**

File: `backend/src/presentation/controllers/__tests__/candidateController.test.ts:175-184`

**What happened:** An earlier test run showed `PUT /candidates/:id/stage > should return 404 when candidate not found` failing (status 200 instead of 404). The test passes in the final run, which means the issue was a Jest mock isolation problem: `mockCandidateFindUnique` was being set from a previous test's `beforeEach` and not reset properly before this test's Arrange phase. The test relies on module-scoped mock variables shared across the entire file. Because `jest.clearAllMocks()` clears mock implementations as well as call counts, any test that does NOT set up its own `mockResolvedValue` before calling the handler will use whatever the previous test left behind.

**Why it matters:** The test passed or failed depending on execution order. This is an intermittently flaky test. If Jest runs tests in a different order (e.g., after `--runInBand` changes or when tests are randomized), this test can return a false positive (green) or false negative (red).

**How to fix:** Every test case that exercises a code path through the mock must explicitly set up all required mock return values in its own `Arrange` block, regardless of what prior tests set. The "candidate not found" test (`line 175`) sets `mockCandidateFindUnique.mockResolvedValue(null)`, which is correct; the prior run failure was almost certainly because a previous test in the same suite left `mockCandidateFindUnique` returning a resolved candidate value from a `beforeEach` that was run but then `clearAllMocks` removed the resolved value, leaving the mock returning `undefined` (which is treated as a found candidate returning `undefined`). Verify each test fully controls its mocks.

---

**2. `api-spec.yaml` has a YAML indentation error that makes the file unparseable**

File: `backend/api-spec.yaml:231`

**What's wrong:** The `'400'` response entry at line 231 has 7 spaces of indentation instead of 8:
```yaml
       '400':            # <-- 7 spaces (wrong)
          description: Bad request (invalid position ID)
        '404':           # <-- 8 spaces (correct)
```

**Why it matters:** Running `python3 -c "import yaml; yaml.safe_load(open('api-spec.yaml'))"` throws a `yaml.YAMLError`. Any tooling that parses this file (OpenAPI validators, API documentation generators, contract test runners) will fail. The spec is currently broken as a machine-readable artifact.

**How to fix:** Align `'400':` to 8 spaces to match the sibling `'404':` and `'500':` entries.

---

### Important (Should Fix)

**3. `positionController.ts` leaks internal error message in 500 responses**

File: `backend/src/presentation/controllers/positionController.ts:22`

**What's wrong:**
```typescript
res.status(500).json({ error: 'Internal Server Error', message: error.message });
```
The `message` field exposes the raw exception message to the HTTP client. This can include Prisma error text, database connection strings, table names, or stack frames depending on how the error was constructed.

**Why it matters:** This violates the backend standards' security best practices ("Error messages don't leak internal details") and differs from the equivalent handling in `candidateController.ts:87` which correctly returns only `{ error: 'Internal Server Error' }`. The inconsistency also means the `positionController` test at line 95 asserts `{ error: 'Internal Server Error', message: 'Database error' }`, which would fail if the format were corrected.

**How to fix:** Remove `message: error.message` from the 500 response. Update the corresponding test assertion at `positionController.test.ts:95-98` to match.

---

**4. Redundant validation logic in `positionController.ts` — `'Invalid position ID'` branch is dead code**

File: `backend/src/presentation/controllers/positionController.ts:8-10` and `19-21`

**What's wrong:** The controller validates `positionId` at line 8-10 before calling the service. The service also throws `'Invalid position ID'` for the same condition at `positionService.ts:21`. However, since the controller already guards against invalid IDs and returns early, the service's `'Invalid position ID'` error can never reach the controller's catch block. The code at line 19-21:
```typescript
if (error.message === 'Invalid position ID') {
  return res.status(400).json({ error: 'Invalid position ID' });
}
```
is dead code — it can never be reached. The corresponding test at `positionController.test.ts` does not test this path either (there is no test for it), which means coverage shows line 20 as uncovered.

**Why it matters:** Dead code creates confusion about which layer owns validation, adds maintenance surface, and coverage tools correctly flag line 20 as uncovered. It also means the service and controller each validate the same precondition independently, violating DRY.

**How to fix:** Either (a) remove the validation from the service and let the controller own it entirely (cleaner for simple ID format checks), or (b) remove the `'Invalid position ID'` catch branch from the controller since the guard at line 8-10 already prevents the service from ever seeing a bad ID. Option (a) is preferred because services should not re-validate inputs the controller already validated.

---

**5. `updateCandidateStage` service has duplicate validation that the controller already performs**

File: `backend/src/application/services/candidateService.ts:81-86`

**What's wrong:**
```typescript
if (isNaN(candidateId) || candidateId <= 0) {
    throw new Error('Invalid candidate ID');
}
if (isNaN(interviewStepId) || interviewStepId <= 0) {
    throw new Error('Invalid interview step ID');
}
```
The controller (`candidateController.ts:46-63`) performs identical validation on `candidateId` and `currentInterviewStep` and returns 400 before ever calling the service. These service-level guards are therefore unreachable in the normal request flow. The service test suite tests these guards directly by calling the service function with invalid values — which is the only way they can be reached — but this bypasses the controller entirely.

**Why it matters:** The service is a pure business logic function; it should trust that its callers (the controller) have pre-validated inputs. Having the same guard in two places is a DRY violation and creates a false sense of security. When the `db` parameter injection is used directly in tests to bypass the controller, the tests are testing the service in a way it will never be exercised in production.

**How to fix:** Remove the guard clauses from `updateCandidateStage` (lines 81-86). The validation belongs in the controller or a dedicated validator function. If these guards are kept for defensive programming / library reuse, add a JSDoc comment explaining that they are defensive fallbacks only.

---

**6. Overall code coverage is far below the 90% threshold required by backend standards**

Per `backend-standards.mdc`: "Threshold: 90% for branches, functions, lines, and statements"

Current coverage (from `npm test -- --coverage`):
- All files: 41.12% statements, 23.45% branches, 29.16% functions, 41.61% lines
- `candidateService.ts`: 45.83% statements (lines 12-56, 63-67 uncovered — the entire `addCandidate` and `findCandidateById` functions)
- `candidateController.ts`: 61.7% statements (lines 10-17, 24-34 uncovered — `addCandidateController` and `getCandidateById`)
- `validator.ts`: 22.22% statements
- Domain models: ~21-30% across the board

**Why it matters:** The new functionality (`updateCandidateStage`, `getCandidatesForPosition`, and their controllers) achieves good coverage within those specific functions — `positionService.ts` is 100% covered and `positionController.ts` is 94%. But pre-existing functions in `candidateService.ts` and `candidateController.ts` have no tests, and the project-wide threshold is not met.

**How to fix:** The new endpoints should not be blocked by pre-existing coverage debt, but this PR introduces a `jest.config.js` change (visible in the diff stats) and new test files. If the coverage threshold is enforced in CI (via `coverageThreshold` in `jest.config.js`), these new test suites will not cause CI to fail on their own. However, the coverage reports show the project is far from the stated standard. The team should track the coverage debt and add tests for `addCandidate`, `findCandidateById`, `addCandidateController`, `getCandidateById`, and the `validator.ts` module in follow-up work.

---

**7. Response format for `GET /positions/:id/candidates` deviates from the original plan**

File: `backend/src/application/services/positionService.ts:11` and `backend/api-spec.yaml:224-226`

**What's wrong:** The plan (`get_position_candidates.plan.md`) specified `currentInterviewStep` as an object `{ id: number; name: string } | null`. The implementation returns a bare `number | null` (the FK value from `Application.currentInterviewStep`). The `api-spec.yaml` correctly documents the implementation's actual `integer | null` shape, but this is a deliberate departure from the richer object the plan specified.

Additionally, the `include` query does not include `interviewStep` (the relation), only `interviews` and `candidate`. This means the name of the current interview step is never fetched.

**Why it matters:** If any consuming client expects `currentInterviewStep` to be an object with `id` and `name`, they will break. The plan explicitly described the richer shape. The actual API spec was updated to match the simpler implementation (FK integer only), so there is no mismatch between implementation and spec as committed — but the capability loss should be a conscious, documented decision.

**How to fix:** If the richer response shape (object with `id` and `name`) is needed, add `interviewStep: { select: { id: true, name: true } }` to the `include` in `positionService.ts:36-50` and update both `PositionCandidate` interface and `api-spec.yaml`. If the integer FK is acceptable, update the plan documentation to reflect this decision so there is no confusion for future readers.

---

**8. Pre-existing non-English comments and error messages in `candidateService.ts` (legacy code)**

File: `backend/src/application/services/candidateService.ts:13,24,32,43,63,67`

**What's wrong:** The existing code (not introduced in this PR) contains comments in Spanish: `// Validar los datos del candidato`, `// Guardar la educación del candidato`, `// Crear una instancia del modelo Candidate`, and Spanish error messages (`'Error al buscar el candidato:'`, `'Error al recuperar el candidato'`). Backend standards require English-only in all artifacts.

**Why it matters:** Standards state "English Only: All technical artifacts must always use English." This PR did not introduce these violations but also did not fix them while modifying the same file.

**How to fix:** When modifying an existing file, translate any Spanish comments/messages encountered to English. Specifically in `candidateService.ts` lines 13, 24-26, 32-33, 43-44, 63, 67.

---

**9. Test naming does not follow the required `should_[expected_behavior]_when_[condition]` convention**

Files: all four new test files

**What's wrong:** Backend standards specify: "Use descriptive, behavior-driven naming: `should_[expected_behavior]_when_[condition]`". The implemented tests use human-readable sentences like `'should throw error for invalid candidate ID (negative)'`, `'should return 200 when update successful'`, etc. These read well but do not follow the prescribed snake_case pattern.

**Why it matters:** Naming conventions exist for consistent tooling output (test reporter grouping, failure message readability). While the tests are clearly readable, they do not conform to the standard.

**How to fix:** Rename test cases to follow the convention, e.g.: `'should_throw_error_when_candidate_id_is_negative'`, `'should_return_200_when_update_is_successful'`.

---

### Minor (Nice to Have)

**10. `positionController.ts` does not declare `Promise<void>` return type**

File: `backend/src/presentation/controllers/positionController.ts:4`

**What's wrong:**
```typescript
export const getCandidatesForPositionController = async (req: Request, res: Response) => {
```
The `updateCandidateStageController` at `candidateController.ts:38-41` correctly declares `: Promise<void>`. The `positionController` omits it.

**Why it matters:** Minor inconsistency and TypeScript infers the return type anyway, but explicit `Promise<void>` is the established project pattern and prevents future callers from mistakenly awaiting a return value.

---

**11. `positionController.ts` uses `return res.status(...).json(...)` while `candidateController.ts` uses `res.status(...); return;`**

Files: `positionController.ts:9,16,19` vs `candidateController.ts:47-49,60-62`

**What's wrong:** Two different patterns for early-returning from Express controllers exist in the same codebase. One returns the `res` object; the other calls `res.json()` and then `return` on the next line.

**Why it matters:** The TypeScript return type of `Promise<void>` means returning the result of `res.json()` (which is `Response`) is technically a type error when the function is typed as `Promise<void>`. The inconsistency also makes the code harder to reason about uniformly.

**How to fix:** Standardize on the `res.status(...).json(...); return;` pattern throughout all controllers. This avoids the implicit `Response` return type mismatch.

---

**12. `candidateController.ts` exports `addCandidate` function at the bottom**

File: `backend/src/presentation/controllers/candidateController.ts:91`

**What's wrong:**
```typescript
export { addCandidate };
```
A controller file is re-exporting a service function. This creates an unexpected dependency: importing from `candidateController` gives access to a service-layer function.

**Why it matters:** This was in the pre-existing code, but it violates the layer separation where controllers are consumers of services, not re-exporters. Any module importing `addCandidate` from `candidateController` is bypassing the intended import path.

---

**13. `index.ts` request logging middleware is positioned after route registration**

File: `backend/src/index.ts:49-52`

**What's wrong:** The request logging middleware is registered after the routes (`/candidates`, `/positions`, `/upload`) are already registered at lines 41-47. Express middleware runs in registration order, so requests to these routes will never pass through this logger.

**Why it matters:** Debugging in development will not log requests to any of the registered endpoints.

**How to fix:** Move the logging middleware before the route registrations.

---

## Recommendations

**1. Fix the `api-spec.yaml` indentation bug immediately.** This is the only issue that actively breaks tooling. A single space correction resolves it.

**2. Remove `message: error.message` from the 500 response in `positionController.ts`.** The inconsistency with `candidateController.ts` is an accident waiting to cause a security finding in a future audit.

**3. Remove the dead `'Invalid position ID'` catch branch in `positionController.ts`.** It confuses the reader about what the controller handles and coverage tools correctly flag it.

**4. Decide on and document the `currentInterviewStep` response shape.** The plan said object with `id`+`name`; the implementation returns a bare integer. Either implement the richer shape or update the plan document to record the decision with the rationale (simpler queries, frontend adapts, etc.).

**5. Add the `interviewStep` relation to the `positionService.ts` query if the richer shape is ever needed.** The query structure already uses `include`; adding one more `select` is minimal effort.

**6. Create a coverage improvement ticket for pre-existing untested code** (`addCandidate`, `findCandidateById`, `addCandidateController`, `getCandidateById`, `validator.ts`). The new endpoints are well-tested but the 90% threshold cannot be met without addressing existing gaps.

**7. Standardize on one early-return pattern for Express controllers.** Pick either `return res.status(X).json(Y)` or `res.status(X).json(Y); return;` and apply it consistently.

---

## Assessment

**Ready to merge?** With fixes — specifically the `api-spec.yaml` YAML syntax error (issue #2) and the information leakage in the 500 response of `positionController.ts` (issue #3) should be fixed before merging; everything else can be addressed in follow-up work.

**Reasoning:** The two new endpoints are functionally correct, all 42 tests pass, and the core business logic (average score calculation, bulk stage update, existence checks) is properly implemented. The blocking issues are a broken YAML spec file and a security inconsistency in error responses; the remaining issues are quality improvements that do not compromise correctness.
