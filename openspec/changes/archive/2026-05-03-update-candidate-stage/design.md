## Context

The LTI Talent Tracking System uses a structured interview flow where candidates progress through defined stages (InterviewSteps) for each position. The Application model tracks which InterviewStep a candidate is currently in via the `currentInterviewStep` field.

Current state of the codebase:
- Repository pattern partially implemented (IPositionRepository exists, IApplicationRepository does not)
- PrismaClient is constructor-injected into repositories (following PositionRepository pattern)
- Standard response envelope `{ success, data }` / `{ success, error }` established
- Domain errors (NotFoundError) exist in `backend/src/domain/errors/`
- Validation centralized in `backend/src/application/validator.ts`
- Unit tests with 90% coverage target (positionService.test.ts, positionController.test.ts, PositionRepository.test.ts exist as reference)

The new endpoint must follow the existing architectural patterns while remaining decoupled from legacy code that has technical debt (direct Prisma instantiation in domain models, Spanish comments, etc.).

## Goals / Non-Goals

**Goals:**
1. Create `PUT /candidates/:id/stage` endpoint that updates a candidate's interview stage
2. Implement full layered architecture: Repository interface → Infrastructure → Service → Controller → Routes
3. Validate candidate ownership of the application (prevent cross-candidate updates)
4. Validate interview step belongs to the position's interview flow
5. Achieve 90%+ unit test coverage for all new files
6. Update `api-spec.yaml` with OpenAPI documentation
7. Use English-only comments and error messages
8. No `any` types — strict TypeScript throughout

**Non-Goals:**
1. Do NOT refactor existing `candidateService.ts` or `candidateController.ts` legacy code
2. Do NOT fix PrismaClient instantiation in domain models (Application.ts, Candidate.ts, etc.)
3. Do NOT remove Spanish comments from existing files
4. Do NOT implement authentication/authorization (assumed handled at middleware level)
5. Do NOT create audit logging for stage changes (future enhancement)
6. Do NOT implement bulk stage updates (single application only)

## Decisions

### 1. Repository Pattern with Constructor Injection
**Decision**: Create `IApplicationRepository` interface and `ApplicationRepository` implementation with constructor-injected `PrismaClient`.

**Rationale**: Follows existing `IPositionRepository` / `PositionRepository` pattern. Enables unit testing via mocking. Avoids the legacy `new PrismaClient()` anti-pattern in domain models.

```typescript
// Interface in domain layer
export interface IApplicationRepository {
  findByIdAndCandidateId(applicationId: number, candidateId: number): Promise<Application | null>;
  updateInterviewStep(applicationId: number, newStepId: number, notes?: string): Promise<Application>;
  isValidInterviewStepForPosition(positionId: number, stepId: number): Promise<boolean>;
  getInterviewStepName(stepId: number): Promise<string | null>;
}
```

### 2. Service Layer with Business Logic
**Decision**: Create `CandidateStageService` class with injected `IApplicationRepository` and `ICandidateRepository`.

**Rationale**: Centralizes business logic (validation sequence, error handling). Makes controller thin and testable. Follows pattern established by `PositionService`.

**Validation sequence**:
1. Check candidate exists (via candidateRepository or application lookup)
2. Check application exists and belongs to candidate
3. Check new interview step is valid for the position's interview flow
4. Perform update

### 3. Request Body Structure
**Decision**: Require `applicationId` and `newInterviewStep` in body; `notes` optional.

**Rationale**: A candidate may have multiple applications (different positions). Using `applicationId` rather than `positionId` ensures we update the correct application instance. `notes` allows recruiters to document the reason for stage change.

```typescript
interface UpdateStageRequest {
  applicationId: number;
  newInterviewStep: number;
  notes?: string;
}
```

### 4. Response Body Structure
**Decision**: Return enriched response with `previousStep`, `currentInterviewStep`, `stepName`.

**Rationale**: Provides full context to the client without requiring additional API calls. Useful for UI to show "moved from X to Y" notifications.

```typescript
interface UpdateStageResponse {
  applicationId: number;
  candidateId: number;
  positionId: number;
  previousStep: number;
  currentInterviewStep: number;
  stepName: string;
  updatedAt: string;
  notes?: string;
}
```

### 5. Error Handling Strategy
**Decision**: Use `NotFoundError` for 404 scenarios, custom `ValidationError` for 400 scenarios. Pass all errors to `next(error)` in controller.

**Rationale**: Consistent with existing error handling in `positionController.ts`. Enables centralized error middleware to format responses.

**Error scenarios**:
- Candidate not found → 404 Not Found
- Application not found for candidate → 404 Not Found
- Invalid interview step for position → 400 Bad Request
- Missing/invalid request body fields → 400 Validation Error

### 6. Validation Strategy
**Decision**: Add `validateStageUpdateData()` to existing `validator.ts`. Validate positive integers for IDs, optional notes max 500 chars.

**Rationale**: Centralizes validation logic. Reuses existing validation patterns. Prevents invalid data from reaching service layer.

### 7. Test Strategy
**Decision**: Unit tests for all layers with Jest mocking.

**Repository tests**: Mock PrismaClient
**Service tests**: Mock IApplicationRepository, ICandidateRepository  
**Controller tests**: Mock service, mock Express req/res/next

**Coverage target**: 90%+ for branches, functions, lines, statements.

## Risks / Trade-offs

### Risk: IDOR (Insecure Direct Object Reference)
**Concern**: Malicious user could attempt to update another candidate's application by guessing application IDs.

**Mitigation**: Always verify `application.candidateId === candidateId` before allowing updates. Return generic "Application not found" message (don't reveal if application exists under different candidate).

### Risk: Invalid Interview Step Transition
**Concern**: User could move candidate to any step, skipping required stages or moving backwards incorrectly.

**Mitigation**: Validate that new step belongs to the position's interview flow. Future enhancement could add transition rules (e.g., prevent moving backwards, enforce sequential progression).

### Trade-off: Notes Field vs. Separate Audit Table
**Decision**: Store notes inline on Application model.

**Rationale**: Simpler implementation for current scope. Full audit trail would require new table (ApplicationStageHistory) — deferred to future enhancement.

### Trade-off: Previous Step in Response
**Decision**: Query current step before update to return `previousStep`.

**Rationale**: Adds one database read but provides valuable context. Could be optimized with Prisma's `update` returning old value, but explicit read is clearer.

## Files

### New Files
1. `backend/src/domain/repositories/IApplicationRepository.ts` — Repository interface
2. `backend/src/infrastructure/repositories/ApplicationRepository.ts` — Prisma implementation
3. `backend/src/infrastructure/repositories/ApplicationRepository.test.ts` — Unit tests
4. `backend/src/application/services/candidateStageService.ts` — Business logic
5. `backend/src/application/services/candidateStageService.test.ts` — Unit tests
6. `backend/src/presentation/controllers/candidateStageController.ts` — HTTP handler
7. `backend/src/presentation/controllers/candidateStageController.test.ts` — Unit tests

### Modified Files
1. `backend/src/routes/candidateRoutes.ts` — Add PUT /:id/stage route
2. `backend/src/application/validator.ts` — Add `validateStageUpdateData()`
3. `backend/api-spec.yaml` — Add endpoint documentation
4. `backend/src/domain/errors/` — May add `ValidationError.ts` if not existing

### api-spec.yaml Additions

```yaml
/candidates/{id}/stage:
  put:
    summary: Update candidate interview stage
    description: Updates the current interview step for a candidate's application
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Candidate ID
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              applicationId:
                type: integer
                description: Application ID to update
              newInterviewStep:
                type: integer
                description: New interview step ID
              notes:
                type: string
                maxLength: 500
                description: Optional notes about the stage change
            required: [applicationId, newInterviewStep]
    responses:
      '200':
        description: Stage updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    applicationId:
                      type: integer
                    candidateId:
                      type: integer
                    positionId:
                      type: integer
                    previousStep:
                      type: integer
                    currentInterviewStep:
                      type: integer
                    stepName:
                      type: string
                    updatedAt:
                      type: string
                      format: date-time
                    notes:
                      type: string
                message:
                  type: string
      '400':
        description: Validation error
      '404':
        description: Candidate or application not found
      '500':
        description: Internal server error
```
