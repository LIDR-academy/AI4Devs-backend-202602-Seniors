---
status: proposed
date: 2026-05-03
---

# Proposal: Get Candidates in Process for a Position

## Problem Statement

Recruiters need a single endpoint that returns all candidates currently progressing through the interview pipeline for a given job position. Currently, no endpoint exposes per-position candidate data with interview progress and scoring information, forcing consumers to chain multiple requests.

## Scope

- **Endpoint**: `GET /api/v1/positions/:id/candidates`
- **New files**:
  - `backend/src/infrastructure/repositories/PositionRepository.ts`
  - `backend/src/application/use-cases/GetPositionCandidatesUseCase.ts`
  - `backend/src/presentation/controllers/positionController.ts`
  - `backend/src/routes/positionRoutes.ts`
  - `backend/src/tests/getPositionCandidates.test.ts`
- **DB changes**: None (read-only query across Application, Candidate, InterviewStep, Interview)
- **Modified files**: `backend/src/index.ts` (route registration)

## Pattern Choice

Repository + CQRS read model — read-only aggregation across three tables does not justify hydrating a domain aggregate; a dedicated query object returns a flat DTO directly.

## Response Shape

```json
[
  {
    "candidateId": 1,
    "fullName": "Alice Smith",
    "currentInterviewStep": "Phone Screen",
    "averageScore": 8.5
  }
]
```

- `averageScore` is `null` when no scored interviews exist for the application.

## Benefits and Trade-offs

- **Benefit**: Single network call for the recruiter dashboard candidate list.
- **Benefit**: AVG is computed server-side, reducing client complexity.
- **Trade-off**: Slightly denormalized DTO couples the read path to the recruiter view.

## Timeline

Low effort — 1 day (no schema changes, straightforward Prisma query).
