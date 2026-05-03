---
status: proposed
date: 2026-05-03
---

# Proposal: Update Candidate Interview Stage

## Problem Statement

Recruiters need a way to advance or change a candidate's current interview step within an active application. Currently no endpoint exists to update `application.currentInterviewStep`, meaning stage changes require direct DB manipulation.

## Scope

- **Endpoint**: `PUT /api/v1/candidates/:id/stage`
- **New files**:
  - `backend/src/infrastructure/repositories/ApplicationRepository.ts`
  - `backend/src/application/use-cases/UpdateCandidateStageUseCase.ts`
  - `backend/src/domain/errors/StageUpdateError.ts`
  - `backend/src/presentation/controllers/applicationController.ts`
  - `backend/src/routes/applicationRoutes.ts`
  - `backend/src/tests/updateCandidateStage.test.ts`
- **DB changes**: None (update to existing `application.currentInterviewStep` column)
- **Modified files**: `backend/src/index.ts` (route registration)

## Pattern Choice

Repository + Result/Either — the update operation has three distinct typed failure modes (candidate not found, no application, invalid step) that map cleanly to a `Result<T, StageUpdateError>` type; exceptions would lose type information at the call site.

## Request / Response

**Request**
```http
PUT /api/v1/candidates/:id/stage
Content-Type: application/json

{ "interviewStepId": 3 }
```

**Response (200 OK)**
```json
{
  "id": 1,
  "candidateId": 1,
  "positionId": 2,
  "currentInterviewStep": 3,
  "applicationDate": "2024-05-28T00:00:00.000Z",
  "notes": null
}
```

## Error Responses

| Error code | HTTP | Trigger |
|---|---|---|
| `CANDIDATE_NOT_FOUND` | 404 | No candidate with given id |
| `APPLICATION_NOT_FOUND` | 404 | Candidate has no application |
| `INVALID_STEP` | 400 | interviewStepId does not exist |

## Benefits and Trade-offs

- **Benefit**: Type-safe error handling; each error maps to a specific HTTP status.
- **Trade-off**: Result type adds a thin wrapper; callers must check `.ok` before using `.value`.

## Timeline

Low effort — 1 day (single table update, no schema changes).
