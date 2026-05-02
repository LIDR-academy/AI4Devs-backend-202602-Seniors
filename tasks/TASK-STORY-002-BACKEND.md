# Tasks for STORY-002: Update Candidate Interview Stage

**Discipline**: Backend  
**Total Tasks**: 3  
**Coverage**: AC (validation, auth, stage update logic, error handling, audit logging)

---

## TASK-STORY-002-BACKEND-001

**Title**: Implement candidateStageService with stage update logic and validation

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: Backend

**Depends On**: TASK-STORY-002-DB-001 (AuditLog table must exist)

**Blocks**: TASK-STORY-002-BACKEND-002 (controller depends on service)

---

### Purpose & Scope

**Purpose**
Create service layer class `CandidateStageService` with business logic for updating candidate interview stages. Implements validation (application exists, stage exists in flow), update operation, and audit logging. Follows layered architecture pattern (service → domain model).

Fulfills AC:
- "Invalid stage ID (HTTP 400): Non-integer or stage ID not in interview flow is rejected"
- "Application not found (HTTP 404): Non-existent application ID returns error"
- "Stage not in flow (HTTP 400): Selected stage is not part of position's interview flow"
- "Audit logging: Every stage update logs timestamp, user ID, application ID, old stage, new stage"
- "Idempotent behavior: Updating to same stage twice returns 200 both times"

**Scope of Change**
- Create: `backend/src/application/services/candidateStageService.ts` (new file)
- Create: Custom error classes (`ApplicationNotFoundError`, `InvalidInterviewStepError`, `StepNotInFlowError`)
- Modify: `backend/src/domain/Application.ts` (add `updateStage()` method if not using service-only pattern)
- Modify: `backend/src/application/services/auditService.ts` (create if doesn't exist; add `logStageChange()` method)

**Where**
- Service: `backend/src/application/services/candidateStageService.ts`
- Domain model: `backend/src/domain/Application.ts`
- Audit service: `backend/src/application/services/auditService.ts`

**Why**
Per CLAUDE.md architecture: "Request Flow: Route → Controller → Service → Domain Model → Prisma Client → Database."

Service layer handles business logic (validation, audit logging); domain model handles persistence. This separation enables testability and reusability.

Per story analysis: Audit logging is mandatory for compliance; must be atomic with stage update (wrapped in transaction).

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Create custom error classes** (new file or in service):
   ```typescript
   export class ApplicationNotFoundError extends Error {
     constructor(applicationId: number) {
       super(`Application with ID ${applicationId} not found`);
       this.name = 'ApplicationNotFoundError';
     }
   }

   export class InvalidInterviewStepError extends Error {
     constructor(stepId: number) {
       super(`Invalid interview step ID: ${stepId}`);
       this.name = 'InvalidInterviewStepError';
     }
   }

   export class StepNotInFlowError extends Error {
     constructor(stepId: number, positionId: number) {
       super(`Interview step ${stepId} is not valid for position ${positionId}`);
       this.name = 'StepNotInFlowError';
     }
   }
   ```

2. **Create CandidateStageService class**:
   - Constructor accepts `prisma: PrismaClient` (injected)
   - Method `updateStage(applicationId: number, interviewStepId: number, userId: number, notes?: string): Promise<Application>`
   - Validate inputs, fetch application, validate step in flow, update, log audit, return updated application

3. **Validation logic** (in order, fail-fast):
   - Check application exists: `prisma.application.findUnique({...})`
   - Fetch related position and interview flow
   - Check step exists: `prisma.interviewStep.findUnique({...})`
   - Check step is in flow: `step.interviewFlowId === position.interviewFlowId`
   - Idempotency: if current step == new step, return 200 with current application (no update needed)

4. **Update logic (transaction)**:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // 1. Update application
     const updated = await tx.application.update({
       where: { id: applicationId },
       data: { currentInterviewStep: interviewStepId },
       include: { /* relations */ }
     });

     // 2. Log to AuditLog
     await tx.auditLog.create({
       data: {
         action: 'STAGE_UPDATE',
         userId,
         applicationId,
         oldStageId: oldStep.id,
         newStageId: interviewStepId,
         details: notes ? { notes } : null
       }
     });

     return updated;
   });
   ```

5. **Error mapping**:
   - Throw custom errors for validation failures
   - Controller will catch and map to HTTP responses

**Inputs / Outputs / Contracts**

**Input Parameters:**
```typescript
// Service method signature
updateStage(
  applicationId: number,      // from URL parameter
  interviewStepId: number,    // from request body
  userId: number,             // from JWT token
  notes?: string              // from request body (optional)
): Promise<Application>
```

**Output Response Object:**
```typescript
interface UpdatedApplicationResponse {
  applicationId: number;
  candidateId: number;
  positionId: number;
  applicationDate: string;    // ISO 8601
  updatedAt: string;          // ISO 8601
  currentInterviewStep: {
    stepId: number;
    stepName: string;
    stepOrder: number;
    interviewFlowId: number;
  };
}
```

**Prisma Query with Includes:**
```typescript
const application = await prisma.application.findUnique({
  where: { id: applicationId },
  include: {
    position: {
      include: {
        interviewFlow: true
      }
    },
    candidate: true,
    currentInterviewStepData: {  // assuming relation defined
      select: {
        id: true,
        name: true,
        orderIndex: true,
        interviewFlowId: true
      }
    }
  }
});
```

**Dependencies**
- `PrismaClient` (injected)
- AuditLog table must exist (TASK-DB-001)
- Application domain model with current Prisma relations

---

### Acceptance Criteria

- [ ] CandidateStageService class created with `updateStage()` method
- [ ] Validation: applicationId must be valid integer, application must exist (throw ApplicationNotFoundError if not)
- [ ] Validation: interviewStepId must be valid integer (throw InvalidInterviewStepError if not)
- [ ] Validation: interviewStepId must exist in the position's interview flow (throw StepNotInFlowError if not)
- [ ] Idempotency: if current step == new step, return success (200) without error
- [ ] Update operation: `Application.currentInterviewStep` updated to new step
- [ ] Audit logging: AuditLog entry created with action='STAGE_UPDATE', userId, applicationId, oldStageId, newStageId, timestamp
- [ ] Transaction: update + audit log are atomic (both succeed or both rollback)
- [ ] Return object includes: applicationId, candidateId, positionId, applicationDate, updatedAt, currentInterviewStep (with stepId, stepName, stepOrder, interviewFlowId)
- [ ] Error messages are user-friendly (no database errors exposed)

---

### Test Requirements

**Unit Tests**
- Test: `updateStage()` with valid inputs → returns updated application with new step
- Test: `updateStage()` with non-existent applicationId → throws ApplicationNotFoundError
- Test: `updateStage()` with invalid interviewStepId (non-integer) → throws InvalidInterviewStepError
- Test: `updateStage()` with stepId not in position's flow → throws StepNotInFlowError
- Test: `updateStage()` with same step as current → returns success (idempotency)
- Test: Audit log entry created with correct fields (action, userId, applicationId, oldStageId, newStageId, timestamp)
- Test: Transaction rollback on error (if update fails, audit log is not created)

**Integration Tests**
- Test: Real database with multiple applications, verify correct one is updated
- Test: FK constraint validation (verify stepId references valid InterviewStep)
- Test: Concurrent updates (two stage updates on same application, verify one succeeds, one is rejected or overwrites)

**Edge Cases**
- Test: Step is null (application has no current step) → update works correctly
- Test: Step is first step (orderIndex = 1) → can move to step 2
- Test: Step is last step (orderIndex = N) → cannot move further (business logic, tested in integration)
- Test: Notes parameter with special characters (SQL injection attempt) → notes are safely escaped by Prisma

---

### Non-Functional Requirements

**Performance**
- Service executes in <100ms (DB update <50ms + audit log insert <50ms)
- No N+1 queries (use Prisma includes to fetch related data in one query)

**Security**
- No SQL injection (Prisma parameterized queries protect against this)
- No sensitive data in logs (userId stored, not user email/name)
- Input validation before any DB operations

**Reliability**
- Transaction safety: update and audit log are atomic
- Idempotent: safe to retry on network failure
- Clear error messages (don't expose internal database errors)

**Testability**
- Service accepts PrismaClient as constructor parameter (easy to mock/inject)
- No global state or side effects
- Pure function behavior (same inputs = same outputs)

---

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Validation logic incomplete (missing step-in-flow check) | Unit tests cover all validation paths; code review catches gaps |
| Transaction not atomic (update succeeds but audit log fails) | Wrap in Prisma $transaction; test rollback scenario |
| Error messages expose database internals | Catch and rethrow with custom error classes |
| Concurrent stage updates cause race condition | Implement optimistic locking explicitly: (1) add `version Int @default(0)` to the `Application` model in `schema.prisma`; (2) include the current version in the `where` clause of the update — `tx.application.update({ where: { id: applicationId, version: currentVersion }, data: { currentInterviewStep: interviewStepId, version: { increment: 1 } } })`; (3) Prisma throws `P2025` when no row matches (i.e., version changed since the read); catch `P2025` inside the transaction and rethrow as `VersionConflictError` so callers can retry or surface an HTTP 409. Prisma does NOT handle this automatically. |

---

### Definition of Done

- [ ] CandidateStageService class created in `backend/src/application/services/candidateStageService.ts`
- [ ] Custom error classes defined (ApplicationNotFoundError, InvalidInterviewStepError, StepNotInFlowError)
- [ ] `updateStage()` method implements all validation steps
- [ ] Update operation uses Prisma transaction for atomicity
- [ ] Audit logging integrated with AuditLog table
- [ ] All unit tests pass (validation, update, audit log, transaction, error cases)
- [ ] Integration tests pass (real database, multiple applications, concurrent updates)
- [ ] Service is exported and can be imported by controller
- [ ] Code reviewed and approved
- [ ] Merged to main branch

---

## TASK-STORY-002-BACKEND-002

**Title**: Implement updateCandidateStage controller method with auth/role validation

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: Backend

**Depends On**: TASK-STORY-002-BACKEND-001 (service must exist)

**Blocks**: TASK-STORY-002-BACKEND-003 (route depends on controller)

---

### Purpose & Scope

**Purpose**
Implement HTTP request handler in `CandidateController` for PUT /candidates/:applicationId/stage endpoint. Handles authentication, role-based authorization, input validation, error handling, and HTTP response formatting. Maps service layer errors to appropriate HTTP status codes.

Fulfills AC:
- "Authentication required (HTTP 401): Missing or invalid Authorization header returns error"
- "Role-based access (HTTP 403): Only users with recruiter/hiring_manager role can update stages"
- "Valid position context: Request requires applicationId to identify the specific application"
- "Stage validation: Request accepts interviewStepId (integer)"
- "Success response (HTTP 200): Returns updated Application object with proper structure"
- All error responses (400, 403, 404, 500)

**Scope of Change**
- Modify: `backend/src/presentation/controllers/candidateController.ts` (add `updateCandidateStage()` method)
- Use existing: `authMiddleware` and `requireRole` middleware (already in codebase per STORY-001)
- Error handling: Map service errors to HTTP responses

**Where**
- Controller: `backend/src/presentation/controllers/candidateController.ts`
- Middleware: `backend/src/middleware/authMiddleware.ts` (already exists)

**Why**
Per CLAUDE.md: "Request Flow: Route → Controller → Service → Domain Model → Prisma Client → Database."

Controller handles HTTP concerns (status codes, response format, auth middleware chaining). Service handles business logic.

Per story: Auth and role-based access are non-functional requirements for security.

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Add method to CandidateController**:
   ```typescript
   async updateCandidateStage(req: Request, res: Response): Promise<void> {
     try {
       // 1. Extract and validate input
       const applicationId = Number.parseInt(req.params.applicationId, 10);
       const { interviewStepId, notes } = req.body;
       const userId = req.user?.id; // from JWT token

       // 2. Validate parameters
       if (Number.isNaN(applicationId) || applicationId <= 0) {
         res.status(400).json({
           error: 'Invalid application ID',
           statusCode: 400,
           message: 'Application ID must be a valid integer'
         });
         return;
       }

       if (!Number.isInteger(interviewStepId) || interviewStepId <= 0) {
         res.status(400).json({
           error: 'Invalid interview step ID',
           statusCode: 400,
           message: 'Interview step ID must be a valid integer'
         });
         return;
       }

       // 3. Call service
       const candidateStageService = new CandidateStageService(req.prisma);
       const updated = await candidateStageService.updateStage(
         applicationId,
         interviewStepId,
         userId,
         notes
       );

       // 4. Return success response
       res.status(200).json({
         applicationId: updated.id,
         candidateId: updated.candidateId,
         positionId: updated.positionId,
         applicationDate: updated.applicationDate.toISOString(),
         updatedAt: new Date().toISOString(),
         currentInterviewStep: {
           stepId: updated.currentInterviewStepData?.id,
           stepName: updated.currentInterviewStepData?.name,
           stepOrder: updated.currentInterviewStepData?.orderIndex,
           interviewFlowId: updated.currentInterviewStepData?.interviewFlowId
         }
       });
     } catch (error: any) {
       // 5. Handle service errors and map to HTTP responses
       if (error instanceof ApplicationNotFoundError) {
         res.status(404).json({
           error: 'Application not found',
           statusCode: 404,
           message: error.message
         });
       } else if (error instanceof StepNotInFlowError || error instanceof InvalidInterviewStepError) {
         res.status(400).json({
           error: error instanceof StepNotInFlowError ? 'Interview step not valid for this position' : 'Invalid interview step ID',
           statusCode: 400,
           message: error.message
         });
       } else {
         res.status(500).json({
           error: 'Internal Server Error',
           statusCode: 500,
           message: 'An error occurred while updating candidate stage'
         });
       }
     }
   }
   ```

2. **Apply middleware to route** (in route file):
   ```typescript
   router.put(
     '/candidates/:applicationId/stage',
     authMiddleware,
     requireRole(['recruiter', 'hiring_manager']),
     candidateController.updateCandidateStage.bind(candidateController)
   );
   ```

3. **Verify middleware chains correctly**:
   - `authMiddleware` extracts JWT and sets `req.user`
   - `requireRole` checks `req.user.role` is 'recruiter' or 'hiring_manager'
   - If either fails, middleware sends error response and `next()` is not called

**Inputs / Outputs / Contracts**

**HTTP Request:**
```
PUT /candidates/3/stage
Authorization: Bearer recruiter-token
Content-Type: application/json

{
  "interviewStepId": 2,
  "notes": "Passed initial screening, scheduled for next round"
}
```

**HTTP Response (Success - 200):**
```json
{
  "applicationId": 3,
  "candidateId": 1,
  "positionId": 1,
  "applicationDate": "2026-05-01T13:20:26.527Z",
  "updatedAt": "2026-05-01T14:35:00.000Z",
  "currentInterviewStep": {
    "stepId": 2,
    "stepName": "Technical Interview",
    "stepOrder": 2,
    "interviewFlowId": 1
  }
}
```

**HTTP Response (Error - 400 Invalid Step):**
```json
{
  "error": "Interview step not valid for this position",
  "statusCode": 400,
  "message": "Interview step 99 is not valid for position 1"
}
```

**Error Status Codes:**
- 400: Invalid applicationId, invalid interviewStepId, step not in flow
- 401: Missing or invalid Authorization header (handled by authMiddleware)
- 403: User lacks recruiter/hiring_manager role (handled by requireRole middleware)
- 404: Application not found
- 500: Server error (database, unexpected exceptions)

**Dependencies**
- `CandidateStageService` (from TASK-BACKEND-001)
- `authMiddleware` and `requireRole` middleware (existing in codebase)
- `CandidateController` class must exist (modify existing)

---

### Acceptance Criteria

- [ ] `updateCandidateStage()` method added to CandidateController
- [ ] Input validation: applicationId and interviewStepId are parsed as integers
- [ ] Input validation: applicationId must be positive integer
- [ ] Input validation: interviewStepId must be positive integer
- [ ] Error handling: Invalid applicationId returns HTTP 400 with error message
- [ ] Error handling: Invalid interviewStepId returns HTTP 400 with error message
- [ ] Error handling: Application not found returns HTTP 404
- [ ] Error handling: Step not in flow returns HTTP 400
- [ ] Error handling: Server errors return HTTP 500 with generic message (no stack trace)
- [ ] Success response: HTTP 200 with applicationId, candidateId, positionId, applicationDate, updatedAt, currentInterviewStep
- [ ] All error response objects include: error (string), statusCode (number), message (string)
- [ ] Middleware chain: authMiddleware → requireRole(['recruiter', 'hiring_manager']) → controller
- [ ] Authorization: If JWT missing, authMiddleware returns 401
- [ ] Authorization: If role not recruiter/hiring_manager, requireRole returns 403

---

### Test Requirements

**Unit Tests**
- Mock `CandidateStageService.updateStage()` to return valid application
- Test: Valid request → calls service with correct parameters → returns HTTP 200
- Test: Invalid applicationId (non-integer) → returns HTTP 400
- Test: Invalid interviewStepId (non-integer) → returns HTTP 400
- Test: Service throws ApplicationNotFoundError → returns HTTP 404
- Test: Service throws StepNotInFlowError → returns HTTP 400
- Test: Service throws unexpected error → returns HTTP 500

**Integration Tests**
- Test: Full flow with real database: PUT valid request → returns HTTP 200 with correct data
- Test: Full flow with missing JWT → authMiddleware returns HTTP 401
- Test: Full flow with non-recruiter user → requireRole returns HTTP 403
- Test: Full flow with invalid applicationId → returns HTTP 404

**Manual Testing / Regression Scope**
- Curl request with valid data → verify HTTP 200 response
- Curl request without Authorization header → verify HTTP 401
- Curl request with non-recruiter token → verify HTTP 403
- Verify other endpoints still work (no regression)

---

### Non-Functional Requirements

**Performance**
- Controller method executes in <10ms (just input validation + service call)
- Service method handles <100ms (see TASK-BACKEND-001)

**Security**
- Authentication required (JWT token)
- Authorization required (recruiter or hiring_manager role)
- Input validation prevents SQL injection
- Error messages don't expose database structure
- Notes parameter sanitized (Prisma handles escaping)

**Error Handling**
- All errors caught and mapped to HTTP responses
- No unhandled exceptions
- Clear error messages for client

---

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Middleware chain incomplete (auth not enforced) | Verify authMiddleware and requireRole are imported and applied to route |
| Input validation bypassed (non-integer allowed) | Unit tests verify validation catches non-integers |
| Error mapping incorrect (service error mapped to wrong HTTP code) | Unit tests cover all error paths |

---

### Definition of Done

- [ ] `updateCandidateStage()` method implemented in CandidateController
- [ ] Input validation: applicationId and interviewStepId parsed and validated
- [ ] Error handling: All service errors mapped to HTTP responses
- [ ] Response formatting: Success response includes all required fields
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing: Valid requests return 200, invalid requests return correct error codes
- [ ] Code reviewed and approved
- [ ] Merged to main branch

---

## TASK-STORY-002-BACKEND-003

**Title**: Register PUT /candidates/:applicationId/stage route with auth/role middleware

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: Backend

**Depends On**: TASK-STORY-002-BACKEND-002 (controller method must exist)

**Blocks**: TASK-STORY-002-API-001 (API contract must match route definition)

---

### Purpose & Scope

**Purpose**
Register the new PUT endpoint in Express router with proper middleware chain. Ensures authentication and authorization are enforced before controller is called.

Fulfills AC:
- "API endpoint exists at PUT /candidates/:applicationId/stage"
- "Authentication required (HTTP 401)"
- "Role-based access (HTTP 403)"

**Scope of Change**
- Modify: `backend/src/routes/candidateRoutes.ts` (add route definition)
- Reference: `authMiddleware` and `requireRole` (already exist)

**Where**
- Route file: `backend/src/routes/candidateRoutes.ts`

**Why**
Express router is the entry point for HTTP requests. Middleware chains must be configured here to enforce auth/authz before business logic executes.

Per story: "Middleware: authMiddleware → requireRole(['recruiter', 'hiring_manager']) → controller"

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Import required middleware and controller**:
   ```typescript
   import { authMiddleware, requireRole } from '../middleware/authMiddleware';
   import CandidateController from '../presentation/controllers/candidateController';
   ```

2. **Add route to router**:
   ```typescript
   // In candidateRoutes.ts
   const candidateController = new CandidateController();

   router.put(
     '/candidates/:applicationId/stage',
     authMiddleware,
     requireRole(['recruiter', 'hiring_manager']),
     async (req, res) => {
       await candidateController.updateCandidateStage(req, res);
     }
   );
   ```

3. **Verify route registration in main app** (backend/src/index.ts):
   ```typescript
   app.use('/api', candidateRoutes);  // or whatever path prefix
   // Endpoint becomes: PUT /api/candidates/:applicationId/stage
   ```

4. **Test route is registered**:
   ```bash
   # Check routes are registered (if app has debug endpoint)
   curl http://localhost:3010/api/candidates/1/stage -X OPTIONS
   ```

**Inputs / Outputs / Contracts**

**Route Definition:**
```
PUT /candidates/:applicationId/stage
Middleware: authMiddleware → requireRole(['recruiter', 'hiring_manager'])
Handler: CandidateController.updateCandidateStage()
```

**URL Parameter:**
- `applicationId`: integer, extracted from URL path

**Request Body Schema:**
```json
{
  "interviewStepId": number,  // required
  "notes": string             // optional
}
```

**Dependencies**
- `candidateRoutes.ts` must import and export router
- `authMiddleware` must exist in `backend/src/middleware/`
- `CandidateController` must exist and have `updateCandidateStage()` method
- Route must be registered in main app (index.ts)

---

### Acceptance Criteria

- [ ] Route definition: `router.put('/candidates/:applicationId/stage', ...)`
- [ ] Middleware chain: authMiddleware applied first
- [ ] Middleware chain: requireRole(['recruiter', 'hiring_manager']) applied second
- [ ] Controller method: `updateCandidateStage` called as route handler
- [ ] Route exported from candidateRoutes.ts
- [ ] Route registered in main app (backend/src/index.ts)
- [ ] Test: GET /candidates/:applicationId/stage returns 405 (method not allowed) or is not defined
- [ ] Test: PUT /candidates/:applicationId/stage without Authorization returns 401
- [ ] Test: PUT /candidates/:applicationId/stage with non-recruiter user returns 403
- [ ] Test: PUT /candidates/:applicationId/stage with valid recruiter token calls controller

---

### Test Requirements

**Unit Tests**
- Test: Route is registered in router
- Test: Middleware array includes authMiddleware and requireRole

**Integration Tests**
- Test: PUT /candidates/1/stage without Authorization → 401
- Test: PUT /candidates/1/stage with non-recruiter token → 403
- Test: PUT /candidates/1/stage with valid token and valid data → 200

**Manual Testing / Regression Scope**
- Verify route is reachable: `curl -X PUT http://localhost:3010/candidates/1/stage`
- Verify middleware is enforced: no Authorization header → 401
- Verify other routes still work (no regression)

---

### Non-Functional Requirements

**Performance**
- Route matching: <1ms
- Middleware execution: <5ms (auth/role check)

**Reliability**
- Route must be registered before app listens on port
- Middleware chain must execute in correct order

---

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Route not registered in main app | Verify import in index.ts and app.use() call |
| Middleware order incorrect (role checked before auth) | Unit test verifies middleware array order |
| Route path has typo (doesn't match client expectations) | Match path to API contract in TASK-API-001 |

---

### Definition of Done

- [ ] Route registered: `router.put('/candidates/:applicationId/stage', ...)`
- [ ] Middleware chain includes authMiddleware and requireRole
- [ ] Route exported from candidateRoutes.ts
- [ ] Route imported and registered in main app (index.ts)
- [ ] Manual test: PUT request with valid token returns 200
- [ ] Manual test: PUT request without token returns 401
- [ ] Manual test: PUT request with non-recruiter role returns 403
- [ ] Code reviewed and approved
- [ ] Merged to main branch
