# Prompts Iniciales

## Prompt 1 — Plan de implementación con superpowers

```
Use the superpowers writing-plans skill to create a detailed implementation plan for two new REST API endpoints in the existing TypeScript + Express + Prisma backend (backend/ folder).

## Endpoints to implement

### GET /positions/:id/candidates
- Returns all applications for a given position (positionId = :id)
- Response per candidate:
  - fullName: candidate.firstName + " " + candidate.lastName
  - currentInterviewStep: { id, name } from the related InterviewStep record
  - averageScore: mean of non-null Interview.score values for the application; null if no scored interviews
- Returns [] (empty array) if position has no applications
- Errors: 400 (invalid id), 404 (position not found), 500

### PUT /candidates/:id/stage  (:id = Application ID)
- Body: { currentInterviewStep: <interviewStepId> }
- Updates the currentInterviewStep field on the Application record
- Validates that the target InterviewStep exists before updating
- Returns the updated application object
- Errors: 400 (invalid id or body), 404 (application or step not found), 500

## Architecture constraints
- Follow the existing layered pattern: routes → controller → service → Prisma
- New files: positionRoutes.ts, positionController.ts, positionService.ts
- Modified files: candidateRoutes.ts, candidateController.ts, candidateService.ts, index.ts
- Register /positions in index.ts alongside the existing /candidates route
- Use a single Prisma query with include (no N+1) for the GET endpoint
- No authentication, pagination, or filtering required
```
