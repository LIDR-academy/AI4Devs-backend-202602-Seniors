---
status: in-progress
date: 2026-05-03
---

# Tasks: Update Candidate Interview Stage

## Effort estimate: 4 hours

| # | Task | Owner | Effort | Depends on | Done |
|---|---|---|---|---|---|
| T1 | Create `backend/src/domain/errors/StageUpdateError.ts` | fullstack-developer | 15 min | — | [x] |
| T2 | Create `backend/src/infrastructure/repositories/ApplicationRepository.ts` | sql-developer | 1 h | T1 | [x] |
| T3 | Create `backend/src/application/use-cases/UpdateCandidateStageUseCase.ts` | fullstack-developer | 45 min | T2 | [x] |
| T4 | Create `backend/src/presentation/controllers/applicationController.ts` | fullstack-developer | 30 min | T3 | [x] |
| T5 | Create `backend/src/routes/applicationRoutes.ts` | fullstack-developer | 15 min | T4 | [x] |
| T6 | Register route in `backend/src/index.ts` | fullstack-developer | 10 min | T5 | [x] |
| T7 | Write test cases in design.md (TC-01 to TC-05) | tester | 30 min | proposal | [x] |
| T8 | Implement `backend/src/tests/updateCandidateStage.test.ts` | tester | 1 h | T3, T4 | [x] |
| T9 | Run `npm test` and confirm green | tester | 15 min | T8 | [x] |
