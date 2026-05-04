# Kanban Candidate Endpoints — Design Spec

**Date:** 2026-05-04  
**Status:** Approved  

## Context

The LTI recruitment platform needs two REST endpoints to power a kanban-style candidate pipeline view per position. A kanban card represents a single `Application` record — one candidate applying to one position.

## Endpoints

### 1. GET /positions/:id/candidates

Returns all candidates currently in the pipeline for a given position.

**Path param:** `:id` — Position ID (must be a positive integer)

**Response 200:**
```json
[
  {
    "candidateId": 1,
    "fullName": "Jane Doe",
    "currentInterviewStep": {
      "id": 3,
      "name": "Technical Interview"
    },
    "averageScore": 7.5
  }
]
```

- `fullName` — `candidate.firstName + " " + candidate.lastName`
- `currentInterviewStep` — the InterviewStep the application is currently at (`id` + `name`)
- `averageScore` — mean of all non-null `Interview.score` values for the application; `null` if no scored interviews exist; rounded to 2 decimal places

Returns `[]` (empty array) when the position exists but has no applications.

**Errors:**
- `400` — `:id` is not a valid integer
- `404` — position does not exist
- `500` — unexpected server error

### 2. PUT /candidates/:id/stage

Updates the current interview step of a specific application (kanban card move).

**Path param:** `:id` — Application ID (must be a positive integer)

**Request body:**
```json
{ "currentInterviewStep": 4 }
```

**Response 200:**
```json
{
  "id": 7,
  "candidateId": 1,
  "positionId": 2,
  "currentInterviewStep": 4
}
```

**Errors:**
- `400` — `:id` is not a valid integer, or `currentInterviewStep` is missing / not a positive integer
- `404` — application not found, or target InterviewStep does not exist
- `500` — unexpected server error

## Architecture

Follows the existing layered pattern: routes → controller → service → Prisma.

### New files
| File | Purpose |
|------|---------|
| `src/routes/positionRoutes.ts` | Register GET /positions/:id/candidates |
| `src/presentation/controllers/positionController.ts` | HTTP handler for position endpoints |
| `src/application/services/positionService.ts` | Business logic for position queries |

### Modified files
| File | Change |
|------|--------|
| `src/routes/candidateRoutes.ts` | Add PUT /candidates/:id/stage route |
| `src/presentation/controllers/candidateController.ts` | Add `updateCandidateStage` handler |
| `src/application/services/candidateService.ts` | Add `updateCandidateStage` service function |
| `src/index.ts` | Register `/positions` route |

## Data Flow

### GET /positions/:id/candidates (positionService)
1. Validate `:id` is a positive integer → `400` if not
2. Check position exists → `404` if not
3. Single Prisma query: `application.findMany({ where: { positionId }, include: { candidate, interviewStep, interviews: { select: { score } } } })`
4. For each application: compute `averageScore` from non-null scores (null if none)
5. Map to response shape and return

### PUT /candidates/:id/stage (candidateService)
1. Validate `:id` is a positive integer → `400` if not
2. Validate `currentInterviewStep` is present and a positive integer → `400` if not
3. Verify InterviewStep exists → `404` if not
4. Call `prisma.application.update` — catch Prisma `P2025` and map to `404`
5. Return updated record

## Testing (TDD)

Implementation follows a strict Red → Green → Refactor cycle. Each service function and controller is tested before its implementation code is written.

**Test framework:** Jest (configured in `backend/jest.config.js`)  
**Prisma:** mocked in all unit tests — no real database calls.

### Test cases — GET /positions/:id/candidates
- Returns mapped candidate list for a valid position with applications
- Returns `[]` for a valid position with no applications
- Returns `404` when the position does not exist
- Returns `400` when `:id` is not a valid integer
- Computes `averageScore` correctly (non-null scores only; `null` when none)

### Test cases — PUT /candidates/:id/stage
- Returns updated application for valid id and body
- Returns `404` when the application does not exist
- Returns `404` when the target InterviewStep does not exist
- Returns `400` when `:id` is not a valid integer
- Returns `400` when `currentInterviewStep` is missing or not a positive integer

## Out of Scope
- Authentication / authorization
- Pagination for the candidates list
- Filtering by interview step
