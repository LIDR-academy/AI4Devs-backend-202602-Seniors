## 1. API Contract & Documentation

- [x] 1.1 Update `backend/api-spec.yaml` with the new `PUT /candidates/{id}/stage` endpoint, including request/response schemas and error codes

## 2. Domain Layer

- [x] 2.1 Create `backend/src/domain/repositories/IApplicationRepository.ts` interface with methods: `findByIdAndCandidateId`, `updateInterviewStep`, `isValidInterviewStepForPosition`, `getInterviewStepName`

## 3. Infrastructure Layer

- [x] 3.1 Create `backend/src/infrastructure/repositories/ApplicationRepository.ts` implementing `IApplicationRepository` with PrismaClient constructor injection
- [x] 3.2 Create `backend/src/infrastructure/repositories/ApplicationRepository.test.ts` with unit tests for all repository methods (mock PrismaClient, 90%+ coverage)

## 4. Application Layer - Validation

- [x] 4.1 Add `validateStageUpdateData()` function to `backend/src/application/validator.ts` for validating `applicationId`, `newInterviewStep`, and optional `notes`

## 5. Application Layer - Service

- [x] 5.1 Create `backend/src/application/services/candidateStageService.ts` with `CandidateStageService` class containing `updateCandidateStage` method with business logic
- [x] 5.2 Create `backend/src/application/services/candidateStageService.test.ts` with unit tests for service methods (mock repositories, test all validation scenarios, 90%+ coverage)

## 6. Presentation Layer - Controller

- [x] 6.1 Create `backend/src/presentation/controllers/candidateStageController.ts` with `makeUpdateCandidateStage` factory function and HTTP request handler
- [x] 6.2 Create `backend/src/presentation/controllers/candidateStageController.test.ts` with unit tests for controller (mock service, test HTTP responses, 90%+ coverage)

## 7. Routes Layer

- [x] 7.1 Update `backend/src/routes/candidateRoutes.ts` to add `PUT /:id/stage` route with proper dependency injection (PrismaClient → Repository → Service → Controller)

## 8. Verification

- [x] 8.1 Run `npm test` in `backend/` directory and verify all tests pass
- [x] 8.2 Verify test coverage meets 90% threshold for branches, functions, lines, and statements
- [x] 8.3 Verify endpoint responds correctly to test requests (200 success, 404/400 errors as specified)
