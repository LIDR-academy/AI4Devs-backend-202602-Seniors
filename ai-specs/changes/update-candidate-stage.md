# Update Candidate Interview Stage

## User Story

**As a** recruiter or hiring manager,  
**I want to** update the interview stage of a candidate for a specific position,  
**So that** I can track the candidate's progress through the hiring pipeline and ensure they move to the appropriate next step in the interview process.

---

## Acceptance Criteria

1. **Given** a valid candidate ID, application ID, and target interview step ID,  
   **When** I send a PUT request to `/candidates/:id/stage`,  
   **Then** the candidate's `currentInterviewStep` is updated and the updated application is returned.

2. **Given** a candidate ID that does not exist,  
   **When** I send a PUT request,  
   **Then** the system returns a 404 error with message "Candidate not found".

3. **Given** an application ID that does not belong to the specified candidate,  
   **When** I send a PUT request,  
   **Then** the system returns a 404 error with message "Application not found for this candidate".

4. **Given** an interview step ID that does not exist or is not part of the position's interview flow,  
   **When** I send a PUT request,  
   **Then** the system returns a 400 error with message "Invalid interview step".

5. **Given** a request with invalid or missing required fields (applicationId, newInterviewStep),  
   **When** I send a PUT request,  
   **Then** the system returns a 400 error with validation details.

6. **Given** an interview step transition that violates business rules (e.g., moving backwards without permission),  
   **When** I send a PUT request,  
   **Then** the system returns a 400 error with an appropriate message.

---

## Endpoints

### PUT /candidates/:id/stage

Update the interview stage for a candidate's application.

#### Request

**Path Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | integer | Yes | Candidate ID |

**Request Body:**
```json
{
  "applicationId": 123,
  "newInterviewStep": 5,
  "notes": "Candidate advanced after technical assessment"
}
```

**Field Details:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| applicationId | integer | Yes | The application ID to update (validates candidate ownership) |
| newInterviewStep | integer | Yes | The new interview step ID to move the candidate to |
| notes | string | No | Optional notes about the stage change |

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationId": 123,
    "candidateId": 456,
    "positionId": 789,
    "previousStep": 3,
    "currentInterviewStep": 5,
    "stepName": "Technical Interview",
    "updatedAt": "2024-01-15T10:30:00Z",
    "notes": "Candidate advanced after technical assessment"
  },
  "message": "Candidate stage updated successfully"
}
```

**Error - Candidate Not Found (404):**
```json
{
  "success": false,
  "error": {
    "message": "Candidate not found",
    "code": "NOT_FOUND"
  }
}
```

**Error - Application Not Found (404):**
```json
{
  "success": false,
  "error": {
    "message": "Application not found for this candidate",
    "code": "NOT_FOUND"
  }
}
```

**Error - Invalid Interview Step (400):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid interview step for this position's interview flow",
    "code": "VALIDATION_ERROR"
  }
}
```

**Error - Validation Failed (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "newInterviewStep", "message": "Interview step ID is required" }
    ]
  }
}
```

---

## Files to Modify

### 1. Domain Layer

**Create `backend/src/domain/repositories/IApplicationRepository.ts`**
- Define interface with methods:
  - `findByIdAndCandidateId(applicationId: number, candidateId: number): Promise<Application | null>`
  - `updateInterviewStep(applicationId: number, newStepId: number, notes?: string): Promise<Application>`
  - `isValidInterviewStepForPosition(positionId: number, stepId: number): Promise<boolean>`

### 2. Infrastructure Layer

**Create `backend/src/infrastructure/repositories/ApplicationRepository.ts`**
- Implement `IApplicationRepository` interface
- Use Prisma client for database operations
- Handle Prisma errors and transform to domain errors

**Create `backend/src/infrastructure/repositories/ApplicationRepository.test.ts`**
- Unit tests with 90%+ coverage
- Mock Prisma client
- Test all repository methods including error cases

### 3. Application Layer

**Create `backend/src/application/services/candidateStageService.ts`**
- `updateCandidateStage(candidateId: number, applicationId: number, newInterviewStep: number, notes?: string)`
- Business logic: validate candidate exists, validate application belongs to candidate, validate step is valid for position's flow
- Throw `NotFoundError` or `ValidationError` as appropriate

**Create `backend/src/application/services/candidateStageService.test.ts`**
- Unit tests with mocked repository
- Test happy path and all error scenarios
- AAA pattern, 90%+ coverage

**Update `backend/src/application/validator.ts`**
- Add `validateStageUpdateData(data: any)` function
- Validate `applicationId` (required, positive integer)
- Validate `newInterviewStep` (required, positive integer)
- Validate `notes` (optional, string, max 500 chars)

### 4. Presentation Layer

**Create `backend/src/presentation/controllers/candidateStageController.ts`**
- `makeUpdateCandidateStage(candidateStageService: CandidateStageService)` factory function
- Extract `candidateId` from path params
- Extract `applicationId`, `newInterviewStep`, `notes` from body
- Call validator, then service
- Return standard response envelope
- Pass errors to `next(error)`

**Create `backend/src/presentation/controllers/candidateStageController.test.ts`**
- Unit tests with mocked service
- Test HTTP status codes (200, 400, 404)
- Test response format
- 90%+ coverage

### 5. Routes Layer

**Update `backend/src/routes/candidateRoutes.ts`**
- Add `PUT /:id/stage` route
- Wire controller with service and repository (dependency injection pattern)

### 6. API Documentation

**Update `backend/api-spec.yaml`**
- Add `PUT /candidates/{id}/stage` endpoint definition
- Request/response schemas
- Error response documentation

---

## Definition of Done

- [ ] All files created/modified as listed above
- [ ] `PUT /candidates/:id/stage` endpoint returns correct success response (200)
- [ ] Endpoint returns 404 for non-existent candidate
- [ ] Endpoint returns 404 for application not belonging to candidate
- [ ] Endpoint returns 400 for invalid interview step
- [ ] Endpoint returns 400 for missing/invalid request body fields
- [ ] `api-spec.yaml` updated with OpenAPI documentation
- [ ] Unit tests for repository with 90%+ coverage
- [ ] Unit tests for service with 90%+ coverage
- [ ] Unit tests for controller with 90%+ coverage
- [ ] All tests pass (`npm test` in backend/)
- [ ] No Spanish comments or error messages
- [ ] No `any` types used (strict TypeScript)
- [ ] Uses repository pattern (no direct Prisma in service/controller)
- [ ] Uses standard response envelope `{ success, data }` / `{ success, error }`

---

## Testing

### Repository Tests (`ApplicationRepository.test.ts`)

**Mock Strategy:** Mock `PrismaClient` with `jest.mock('@prisma/client')`

**Test Cases:**
1. `should_return_application_when_found_by_id_and_candidate_id`
2. `should_return_null_when_application_not_found`
3. `should_update_interview_step_successfully`
4. `should_return_true_when_step_is_valid_for_position`
5. `should_return_false_when_step_is_not_in_flow`
6. `should_throw_error_when_database_fails`

### Service Tests (`candidateStageService.test.ts`)

**Mock Strategy:** Mock `IApplicationRepository` interface, mock `ICandidateRepository` for candidate lookup

**Test Cases:**
1. `should_update_stage_successfully_when_all_validations_pass`
2. `should_throw_not_found_error_when_candidate_does_not_exist`
3. `should_throw_not_found_error_when_application_not_found_for_candidate`
4. `should_throw_validation_error_when_step_invalid_for_position`
5. `should_include_notes_in_update_when_provided`

### Controller Tests (`candidateStageController.test.ts`)

**Mock Strategy:** Mock `CandidateStageService`, use `jest.mock()` for service module

**Test Cases:**
1. `should_return_200_with_success_response_when_stage_updated`
2. `should_return_404_when_candidate_not_found`
3. `should_return_404_when_application_not_found`
4. `should_return_400_when_validation_fails`
5. `should_return_400_when_invalid_interview_step`
6. `should_call_next_with_error_for_unexpected_errors`

---

## Non-Functional Requirements

### Security
- **Input Validation**: All inputs validated using validator.ts before processing
- **Ownership Validation**: Verify application belongs to candidate before update (prevent IDOR)
- **Type Safety**: Strict TypeScript with no `any` types

### Performance
- **Database Queries**: Use Prisma `findUnique` with `select` to minimize data transfer
- **N+1 Prevention**: Fetch related interview flow data in single query where needed
- **Response Time**: Target < 200ms for successful updates

### Error Handling
- **Custom Error Classes**: Use `NotFoundError`, `ValidationError` from domain/errors/
- **Error Propagation**: Pass errors to Express error middleware via `next(error)`
- **Error Logging**: Log errors with context (candidateId, applicationId) using future logger infrastructure
- **Client Response**: Never expose internal error details or stack traces in production

### Data Integrity
- **Transaction Safety**: Prisma update operations are atomic
- **Foreign Key Validation**: Verify interview step exists and belongs to correct interview flow
- **Audit Trail**: Consider recording stage transitions (future enhancement)
