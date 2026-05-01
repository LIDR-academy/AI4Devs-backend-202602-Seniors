# Tasks for STORY-002: Update Candidate Interview Stage

**Discipline**: QA  
**Total Tasks**: 1  
**Coverage**: All ACs (testing strategy and test cases)

---

## TASK-STORY-002-QA-001

**Title**: Develop and execute comprehensive test suite for stage update endpoint

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: QA

**Depends On**: TASK-STORY-002-BACKEND-003 (endpoint must be implemented), TASK-STORY-002-API-001 (contract must be defined)

**Blocks**: None (final validation before production)

---

### Purpose & Scope

**Purpose**
Develop a comprehensive test suite covering all acceptance criteria (ACs), happy paths, error cases, and non-functional requirements for the PUT /candidates/:applicationId/stage endpoint. This ensures the feature is production-ready and meets all requirements.

Fulfills AC: All 12 ACs (endpoint, validation, auth, responses, audit logging, idempotency)

**Scope of Change**
- Create: Unit tests for `candidateStageService` (validation logic, error cases)
- Create: Integration tests for stage update flow (end-to-end with database)
- Create: E2E tests via HTTP (curl/Postman examples, CI automation)
- Create: Test data fixtures (candidate, position, application, interview steps)
- Create: Test execution plan and regression scope
- Verify: Performance baseline (<200ms per SLO)
- Verify: Audit log correctness (timestamps, user ID, stage IDs logged)

**Where**
- Unit tests: `backend/__tests__/services/candidateStageService.test.ts` (new)
- Integration tests: `backend/__tests__/integration/candidateStageUpdate.test.ts` (new)
- E2E tests: `backend/docs/e2e-tests.yaml` (Postman collection or curl scripts)
- Test fixtures: `backend/__tests__/fixtures/candidateStageTestData.ts` (new)
- Performance baseline: `backend/docs/PERFORMANCE-BASELINE.md` (new)

**Why**
Per story's definition of done: "All acceptance criteria are verified passing (manual or automated testing)". Testing ensures compliance with all 12 ACs and validates non-functional requirements (performance, security, audit logging).

Per CLAUDE.md architecture: Jest is configured for backend testing; tests follow standard patterns (unit → integration → e2e).

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Create unit tests for `candidateStageService`** (test business logic in isolation):
   ```typescript
   // backend/__tests__/services/candidateStageService.test.ts
   import { candidateStageService } from '../../src/application/services/candidateStageService';
   
   describe('CandidateStageService', () => {
     it('should update stage when valid applicationId and interviewStepId provided', async () => {
       // AC: Success response (HTTP 200)
     });
     
     it('should throw ApplicationNotFoundError when application does not exist', async () => {
       // AC: Application not found (HTTP 404)
     });
     
     it('should throw error when interviewStepId not in interview flow', async () => {
       // AC: Stage not in flow (HTTP 400)
     });
     
     it('should return success when updating to same stage (idempotent)', async () => {
       // AC: Idempotent behavior
     });
     
     it('should log audit entry with correct fields (userId, applicationId, oldStageId, newStageId, timestamp)', async () => {
       // AC: Audit logging
     });
   });
   ```

2. **Create integration tests for stage update flow** (test with real database):
   ```typescript
   // backend/__tests__/integration/candidateStageUpdate.test.ts
   import { PrismaClient } from '@prisma/client';
   
   describe('PUT /candidates/:applicationId/stage - Integration', () => {
     let prisma: PrismaClient;
     
     beforeAll(async () => {
       prisma = new PrismaClient();
       await seedTestData(prisma); // Create test position, candidate, application, interview steps
     });
     
     afterEach(async () => {
       await cleanupTestData(prisma); // Clean up after each test
     });
     
     it('should update Application.currentInterviewStep in database', async () => {
       const response = await request(app)
         .put('/candidates/1/stage')
         .set('Authorization', `Bearer ${recruiterToken}`)
         .send({ interviewStepId: 2 });
       
       expect(response.status).toBe(200);
       
       const updated = await prisma.application.findUnique({
         where: { id: 1 },
         include: { currentInterviewStepData: true }
       });
       expect(updated.currentInterviewStep).toBe(2);
     });
     
     it('should create audit log entry with correct fields', async () => {
       await request(app)
         .put('/candidates/1/stage')
         .set('Authorization', `Bearer ${recruiterToken}`)
         .send({ interviewStepId: 2 });
       
       const auditLog = await prisma.auditLog.findFirst({
         where: { applicationId: 1, action: 'STAGE_UPDATE' }
       });
       
       expect(auditLog).toBeDefined();
       expect(auditLog.oldStageId).toBe(1);
       expect(auditLog.newStageId).toBe(2);
       expect(auditLog.userId).toBe(recruiterUserId);
       expect(auditLog.timestamp).toBeDefined();
     });
     
     it('should reject when JWT missing (HTTP 401)', async () => {
       const response = await request(app)
         .put('/candidates/1/stage')
         .send({ interviewStepId: 2 });
       
       expect(response.status).toBe(401);
       expect(response.body.error).toContain('Unauthorized');
     });
     
     it('should reject when user role is not recruiter/hiring_manager (HTTP 403)', async () => {
       const response = await request(app)
         .put('/candidates/1/stage')
         .set('Authorization', `Bearer ${candidateToken}`)
         .send({ interviewStepId: 2 });
       
       expect(response.status).toBe(403);
       expect(response.body.error).toContain('Forbidden');
     });
     
     it('should reject when applicationId is invalid (HTTP 400)', async () => {
       const response = await request(app)
         .put('/candidates/abc/stage')
         .set('Authorization', `Bearer ${recruiterToken}`)
         .send({ interviewStepId: 2 });
       
       expect(response.status).toBe(400);
       expect(response.body.error).toContain('Invalid application ID');
     });
     
     it('should reject when interviewStepId not in interview flow (HTTP 400)', async () => {
       const response = await request(app)
         .put('/candidates/1/stage')
         .set('Authorization', `Bearer ${recruiterToken}`)
         .send({ interviewStepId: 999 });
       
       expect(response.status).toBe(400);
       expect(response.body.error).toContain('Interview step not valid');
     });
     
     it('should return correct response structure on success (HTTP 200)', async () => {
       const response = await request(app)
         .put('/candidates/1/stage')
         .set('Authorization', `Bearer ${recruiterToken}`)
         .send({ interviewStepId: 2 });
       
       expect(response.status).toBe(200);
       expect(response.body).toHaveProperty('applicationId');
       expect(response.body).toHaveProperty('candidateId');
       expect(response.body).toHaveProperty('positionId');
       expect(response.body).toHaveProperty('applicationDate');
       expect(response.body).toHaveProperty('updatedAt');
       expect(response.body.currentInterviewStep).toHaveProperty('stepId');
       expect(response.body.currentInterviewStep).toHaveProperty('stepName');
     });
   });
   ```

3. **Create E2E test examples** (curl/Postman for manual testing):
   ```bash
   # backend/docs/e2e-tests.yaml
   # Test Case 1: Successful stage update
   curl -X PUT http://localhost:3010/candidates/1/stage \
     -H "Authorization: Bearer recruiter-token" \
     -H "Content-Type: application/json" \
     -d '{"interviewStepId": 2, "notes": "Passed screening"}' \
     -w "\nStatus: %{http_code}\n"
   # Expected: HTTP 200 with updated application
   
   # Test Case 2: Missing authorization
   curl -X PUT http://localhost:3010/candidates/1/stage \
     -H "Content-Type: application/json" \
     -d '{"interviewStepId": 2}' \
     -w "\nStatus: %{http_code}\n"
   # Expected: HTTP 401 Unauthorized
   
   # Test Case 3: Invalid application ID
   curl -X PUT http://localhost:3010/candidates/invalid/stage \
     -H "Authorization: Bearer recruiter-token" \
     -H "Content-Type: application/json" \
     -d '{"interviewStepId": 2}' \
     -w "\nStatus: %{http_code}\n"
   # Expected: HTTP 400 Invalid application ID
   ```

4. **Create test data fixtures**:
   ```typescript
   // backend/__tests__/fixtures/candidateStageTestData.ts
   export async function seedCandidateStageTestData(prisma: PrismaClient) {
     // Create company
     const company = await prisma.company.create({
       data: { name: 'Test Company' }
     });
     
     // Create position with interview flow
     const position = await prisma.position.create({
       data: {
         title: 'Software Engineer',
         companyId: company.id,
         interviewFlowId: 1 // Assume flow exists
       }
     });
     
     // Create interview steps for flow
     const steps = await Promise.all([
       prisma.interviewStep.create({
         data: { stepName: 'Initial Screening', stepOrder: 1, interviewFlowId: 1 }
       }),
       prisma.interviewStep.create({
         data: { stepName: 'Technical Interview', stepOrder: 2, interviewFlowId: 1 }
       }),
       prisma.interviewStep.create({
         data: { stepName: 'Final Interview', stepOrder: 3, interviewFlowId: 1 }
       })
     ]);
     
     // Create candidate
     const candidate = await prisma.candidate.create({
       data: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
     });
     
     // Create application (currently at step 1)
     const application = await prisma.application.create({
       data: {
         candidateId: candidate.id,
         positionId: position.id,
         currentInterviewStep: steps[0].id,
         applicationDate: new Date()
       }
     });
     
     // Create recruiter and hiring manager for auth tests
     const recruiter = await prisma.employee.create({
       data: { name: 'Alice Recruiter', role: 'recruiter', companyId: company.id }
     });
     
     return { application, candidate, position, steps, recruiter };
   }
   ```

5. **Run tests and measure performance**:
   ```bash
   # Run all tests
   cd backend
   npm test -- --testPathPattern=candidateStageService
   npm test -- --testPathPattern=candidateStageUpdate
   
   # Measure performance (add timing assertions)
   # In integration test: measure time from request start to response
   const start = Date.now();
   const response = await request(app).put(...);
   const duration = Date.now() - start;
   expect(duration).toBeLessThan(200); // SLO: <200ms
   ```

6. **Document regression scope**:
   - Existing `/positions/:id/candidates` GET endpoint must still work
   - Existing candidate creation, application endpoints must not break
   - Interview flow queries must not degrade in performance
   - Audit logging must not impact other features' latency

**Inputs / Outputs / Contracts**

**Test Case Matrix:**

| Test Case ID | AC # | Scenario | Input | Expected | Status Code |
|---|---|---|---|---|---|
| TC-1 | 1 | Valid stage update | applicationId=1, interviewStepId=2, recruiter role | Updated application with new stage | 200 |
| TC-2 | 2 | Valid position context | applicationId with positionId reference | Application includes position context | 200 |
| TC-3 | 3 | Valid stage validation | interviewStepId=2 in position's flow | Success | 200 |
| TC-4 | 4 | Success response format | Valid update | Response includes all required fields | 200 |
| TC-5 | 5 | Invalid position ID | applicationId="abc" | "Invalid application ID" | 400 |
| TC-6 | 6 | Invalid stage ID | interviewStepId=999 (not in flow) | "Invalid interview step ID" | 400 |
| TC-7 | 7 | Application not found | applicationId=9999 | "Application with ID 9999 not found" | 404 |
| TC-8 | 8 | Stage not in flow | interviewStepId outside flow | "Interview step not valid for this position" | 400 |
| TC-9 | 9 | Missing auth | No Authorization header | "Unauthorized" | 401 |
| TC-10 | 10 | Wrong role | Authorization with candidate role | "Forbidden" | 403 |
| TC-11 | 11 | Audit log created | Valid update | Audit entry with correct fields | 200 + DB entry |
| TC-12 | 12 | Idempotent update | Same applicationId + interviewStepId twice | Both return 200 | 200 |

**Performance Test:**

```
Test: Stage update performance baseline
Input: Valid stage update request
Measurement: HTTP request start → response received
Target: <200ms (per SLO)
Test environment: Local database, no load
Repeat: 10 iterations, measure p50, p95, p99
```

**Dependencies**
- Jest (already configured in backend)
- Supertest for HTTP testing
- Test database (separate from production, managed by Docker)
- Prisma client for database access in tests

---

### Acceptance Criteria

- [ ] Unit tests created for `candidateStageService` covering all validation logic
- [ ] Unit tests cover error cases: ApplicationNotFoundError, StepNotInFlowError, invalid inputs
- [ ] Integration tests created for end-to-end stage update flow (HTTP → database)
- [ ] Integration tests verify all 12 ACs: success response, auth, role check, validation, audit log, idempotency
- [ ] Test data fixtures (candidate, position, application, interview steps) created and seedable
- [ ] All HTTP status codes tested: 200, 400, 401, 403, 404, 500
- [ ] All error messages match story spec exactly (word-for-word)
- [ ] E2E tests documented as curl/Postman examples with expected responses
- [ ] Performance baseline measured: stage update <200ms per SLO
- [ ] Audit log correctness verified: timestamp, userId, applicationId, oldStageId, newStageId logged
- [ ] Idempotency tested: updating to same stage twice returns 200 both times
- [ ] Regression scope defined: existing endpoints not broken by new changes
- [ ] All tests pass locally and in CI pipeline
- [ ] Test coverage >90% for service and controller

---

### Test Requirements

**Unit Tests**
- **File**: `backend/__tests__/services/candidateStageService.test.ts`
- **Coverage**: 
  - `updateStage()` method with valid inputs
  - ApplicationNotFoundError when applicationId doesn't exist
  - StepNotInFlowError when interviewStepId not in position's flow
  - Idempotency: same step twice = success
  - Audit log created with correct fields
- **Framework**: Jest with ts-jest
- **Execution**: `npm test -- --testPathPattern=candidateStageService`

**Integration Tests**
- **File**: `backend/__tests__/integration/candidateStageUpdate.test.ts`
- **Coverage**:
  - Success case: HTTP 200 with updated application
  - All error cases: 400, 401, 403, 404 with correct error messages
  - Auth middleware: rejects request without JWT
  - Role middleware: rejects non-recruiter/hiring_manager roles
  - Database state: Application.currentInterviewStep updated correctly
  - Audit log: entry created with timestamp, userId, stage IDs
  - Response payload: all fields present and types correct
- **Setup**: Seed test data before each test suite
- **Cleanup**: Delete test data after each test
- **Framework**: Jest + Supertest
- **Execution**: `npm test -- --testPathPattern=candidateStageUpdate`

**E2E Tests**
- **Format**: curl examples or Postman collection (manual testing, not automated CI)
- **Coverage**: Happy path (200) + error cases (400, 401, 403, 404)
- **Execution**: Manual testing with real backend running on localhost:3010
- **Documentation**: `backend/docs/e2e-tests.yaml` with step-by-step instructions

**Manual Testing / Regression Scope**
- Verify existing GET /candidates endpoint still works
- Verify existing POST /candidates endpoint not broken
- Verify interview flow queries not impacted
- Test with real interview flows (>3 steps) to ensure validation handles edge cases
- Performance test on staging with production-like data volume (1000+ applications)
- Verify audit logs are queryable and timestamps are accurate

---

### Non-Functional Requirements

**Performance**
- Stage update request completes in <200ms (p95 on local database)
- Database query (fetch + update) <100ms
- Audit log insertion <50ms
- No performance regression on other endpoints

**Reliability**
- All tests pass consistently (no flaky tests)
- Test data is cleaned up properly between runs
- Test database can be reset to known state

**Test Coverage**
- >90% code coverage for service and controller logic
- 100% coverage of error paths (all catch blocks)
- All acceptance criteria covered by at least one test

**Maintainability**
- Test code follows same patterns as existing tests
- Fixtures are reusable across test suites
- Clear test names that describe what's being tested

---

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Tests depend on specific database state | Use fixtures to create test data; clean up after each test; don't rely on seed data |
| Flaky tests due to timing issues | Use explicit waits; avoid hardcoded sleeps; use database state verification instead of timing |
| Performance tests show >200ms latency | Profile slow queries; add indexes if needed; revisit SLO if unrealistic |
| Audit log tests fail due to timestamp precision | Compare timestamps with ±1s tolerance (accounts for database/app time skew) |
| Role-based tests fail due to auth middleware changes | Keep auth middleware tests separate; test role logic in isolation |

---

### Definition of Done

- [ ] Unit tests created and all passing
- [ ] Integration tests created and all passing
- [ ] E2E test examples documented and manually verified
- [ ] Test data fixtures created and seeded successfully
- [ ] All 12 ACs verified via tests (automated or manual)
- [ ] Performance baseline measured and documented (<200ms)
- [ ] Audit log correctness verified with automated test
- [ ] Idempotency verified (update same stage twice = 200 both times)
- [ ] Error messages match story spec exactly
- [ ] Regression tests pass (existing endpoints not broken)
- [ ] Test coverage >90% for service and controller
- [ ] All tests pass in CI pipeline
- [ ] Test documentation updated with examples and instructions
- [ ] Code reviewed and approved
- [ ] Merged to main branch

---
