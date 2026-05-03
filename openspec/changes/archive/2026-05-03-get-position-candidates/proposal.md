## Why

Recruiters currently have no way to query the API for all candidates in process for a given position. Without this endpoint, consuming clients must fetch every application individually, making it impossible to render a position kanban or pipeline view efficiently.

## What Changes

- New `GET /positions/:id/candidates` endpoint that returns all applications for a position, enriched with candidate name and average interview score.
- `backend/api-spec.yaml` updated with the new path definition.
- Five new source files introduced across the full target architecture stack (repository interface, infrastructure repository, service, controller, route).
- `src/index.ts` receives a single line to mount the new router — no other legacy file is touched.

## Capabilities

### New Capabilities

- `position-candidates`: Retrieve a ranked list of candidate applications for a specific position, including full name, current interview step, and average interview score.

### Modified Capabilities

_(none — no existing spec-level requirements are changing)_

## Impact

- **API**: New route `GET /positions/:id/candidates` exposed on port 3010.
- **New files**: `src/domain/repositories/IPositionRepository.ts`, `src/infrastructure/repositories/PositionRepository.ts`, `src/application/services/positionService.ts`, `src/presentation/controllers/positionController.ts`, `src/routes/positionRoutes.ts` (plus co-located `.test.ts` files).
- **Modified files**: `backend/api-spec.yaml` (contract), `src/index.ts` (one-line route mount).
- **Database**: No schema changes; query uses existing `Application`, `Candidate`, and `Interview` tables via Prisma `include`.
- **Dependencies**: No new npm packages required.

## Non-goals

The following legacy files will **not** be refactored as part of this change:

- `src/domain/models/` — existing model classes retain their `PrismaClient` singletons.
- `src/routes/candidateRoutes.ts` — inline handler pattern is not fixed here.
- `src/application/services/candidateService.ts` — no changes.
- `src/presentation/controllers/candidateController.ts` — no changes.
- `src/index.ts` — only the minimum wiring line (`app.use('/positions', positionRoutes)`) is added.
