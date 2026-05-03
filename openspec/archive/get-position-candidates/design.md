---
status: in-progress
date: 2026-05-03
---

# Design: Get Candidates in Process for a Position

## API Endpoint

```
GET /api/v1/positions/:id/candidates
```

### Path Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `id` | integer | yes | Position ID |

### Success Response (200)

```json
[
  {
    "candidateId": 1,
    "fullName": "Alice Smith",
    "currentInterviewStep": "Phone Screen",
    "averageScore": 8.5
  },
  {
    "candidateId": 2,
    "fullName": "Bob Jones",
    "currentInterviewStep": "Technical Interview",
    "averageScore": null
  }
]
```

Returns an empty array `[]` when no candidates are in process for the position.

### Error Responses

| Status | Body | Trigger |
|---|---|---|
| 400 | `{ "error": "INVALID_ID", "message": "Position ID must be a positive integer" }` | Non-numeric `:id` |
| 500 | `{ "error": "INTERNAL_ERROR", "message": "Internal server error" }` | Unexpected failure |

## Database Query

Reads: `application` JOIN `candidate` JOIN `interviewStep` + `interview` (for AVG score).

```sql
-- Conceptual SQL (Prisma handles this)
SELECT
  a.candidateId,
  c.firstName, c.lastName,
  s.name AS currentInterviewStep,
  AVG(i.score) AS averageScore
FROM Application a
JOIN Candidate c ON c.id = a.candidateId
JOIN InterviewStep s ON s.id = a.currentInterviewStep
LEFT JOIN Interview i ON i.applicationId = a.id
WHERE a.positionId = :id
GROUP BY a.id, c.id, s.id
```

AVG is computed in application code after fetching.

## Implementation Steps

1. Create `prismaClient.ts` singleton in `infrastructure/database/`.
2. Create `PositionRepository.ts` with `getCandidatesInProcess(positionId: number)` method.
3. Create `GetPositionCandidatesUseCase.ts` that delegates to the repository.
4. Create `positionController.ts` that validates `:id` and calls the use-case.
5. Create `positionRoutes.ts` with `GET /:id/candidates` route.
6. Register route in `index.ts` under `/api/v1/positions`.

## Test Cases

### TC-01: Returns candidates for a valid position
- **Given**: Position with id=1 exists and has 2 active applications with candidates and scored interviews
- **When**: `GET /api/v1/positions/1/candidates`
- **Then**: Response 200, body is an array of 2 objects each with `candidateId`, `fullName`, `currentInterviewStep`, `averageScore`

### TC-02: Returns empty array when position has no candidates
- **Given**: Position with id=99 exists but has no applications
- **When**: `GET /api/v1/positions/99/candidates`
- **Then**: Response 200, body is `[]`

### TC-03: Returns null averageScore when no scored interviews exist
- **Given**: Position with id=1 has an application but the candidate's interviews have `score: null`
- **When**: `GET /api/v1/positions/1/candidates`
- **Then**: Response 200, `averageScore` field is `null`

### TC-04: Returns 400 for non-numeric position ID
- **Given**: No precondition
- **When**: `GET /api/v1/positions/abc/candidates`
- **Then**: Response 400 with `error: "INVALID_ID"`
