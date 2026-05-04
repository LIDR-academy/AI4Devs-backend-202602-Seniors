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

## Prompt 2 — Añadir TDD al plan

```
Update the implementation plan to use TDD (Test-Driven Development) for both endpoints. Use the superpowers test-driven-development skill to guide the approach.

For each service function and controller, the cycle must be:
1. Write a failing test that specifies the expected behaviour
2. Write the minimum code to make the test pass
3. Refactor if needed, keeping tests green

## Testing constraints
- Use Jest (already configured in backend/jest.config.js)
- Mock PrismaClient in unit tests — never hit a real database
- Cover the following cases per endpoint:

### GET /positions/:id/candidates
- Returns mapped candidate list for a valid position with applications
- Returns [] for a valid position with no applications
- Returns 404 when the position does not exist
- Returns 400 when :id is not a valid integer
- Computes averageScore correctly (non-null scores only, null when none)

### PUT /candidates/:id/stage
- Returns updated application for valid id and body
- Returns 404 when the application does not exist
- Returns 404 when the target InterviewStep does not exist
- Returns 400 when :id is not a valid integer
- Returns 400 when currentInterviewStep is missing or not a positive integer

Update the plan so that each implementation step is preceded by its corresponding test step.
```

## Prompt 3 — Ejecutar el plan con agentes paralelos

```
Execute the implementation plan at docs/superpowers/plans/2026-05-04-kanban-endpoints.md using the superpowers subagent-driven-development skill. Dispatch one subagent per task, run spec compliance and code quality reviews after each task, and fix any issues before moving to the next task.
```

## Prompt 4 — Actualizar la documentación con los nuevos endpoints

```
Update the existing documentation in the repository to reflect the two new endpoints added in this branch.

Files to update:

### backend/api-spec.yaml
Add two new path entries to the OpenAPI 3.0 spec:

1. GET /positions/{id}/candidates
   - Summary: Get candidates in pipeline for a position
   - Path param: id (integer, required) — Position ID
   - Response 200: array of objects with candidateId (integer), fullName (string),
     currentInterviewStep (object with id: integer and name: string),
     averageScore (number, nullable)
   - Response 400: invalid position ID
   - Response 404: position not found
   - Response 500: internal server error

2. PUT /candidates/{id}/stage
   - Summary: Update the interview stage of a candidate application
   - Path param: id (integer, required) — Application ID
   - Request body: { currentInterviewStep: integer } (required)
   - Response 200: object with id, candidateId, positionId, currentInterviewStep (all integers)
   - Response 400: invalid application ID or invalid currentInterviewStep
   - Response 404: application not found or interview step not found
   - Response 500: internal server error

Also add the missing GET /candidates/{id} entry that exists in the code but is absent from the spec.

### README.md
Add an "API Endpoints" section (in both EN and ES) listing all available endpoints with a brief description and example for the two new ones.
```
