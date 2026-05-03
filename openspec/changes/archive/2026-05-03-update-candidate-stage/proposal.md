## Why

The LTI Talent Tracking System currently lacks the ability to move candidates through the interview pipeline. Recruiters and hiring managers need a way to update a candidate's current interview stage as they progress through different phases of the hiring process (e.g., from "Initial Screening" to "Technical Interview" to "Final Interview").

This endpoint fills a critical gap in the hiring workflow by allowing authorized users to advance or modify a candidate's position in the interview flow for a specific job application.

## What Changes

### New Endpoint
- **PUT /candidates/:id/stage** — Updates the interview stage for a candidate's specific application

### Request/Response Contract
- **Path Parameter**: `id` (candidate ID)
- **Request Body**: `{ applicationId: number, newInterviewStep: number, notes?: string }`
- **Success Response (200)**: `{ success: true, data: { applicationId, candidateId, positionId, previousStep, currentInterviewStep, stepName, updatedAt, notes }, message: "Candidate stage updated successfully" }`
- **Error Responses**: 404 (candidate/application not found), 400 (invalid interview step, validation errors)

### Architecture Layers Created
Following the project's DDD layered architecture:
1. **Domain**: `IApplicationRepository` interface defining data access contracts
2. **Infrastructure**: `ApplicationRepository` Prisma implementation + unit tests
3. **Application**: `CandidateStageService` with business logic + unit tests
4. **Presentation**: `candidateStageController` HTTP handler + unit tests
5. **Routes**: Update to `candidateRoutes.ts` to wire the new endpoint
6. **API Spec**: Update `api-spec.yaml` with OpenAPI documentation

### Validation Logic
- Verify candidate exists
- Verify application belongs to the specified candidate (prevent IDOR)
- Verify new interview step exists and belongs to the position's interview flow
- Validate request body fields (positive integers, optional notes max 500 chars)

## Capabilities

### New Capabilities
- `update-candidate-stage`: Update a candidate's interview stage for a specific application, with ownership validation and interview flow verification

### Modified Capabilities
- None — this is a pure addition with no changes to existing requirements

## Impact

### New Files
- `backend/src/domain/repositories/IApplicationRepository.ts`
- `backend/src/infrastructure/repositories/ApplicationRepository.ts`
- `backend/src/infrastructure/repositories/ApplicationRepository.test.ts`
- `backend/src/application/services/candidateStageService.ts`
- `backend/src/application/services/candidateStageService.test.ts`
- `backend/src/presentation/controllers/candidateStageController.ts`
- `backend/src/presentation/controllers/candidateStageController.test.ts`

### Modified Files
- `backend/src/routes/candidateRoutes.ts` — add PUT /:id/stage route
- `backend/src/application/validator.ts` — add `validateStageUpdateData()` function
- `backend/api-spec.yaml` — add endpoint documentation

### Non-goals (Legacy files NOT refactored)
- `backend/src/domain/models/*.ts` — existing domain models with direct Prisma access remain unchanged
- `backend/src/application/services/candidateService.ts` — legacy candidate service not modified
- `backend/src/presentation/controllers/candidateController.ts` — legacy controller not modified
- `backend/src/routes/candidateRoutes.ts` — existing POST / and GET /:id routes remain unchanged

### API Changes
- New endpoint: `PUT /candidates/:id/stage`
- Response envelope follows project standard: `{ success: boolean, data?: T, error?: { message, code } }`

### Dependencies
- Requires `PrismaClient` from existing infrastructure pattern (as used in PositionRepository)
- Uses existing `NotFoundError` from `backend/src/domain/errors/NotFoundError.ts`
- Uses existing validation patterns from `backend/src/application/validator.ts`
