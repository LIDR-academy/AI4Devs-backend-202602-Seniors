# Get Candidates by Position

## User Story

As a **recruiter**, I want to retrieve a list of all candidates currently in process for a given position, so that I can see at a glance who is applying, what interview stage each candidate is at, and how well they are performing on average.

---

## Acceptance Criteria

1. **Given** a valid `positionId`, **when** `GET /positions/:id/candidates` is called, **then** the response is `200 OK` with a `{ success: true, data: [...] }` envelope containing one entry per application for that position.
2. **Given** a `positionId` that does not exist in the database, **when** the endpoint is called, **then** a `404 Not Found` response is returned with `{ success: false, error: { message: "Position not found", code: "NOT_FOUND" } }`.
3. **Given** a `positionId` that exists but has no applications, **when** the endpoint is called, **then** a `200 OK` response is returned with `{ success: true, data: [] }`.
4. **Given** a non-numeric `:id` path parameter, **when** the endpoint is called, **then** a `400 Bad Request` response is returned with `{ success: false, error: { message: "Invalid position ID", code: "VALIDATION_ERROR" } }`.
5. **Given** a candidate with no completed interviews (no scores recorded), **when** the endpoint is called, **then** `averageScore` is `null` for that candidate entry.
6. Each entry in the response array must contain exactly: `candidateId`, `fullName`, `currentInterviewStep`, `averageScore`.

---

## Endpoint Specification

### Request

```
GET /positions/:id/candidates
```

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | The `Position.id` to query |

No request body.

### Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "candidateId": 1,
      "fullName": "Albert Saelices",
      "currentInterviewStep": 2,
      "averageScore": 7.5
    },
    {
      "candidateId": 3,
      "fullName": "Jane Doe",
      "currentInterviewStep": 1,
      "averageScore": null
    }
  ]
}
```

| Field | Type | Nullable | Source |
|---|---|---|---|
| `candidateId` | `number` | No | `Candidate.id` |
| `fullName` | `string` | No | `Candidate.firstName + " " + Candidate.lastName` |
| `currentInterviewStep` | `number` | No | `Application.currentInterviewStep` (FK → `InterviewStep.id`) |
| `averageScore` | `number \| null` | Yes | Arithmetic mean of all `Interview.score` for this application; `null` if no interviews with a score exist |

### Response — `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "message": "Invalid position ID",
    "code": "VALIDATION_ERROR"
  }
}
```

### Response — `404 Not Found`

```json
{
  "success": false,
  "error": {
    "message": "Position not found",
    "code": "NOT_FOUND"
  }
}
```

### Response — `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  }
}
```

---

## Data Model Reference

Relevant Prisma models (no schema changes required):

```
Position  (id)
  └── Application (positionId → Position.id, candidateId → Candidate.id, currentInterviewStep → InterviewStep.id)
        ├── Candidate (firstName, lastName)
        └── Interview[] (score: Int?)
```

The query must JOIN `Application → Candidate` and aggregate `Interview.score` per application.

---

## Files to Create / Modify

Follow the target layered architecture: **route → controller → service → repository interface → infrastructure repository**.

### New files

| File | Purpose |
|---|---|
| `backend/src/domain/repositories/IPositionRepository.ts` | Repository interface — `findByIdWithCandidates(id: number)` |
| `backend/src/infrastructure/repositories/PositionRepository.ts` | Prisma implementation of `IPositionRepository` |
| `backend/src/application/services/positionService.ts` | Business logic — validate id, call repository, compute `averageScore`, map to response DTO |
| `backend/src/presentation/controllers/positionController.ts` | HTTP handler — parse `:id`, call service, return envelope |
| `backend/src/routes/positionRoutes.ts` | Express router — `GET /:id/candidates` → `positionController` |
| `backend/src/domain/repositories/IPositionRepository.test.ts` | (stub/type check only — interface has no runtime logic) |
| `backend/src/infrastructure/repositories/PositionRepository.test.ts` | Unit tests for repository |
| `backend/src/application/services/positionService.test.ts` | Unit tests for service |
| `backend/src/presentation/controllers/positionController.test.ts` | Unit tests for controller |

### Modified files

| File | Change |
|---|---|
| `backend/src/routes/positionRoutes.ts` | **Create** and register under `/positions` |
| `backend/src/index.ts` | Add `app.use('/positions', positionRoutes)` — minimum viable change only |
| `backend/api-spec.yaml` | Add `GET /positions/{id}/candidates` path definition |

> **Do not refactor any existing files** beyond the minimum wiring change in `index.ts`.

---

## Implementation Notes

### Repository interface

```typescript
// src/domain/repositories/IPositionRepository.ts
export interface IPositionRepository {
  findByIdWithCandidates(id: number): Promise<PositionCandidateResult[] | null>;
}
```

`null` means the position does not exist; `[]` means it exists with no applications.

### Service — average score computation

```typescript
const averageScore = interviews.length > 0 && interviews.some(i => i.score !== null)
  ? interviews.reduce((sum, i) => sum + (i.score ?? 0), 0) / interviews.filter(i => i.score !== null).length
  : null;
```

Only interviews with a non-null `score` contribute to the average.

### Prisma query shape (inside infrastructure repository)

```typescript
prisma.application.findMany({
  where: { positionId: id },
  include: {
    candidate: { select: { id: true, firstName: true, lastName: true } },
    interviews: { select: { score: true } },
  },
});
```

Verify the position exists first with `prisma.position.findUnique({ where: { id } })`.

### Response DTO type

```typescript
export interface PositionCandidateDto {
  candidateId: number;
  fullName: string;
  currentInterviewStep: number;
  averageScore: number | null;
}
```

---

## Definition of Done

- [ ] `GET /positions/:id/candidates` returns `200` with correct data for a valid position with applications
- [ ] Returns `200` with `data: []` for a position with no applications
- [ ] Returns `404` when the position does not exist
- [ ] Returns `400` when `:id` is not a valid integer
- [ ] `averageScore` is `null` when no scored interviews exist
- [ ] `averageScore` is the mean of non-null interview scores only
- [ ] Response envelope matches `{ success, data }` / `{ success, error }` format
- [ ] `api-spec.yaml` updated with the new path
- [ ] All new files have co-located `.test.ts` files
- [ ] `npm test` passes with ≥ 90% coverage on new files
- [ ] No `any` types in new code
- [ ] No `console.log` in new code
- [ ] All code, comments, and error messages are in English

---

## Testing

### Units to test

| File | What to test |
|---|---|
| `positionService.ts` | (1) calls repository with correct id; (2) maps fields correctly; (3) computes `averageScore` for all-null scores → `null`; (4) computes `averageScore` correctly for mixed null/non-null scores; (5) throws `NotFoundError` when repository returns `null`; (6) returns empty array when repository returns `[]` |
| `positionController.ts` | (1) parses `:id` and calls service; (2) returns `400` for non-numeric id; (3) returns `404` when service throws `NotFoundError`; (4) calls `next(error)` on unexpected errors |
| `PositionRepository.ts` | (1) passes correct `where` and `include` to Prisma; (2) returns `null` when position not found; (3) returns mapped array when position has applications |

### Mocking strategy

- **Service tests**: mock `IPositionRepository` via `jest.fn()` — inject mock in constructor.
- **Controller tests**: mock `positionService` module using `jest.mock(...)`.
- **Repository tests**: mock `PrismaClient` by passing a mock prisma instance in the constructor (constructor injection — do **not** use `new PrismaClient()` at module level).
- **Never** hit the real database in unit tests.

### AAA pattern example (service)

```typescript
it('returns null averageScore when no interviews have a score', async () => {
  // Arrange
  const mockRepo = { findByIdWithCandidates: jest.fn().mockResolvedValue([
    { candidateId: 1, firstName: 'John', lastName: 'Doe', currentInterviewStep: 1, interviews: [] }
  ]) };
  const target = new PositionService(mockRepo);

  // Act
  const result = await target.getCandidatesByPosition(1);

  // Assert
  expect(result[0].averageScore).toBeNull();
});
```

---

## Non-Functional Requirements

### Input Validation

- `:id` must be a positive integer. Reject with `400` if `isNaN(parseInt(id))` or `parseInt(id) <= 0`.
- No request body to validate.

### Error Handling

- Use custom error class `NotFoundError` (to be created in `src/domain/errors/NotFoundError.ts` if not yet present).
- Controllers must call `next(error)` — never `res.status(500)` inline.
- The global error middleware in `src/index.ts` must handle `NotFoundError` → 404 and unknown errors → 500.

### Performance

- The Prisma query uses a single JOIN (`include`) rather than N+1 queries — no additional optimization needed at this scale.
- No pagination required for this story (positions are expected to have a bounded number of active candidates).

### Security

- No authentication is in scope for this story (consistent with the rest of the current API).
- The `:id` path parameter must be validated to prevent injection via crafted input (integer parsing is sufficient for Prisma).
