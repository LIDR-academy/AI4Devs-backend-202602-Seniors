# QA / Testing Tasks for STORY-001: Retrieve Position Candidates

**Discipline**: QA / Testing  
**Total Tasks**: 1  
**Coverage**: All acceptance criteria (AC-1 through AC-8)

---

## TASK-STORY-001-QA-001

**Title**: Design and execute comprehensive test plan for GET /positions/:id/candidates endpoint (happy path, errors, edge cases, regression)

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: QA

**Depends On**: TASK-STORY-001-BACKEND-001, TASK-STORY-001-BACKEND-002, TASK-STORY-001-BACKEND-003, TASK-STORY-001-FRONTEND-001 (all implementation tasks must complete first)

**Blocks**: Story completion (testing is final gate before "Done")

---

### Purpose

Design and execute a comprehensive test plan covering all acceptance criteria (AC-1 through AC-8), including happy path, error cases, edge cases, performance baselines, security validation, and regression testing. Ensure Backend endpoint, Frontend component, and API contract all work together as specified.

Fulfills all 8 acceptance criteria through:
- AC-1: Endpoint creation and 404 validation (endpoint exists, returns 404 for invalid positions)
- AC-2: Candidate data validation (name, email, phone, address displayed)
- AC-3: Interview step tracking (stepId, stepName, stepOrder, interviewFlowId returned)
- AC-4: Average score calculation (null-safe, excludes null scores)
- AC-5: Application metadata (date, notes, total interviews)
- AC-6: Response format (JSON structure matches spec)
- AC-7: Error handling (400, 404, 403, 500 with correct messages)
- AC-8: Authorization (recruiter/hiring_manager roles required)

### Scope of Change

- **Create**: Test strategy document with test matrix and coverage map
- **Create**: Test cases (unit, integration, E2E) mapped to each AC
- **Create**: Test data and fixtures (seed data with known candidates, positions, interviews)
- **Create**: Automated tests (Jest for Backend unit/integration, Cypress for E2E Frontend)
- **Create**: Manual test checklist (visual, cross-browser, accessibility)
- **Create**: Performance baseline test (verify <500ms for 100 candidates)
- **Create**: Security test plan (authorization bypass attempts, input validation)
- **Verify**: All tests pass before task marked "Done"

### Where

- **Test Strategy**: `backend/tests/STORY-001-TEST-STRATEGY.md`
- **Test Cases**: `backend/__tests__/routes/positionCandidates.test.ts` (Backend integration tests)
- **Frontend Tests**: `frontend/src/components/PositionCandidatesList.test.tsx` (React component tests)
- **E2E Tests**: `cypress/e2e/position-candidates.spec.ts` (Cypress E2E tests)
- **Test Data**: `backend/prisma/test-seed.sql` or Jest fixtures
- **Performance Test**: `backend/__tests__/performance/positionCandidatesQuery.perf.test.ts`
- **Security Test**: `backend/__tests__/security/positionCandidatesAuth.test.ts`

### Why

Per STORY-001 acceptance criteria, testing is mandatory to verify all functional and non-functional requirements. The story includes 8 ACs covering endpoint creation, data integrity, error handling, and authorization — none of which can be verified without tests.

Per CLAUDE.md (Testing Setup), Backend uses Jest with ts-jest preset; Frontend uses Jest with React Testing Library. This task establishes test patterns that will be reused across future stories.

Per STORY-001 Technical Design (Observability), tests serve as executable specifications and documentation of expected behavior.

Per STORY-001 Non-Functional Requirements: Performance must be <500ms for 100 candidates (performance test validates this).

### How: Technical Approach

**Step 1**: Create test strategy document
- List all acceptance criteria with test coverage maps
- Define test types: Unit (service, validation), Integration (Controller + Service + DB), E2E (Frontend + API + DB), Performance, Security
- Define test data strategy: Fixtures vs. real test DB, cleanup between tests
- Define acceptance thresholds: All unit/integration/E2E tests must pass, performance baseline documented, no security issues

**Step 2**: Design test matrix
```text
| AC # | Acceptance Criterion | Test Type(s) | Test Case(s) | Status |
|------|----------------------|--------------|--------------|--------|
| 1 | Endpoint exists, validates position ID, returns 404 if not found | Integration, E2E | test_endpoint_returns_200_for_valid_position, test_endpoint_returns_404_for_nonexistent_position, test_endpoint_returns_400_for_invalid_id | Pending |
| 2 | Candidate data (name, email, phone, address) included | Integration, Unit (service) | test_candidate_fullname_constructed, test_candidate_email_included, test_optional_fields_nullable | Pending |
| ... | ... | ... | ... | ... |
```

**Step 3**: Create test data (fixtures)
- Create test position with known ID (e.g., position ID 1)
- Create 5-10 test candidates with varied data:
  - Candidate with all fields populated (name, email, phone, address, notes)
  - Candidate with minimal fields (only required, phone/address null)
  - Candidate with special characters in name/notes
  - Candidate with very long email/phone (boundary test)
- Create test interviews with:
  - Some with scores (1, 2, 3, 4, 5)
  - Some with null scores (incomplete interviews)
- Create application records linking candidates to position at different interview steps
- Seed before each test (or use single fixture for entire test suite)

**Step 4**: Write Backend integration tests
- **Happy path**: GET `/positions/1/candidates` returns 200 with correct candidate count and fields
- **Candidate data**: Verify all fields from AC-2 present and correct (fullName constructed, email present, phone/address nullable)
- **Interview step**: Verify currentInterviewStep object has all fields (stepId, stepName, stepOrder, interviewFlowId)
- **Average score**: Calculate average of interviews with non-null scores; verify matches expected average
- **No interviews**: Candidate with zero interviews should have averageScore: null
- **Null scores only**: Candidate with only null scores should have averageScore: null
- **Application date**: Verify ISO 8601 format (e.g., "2026-05-01T10:00:00Z")
- **Empty candidates**: Position with no applications returns 200 with empty array
- **Invalid position ID**: GET `/positions/abc/candidates` returns 400 with error message
- **Nonexistent position**: GET `/positions/9999/candidates` returns 404 with error message
- **Unauthorized**: Request without Authorization header returns 401 or 403 (depends on auth implementation)
- **Wrong role**: User with role "candidate" returns 403
- **Database error**: Mock database failure; verify 500 with generic error message (no internal details leaked)

**Step 5**: Write Frontend component tests (Jest + React Testing Library)
- **Loading state**: Component shows spinner on mount
- **Successful render**: Component displays candidate list with correct data (mock API)
- **Error handling**: Mock API returning 404; verify error message "Position not found" displayed
- **Auth error**: Mock API returning 401; verify message "Please log in" or redirect to login
- **Forbidden error**: Mock API returning 403; verify message "You are not authorized"
- **Server error**: Mock API returning 500; verify retry button present
- **Empty state**: Mock API returning empty candidates array; verify "No candidates" message
- **Null average score**: Candidate with averageScore: null should display "N/A" or similar
- **Responsive layout**: Render at different viewport widths; verify layout adapts (Bootstrap grid working)
- **Accessibility**: Query elements by accessible labels (e.g., `getByRole('table')`, `getByLabelText`)
- **URL params**: Verify component extracts position ID from URL params correctly

**Step 6**: Write E2E tests (Cypress)
- **Full flow**: User logs in → navigates to position detail → clicks "View candidates" → sees candidate list
- **Candidate details visible**: Verify each candidate card/row shows name, email, interview step, score
- **Responsive**: Test on desktop (1920x1080), tablet (768x1024), mobile (375x667)
- **Error flow**: Navigate to nonexistent position ID; verify 404 error message and retry option
- **Authorization**: Try accessing without JWT token; verify redirected to login or shown error
- **Performance**: Measure page load time for 100 candidates; verify <2s (includes API call + render)

**Step 7**: Write performance test
- Create test data: Position with 100 active candidates, each with 5-10 interview records
- Measure Prisma query execution time:
  ```typescript
  const startTime = Date.now();
  const result = await prisma.position.findUnique({
    where: { id: 1 },
    include: { applications: { include: { candidate: true, interviews: { where: { score: { not: null } } } } } }
  });
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(500); // <500ms SLO from story
  ```
- Measure API response time (including controller logic + data transformation):
  - Mock 100-candidate database
  - Call endpoint
  - Verify response time <500ms
- Document baseline: "Fetching 100 candidates takes XXXms on [test hardware]"

**Step 8**: Write security test
- **Input validation**: Try invalid position IDs (null, undefined, -1, "abc", very large number); verify 400 error, no exception
- **Authorization bypass**: Try to access without Authorization header; verify 401/403
- **Role-based access**: Create test users with different roles; verify only recruiter/hiring_manager can access
- **SQL injection**: Try position ID `1; DROP TABLE Position;`; verify it's treated as literal integer, no injection
- **Data leakage**: Verify error messages don't expose internal IDs, database schema, or stack traces
- **Excessive data**: Try to fetch position with 10,000 candidates (if schema allows); verify reasonable response time or pagination

**Step 9**: Write regression test suite
- Identify existing API endpoints (e.g., POST /candidates, GET /candidates/:id)
- Verify they still work after this feature is added (no breaking changes)
- Run existing test suite (if any) alongside new tests

**Step 10**: Automate test execution
- Configure Jest to run tests automatically: `npm test`
- Configure Cypress to run E2E tests: `npm run e2e` (or similar)
- Set up CI/CD hook to run all tests on every commit (future work, but plan for it)

### Inputs / Outputs / Contracts

**Input**:
- Completed Backend endpoint (TASK-STORY-001-BACKEND-001, BACKEND-002, BACKEND-003)
- Completed Frontend component (TASK-STORY-001-FRONTEND-001)
- OpenAPI spec (TASK-STORY-001-API-001)
- Test data fixtures (seed SQL or factory functions)
- Test environment (local dev, Docker database running)

**Output**:
- Test strategy document: `backend/tests/STORY-001-TEST-STRATEGY.md`
- Backend integration tests: `backend/__tests__/routes/positionCandidates.test.ts`
- Frontend component tests: `frontend/src/components/PositionCandidatesList.test.tsx`
- E2E tests: `cypress/e2e/position-candidates.spec.ts`
- Performance test results: `backend/__tests__/performance/positionCandidatesQuery.perf.test.ts` (includes baseline)
- Security test plan: `backend/__tests__/security/positionCandidatesAuth.test.ts`
- Test data fixtures: `backend/__tests__/fixtures/positionCandidatesTestData.fixtures.ts` or SQL
- Test execution report: Summary of all tests passing/failing (CI/CD log or manual run)

**Contracts**:
- All tests are deterministic (same input → same result every time)
- Tests clean up after themselves (drop test data, restore DB state)
- Tests are isolated (one test's data doesn't affect another)
- Test names clearly describe what they test (not "test1", but "test_returns_404_when_position_not_found")

### Dependencies

- Backend implementation must be complete (all three Backend tasks done)
- Frontend implementation must be complete (Frontend task done)
- API spec must be defined (API task done)
- Jest must be installed (already in dependencies per package.json)
- Cypress must be installed (may need to add: `npm install --save-dev cypress`)
- Test database must be accessible (Docker PostgreSQL running)
- Prisma migrations must be applied (for test DB schema)

### Acceptance Criteria

- [ ] Test strategy document created and reviewed
- [ ] Test matrix created mapping all 8 ACs to test cases
- [ ] Test data fixtures created with 5-10 candidates, varied scenarios
- [ ] Backend integration tests written for all happy-path and error cases
- [ ] Frontend component tests written for data display, error handling, empty state
- [ ] E2E tests written for full user flow (login → view position → see candidates)
- [ ] Performance test confirms <500ms response time for 100 candidates
- [ ] Security tests validate authorization (401/403), input validation (400), no SQL injection
- [ ] All tests pass (0 failures, 0 skipped)
- [ ] Code coverage ≥80% for Backend service and controller
- [ ] Code coverage ≥80% for Frontend component
- [ ] Regression tests pass (existing endpoints unaffected)
- [ ] Test execution can be run via `npm test` (Backend) and `npm run e2e` (Frontend)
- [ ] All tests are documented with clear names and comments
- [ ] Performance baseline documented (e.g., "100 candidates fetched in 380ms")
- [ ] Security findings documented (if any, with mitigations)

### Test Requirements

**Unit Tests** (Backend service layer):
- Test: Average score calculation with 0 interviews (expects null)
- Test: Average score calculation with 1 interview (score 4, expects 4)
- Test: Average score calculation with mixed null/non-null scores (only non-null averaged)
- Test: Data transformation (Prisma object → API response object)
- Test: Email/phone optional fields handled correctly (null doesn't break transformation)

**Integration Tests** (Backend API):
- Test: GET /positions/1/candidates returns 200 with correct structure
- Test: All candidate fields present and correct
- Test: Interview step object has all required fields
- Test: Average score calculated correctly
- Test: GET /positions/9999/candidates returns 404
- Test: GET /positions/abc/candidates returns 400
- Test: GET /positions/1/candidates without auth header returns 401/403
- Test: GET /positions/1/candidates with wrong role returns 403
- Test: Position with 0 candidates returns 200 with empty array

**Frontend Tests** (React component):
- Test: Component renders loading state
- Test: Component displays candidate list when API succeeds
- Test: Component shows "No candidates" when API returns empty array
- Test: Component shows 404 error message when API returns 404
- Test: Component shows auth error when API returns 401/403
- Test: Candidate fullName displayed correctly
- Test: Candidate email displayed as link
- Test: Interview step name and order displayed
- Test: Average score displays or "N/A" if null
- Test: Application date formatted correctly

**E2E Tests** (Cypress):
- Test: User can navigate to position candidates page
- Test: Candidate list displays with 5+ candidates visible
- Test: Responsive layout on mobile viewport
- Test: Error handling when position doesn't exist
- Test: Performance: Page loads in <2 seconds

**Performance Tests**:
- Test: Query 100 candidates in <500ms
- Test: API response (including serialization) in <500ms
- Test: Frontend render 100 candidates in <1 second

**Security Tests**:
- Test: SQL injection attempt (position ID = "1; DROP TABLE Position;") treated as literal
- Test: Invalid role cannot access endpoint
- Test: Error messages don't expose internal details
- Test: Very large position ID doesn't crash (e.g., 999999999999999999)

**Regression Tests**:
- Test: Existing POST /candidates endpoint still works
- Test: Existing GET /candidates/:id endpoint still works
- Test: No breaking changes to existing database schema

**Manual Testing Checklist**:
- [ ] Desktop browser (Chrome): Candidate list renders, all columns visible
- [ ] Desktop browser (Firefox): Same as Chrome
- [ ] Desktop browser (Safari): Same as Chrome
- [ ] Tablet (iPad 768x1024): Layout adapts, card view works
- [ ] Mobile (iPhone 375x667): Layout adapts, no horizontal scroll
- [ ] Mobile (Android): Same as iPhone
- [ ] Keyboard navigation: Can tab through table/links
- [ ] Screen reader (NVDA or VoiceOver): Candidate names announced correctly
- [ ] Fast network (no throttle): Loads in <500ms
- [ ] Slow network (3G throttle): Loads in <2s, spinner visible
- [ ] Offline: Shows error "Network error" or similar

### Non-Functional Requirements

**Test Quality**:
- Tests are deterministic (same result every run, no flakiness)
- Tests are independent (can run in any order, no shared state)
- Tests clean up after themselves (no orphaned test data)
- Tests are fast (<100ms each, total suite <10s)
- Tests have clear, descriptive names (not "test1" but "test_returns_404_when_position_not_found")

**Code Coverage**:
- Backend service: ≥80% line coverage
- Backend controller: ≥80% line coverage (all status codes, error paths)
- Frontend component: ≥80% line coverage (all render paths, error states)
- Overall project: ≥75% line coverage

**Performance**:
- Test suite runs in <30 seconds (all tests combined)
- Each test completes in <5 seconds
- E2E tests complete in <15 seconds (3-5 test cases)

**Documentation**:
- Test strategy document is clear and comprehensive
- Test cases have comments explaining what they test and why
- Test data fixtures are documented (what data is created, for what scenarios)
- Performance baseline is documented with test environment details (hardware, network)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Flaky tests (passing sometimes, failing others) | Use stable test data (hardcoded IDs, not random); avoid time-dependent assertions; mock external services |
| Tests don't cover all ACs | Create test matrix before writing tests; validate all 8 ACs are mapped to test cases |
| Backend/Frontend test incompatibility (tests use different assumptions about response format) | Share OpenAPI spec; mock Backend in Frontend tests; write integration tests that use real Backend |
| Performance test fails due to slow hardware | Document test environment (CPU, RAM, disk); establish baseline on CI/CD hardware; use benchmark tool (Jest bench) for reproducibility |
| Test database permissions issues (can't create/drop tables) | Use dedicated test user with CREATE/DROP permissions; isolate test DB from dev DB |
| Test timeout issues (some tests take >5s) | Profile slow tests; consider database indexes; use connection pooling |
| Security tests reveal vulnerabilities | Document findings; create separate security task to fix; don't block story on security enhancements (unless critical) |

### Definition of Done

- [ ] Test strategy document created and peer-reviewed
- [ ] Test matrix created mapping all 8 ACs to test cases
- [ ] All unit tests written and passing
- [ ] All integration tests written and passing
- [ ] All E2E tests written and passing
- [ ] Performance test confirms <500ms SLO met
- [ ] Security tests confirm no authorization bypass, input validation working
- [ ] Code coverage ≥80% for Backend and Frontend
- [ ] Regression tests pass (no breaking changes)
- [ ] Test data fixtures created and working
- [ ] All tests can be run via `npm test` and `npm run e2e`
- [ ] Test execution report generated (pass/fail counts, timing)
- [ ] Performance baseline documented with test environment
- [ ] Security findings documented and tracked
- [ ] Manual testing checklist completed (all browsers, devices, accessibility)
- [ ] No flaky tests (all tests deterministic)
- [ ] All team members can run tests successfully
- [ ] CI/CD pipeline configured to run tests on commit (if available)
- [ ] Story marked ready for deployment only after all tests pass
- [ ] Task linked to STORY-001

---
