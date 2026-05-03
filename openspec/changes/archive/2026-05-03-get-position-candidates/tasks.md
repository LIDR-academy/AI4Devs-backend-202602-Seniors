## 1. API Contract

- [x] 1.1 Update `backend/api-spec.yaml` with the new endpoint contract: add `GET /positions/{id}/candidates` with request parameter, `200`/`400`/`404`/`500` response schemas using the standard envelope shape (success responses include `success`, `data`, and `message` fields)

## 2. Domain Layer

- [x] 2.1 Create `backend/src/domain/errors/NotFoundError.ts` — custom error class extending `Error` with `name = "NotFoundError"`
- [x] 2.2 Create `backend/src/domain/repositories/IPositionRepository.ts` — define `ApplicationWithCandidate` interface and `IPositionRepository` interface with `existsById` and `findCandidatesByPositionId` methods

## 3. Infrastructure Layer

- [x] 3.1 Create `backend/src/infrastructure/repositories/PositionRepository.ts` — implement `IPositionRepository` using constructor-injected `PrismaClient`; `existsById` queries `position.findUnique`; `findCandidatesByPositionId` queries `application.findMany` with `include` for `candidate` and `interviews`
- [x] 3.2 Create `backend/src/infrastructure/repositories/PositionRepository.test.ts` — unit tests: mock PrismaClient via constructor injection; test `existsById` returns `true`/`false`; test `findCandidatesByPositionId` maps Prisma result correctly; test it passes correct `where` and `include` clauses to Prisma

## 4. Application Layer

- [x] 4.1 Create `backend/src/application/services/positionService.ts` — `PositionService` class with constructor-injected `IPositionRepository`; `getCandidatesByPosition(id: number): Promise<PositionCandidateDto[]>` that checks position existence (throws `NotFoundError` if absent), fetches applications, computes `averageScore` from non-null interview scores, maps to `PositionCandidateDto`
- [x] 4.2 Create `backend/src/application/services/positionService.test.ts` — unit tests: mock `IPositionRepository` with `jest.fn()`; test `NotFoundError` thrown when position not found; test empty array returned for position with no applications; test `averageScore` is `null` when no interviews exist; test `averageScore` is `null` when all scores are null; test `averageScore` computed correctly for mixed null/non-null scores; test `fullName` composition

## 5. Presentation Layer

- [x] 5.1 Create `backend/src/presentation/controllers/positionController.ts` — `getPositionCandidates` handler: parse `:id` as integer, return `400` for invalid/non-positive ids, call `PositionService`, return `{ success: true, data }` on success, pass errors to `next(error)`
- [x] 5.2 Create `backend/src/presentation/controllers/positionController.test.ts` — unit tests: mock `positionService`; test `400` for non-numeric id; test `400` for `id <= 0`; test `404` when service throws `NotFoundError`; test `200` with correct envelope on success; test `next(error)` called on unexpected errors

## 6. Routes

- [x] 6.1 Create `backend/src/routes/positionRoutes.ts` — Express `Router`, register `GET /:id/candidates` → `positionController.getPositionCandidates`; instantiate `PositionRepository` and `PositionService` here with a new `PrismaClient` instance

## 7. Error Middleware Wiring

- [x] 7.1 Update global error middleware in `backend/src/index.ts` — add `instanceof NotFoundError` check that returns `404` with the standard error envelope before the generic `500` fallback (minimum viable change only)

## 8. App Entry Point

- [x] 8.1 Add `app.use('/positions', positionRoutes)` to `backend/src/index.ts` and import `positionRoutes` — minimum viable wiring only, no other changes

## 9. Test Infrastructure

- [x] 9.1 Update `backend/jest.config.js` to add `coverageThreshold: { global: { branches: 90, functions: 90, lines: 90, statements: 90 } }` (first test suite in the project — must be added now)
- [x] 9.2 Add `"test:coverage": "jest --coverage"` script to `backend/package.json`

## 10. Verification

- [x] 10.1 Run `npm test` in `backend/` and verify all new `.test.ts` files pass
- [x] 10.2 Run `npm run test:coverage` and verify ≥ 90% coverage on all new files
- [x] 10.3 Manually test `GET /positions/:id/candidates` with a valid id, an id with no applications, a non-existent id, and a non-numeric id to confirm correct responses
