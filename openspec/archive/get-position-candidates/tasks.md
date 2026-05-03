---
status: in-progress
date: 2026-05-03
---

# Tasks: Get Candidates in Process for a Position

## Effort estimate: 4 hours

| # | Task | Owner | Effort | Depends on | Done |
|---|---|---|---|---|---|
| T1 | Create `backend/src/infrastructure/database/prismaClient.ts` | sql-developer | 15 min | — | [x] |
| T2 | Create `backend/src/infrastructure/repositories/PositionRepository.ts` | sql-developer | 1 h | T1 | [x] |
| T3 | Create `backend/src/application/use-cases/GetPositionCandidatesUseCase.ts` | fullstack-developer | 30 min | T2 | [x] |
| T4 | Create `backend/src/presentation/controllers/positionController.ts` | fullstack-developer | 30 min | T3 | [x] |
| T5 | Create `backend/src/routes/positionRoutes.ts` | fullstack-developer | 15 min | T4 | [x] |
| T6 | Register route in `backend/src/index.ts` | fullstack-developer | 10 min | T5 | [x] |
| T7 | Write test cases in design.md (TC-01 to TC-04) | tester | 30 min | proposal | [x] |
| T8 | Implement `backend/src/tests/getPositionCandidates.test.ts` | tester | 1 h | T3, T4 | [x] |
| T9 | Run `npm test` and confirm green | tester | 15 min | T8 | [x] |
