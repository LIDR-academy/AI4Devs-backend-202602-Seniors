---
status: in-progress
date: 2026-05-03
---

# Design: Update Candidate Interview Stage

## API Endpoint

```
PUT /api/v1/candidates/:id/stage
```

### Path Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `id` | integer | yes | Candidate ID |

### Request Body

```json
{ "interviewStepId": 3 }
```

### Success Response (200)

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

### Error Responses

| Status | Error code | Trigger |
|---|---|---|
| 400 | `INVALID_ID` | Non-numeric `:id` |
| 400 | `INVALID_STEP` | `interviewStepId` does not exist in DB |
| 400 | `MISSING_FIELD` | `interviewStepId` missing from body |
| 404 | `CANDIDATE_NOT_FOUND` | No candidate with the given id |
| 404 | `APPLICATION_NOT_FOUND` | Candidate exists but has no application |

## Database Operations

1. `SELECT` from `InterviewStep` WHERE `id = interviewStepId` (validate step exists)
2. `SELECT` from `Application` WHERE `candidateId = :id` ORDER BY `applicationDate DESC` LIMIT 1
3. `UPDATE Application SET currentInterviewStep = interviewStepId WHERE id = <found id>`

No transaction needed (single row update on step 3).

## Result/Either Type

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

Use-case returns `Result<UpdatedApplication, StageUpdateError>`.  
Controller maps `ok: false` to appropriate HTTP status codes.

## Implementation Steps

1. Create `backend/src/domain/errors/StageUpdateError.ts` (enum + error class).
2. Create `backend/src/infrastructure/repositories/ApplicationRepository.ts`.
3. Create `backend/src/application/use-cases/UpdateCandidateStageUseCase.ts`.
4. Create `backend/src/presentation/controllers/applicationController.ts`.
5. Create `backend/src/routes/applicationRoutes.ts`.
6. Register route in `backend/src/index.ts`.

## Test Cases

### TC-01: Successfully updates the interview stage
- **Given**: Candidate with id=1 exists and has an application; interviewStepId=2 exists
- **When**: `PUT /api/v1/candidates/1/stage` with body `{ "interviewStepId": 2 }`
- **Then**: Response 200 with updated application object containing `currentInterviewStep: 2`

### TC-02: Returns 404 when candidate not found
- **Given**: No candidate with id=999
- **When**: `PUT /api/v1/candidates/999/stage` with body `{ "interviewStepId": 2 }`
- **Then**: Response 404, `error: "CANDIDATE_NOT_FOUND"`

### TC-03: Returns 404 when candidate has no application
- **Given**: Candidate with id=2 exists but has no applications
- **When**: `PUT /api/v1/candidates/2/stage` with body `{ "interviewStepId": 2 }`
- **Then**: Response 404, `error: "APPLICATION_NOT_FOUND"`

### TC-04: Returns 400 when interviewStepId does not exist
- **Given**: Candidate with id=1 has an application; no interviewStep with id=999
- **When**: `PUT /api/v1/candidates/1/stage` with body `{ "interviewStepId": 999 }`
- **Then**: Response 400, `error: "INVALID_STEP"`

### TC-05: Returns 400 for non-numeric candidate ID
- **Given**: No precondition
- **When**: `PUT /api/v1/candidates/abc/stage`
- **Then**: Response 400, `error: "INVALID_ID"`
