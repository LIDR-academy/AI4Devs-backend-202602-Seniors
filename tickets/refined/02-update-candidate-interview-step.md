# 02 - Update candidate interview step

## [original]

As a recruiter
I want to be able to update the candidate's interview step
So that I can see the real status of the selection process

### Description

In this ticket we want to implement the following endpoint: PUT /candidates/:id/stage
This endpoint will update the candidate stage to the value passed:

Request
```json
{
  "positionId": 5,
  "interviewStepId": 5
}
```

Response
```json
{
  "message": "Application updated successfully",
  "data": application_data
}
```

### Acceptance criteria

Given a candidate
When calling the endpoint with valid positionId and stage
Then the interview step for the application is updated to reflect the new stage

## [enhanced]

### Story quality assessment

Status: Not implementation-ready yet.

The original story has clear intent but lacks technical detail required for autonomous delivery:
- Missing input validation and error contract.
- Missing data integrity rules between Position, InterviewFlow, and InterviewStep.
- Missing exact file-level implementation scope.
- Missing testing and documentation update requirements.
- Missing non-functional requirements.

### User story

As a recruiter,
I want to update the interview step of a candidate for a specific position,
so that the application reflects the real progress in the selection process.

### Functional scope

Implement one endpoint:
- Method: PUT
- URL: /candidates/:id/stage
- Purpose: update Application.currentInterviewStep for one candidate in one position.

### API contract

#### Request

Path params:
- id (required, integer > 0): Candidate ID.

Body:
```json
{
  "positionId": 5,
  "interviewStepId": 5
}
```

Body field rules:
- positionId: required, integer > 0.
- interviewStepId: required, integer > 0.

#### Response 200

```json
{
  "message": "Application updated successfully",
  "data": {
    "id": 12,
    "candidateId": 3,
    "positionId": 5,
    "currentInterviewStep": 5,
    "applicationDate": "2026-04-29T10:00:00.000Z",
    "notes": null
  }
}
```

#### Error responses

- 400 Bad Request:
  - Invalid candidate id format.
  - Missing/invalid positionId or interviewStepId.
- 404 Not Found:
  - Candidate does not exist.
  - Position does not exist.
  - InterviewStep does not exist.
  - Application for candidate + position does not exist.
- 409 Conflict:
  - InterviewStep belongs to a different InterviewFlow than the Position interview flow.
- 500 Internal Server Error:
  - Unexpected persistence/runtime error.

### Data and business rules

1. The target record to update is Application where:
- candidateId = :id
- positionId = body.positionId

2. Integrity validation must be enforced before update:
- Position must exist.
- InterviewStep must exist.
- Candidate must exist.
- Application(candidateId, positionId) must exist.
- interviewStep.interviewFlowId must equal position.interviewFlowId.

3. Update behavior:
- Set Application.currentInterviewStep = interviewStepId.
- Return updated application object in data.

4. Idempotency:
- If the application already has currentInterviewStep = interviewStepId, return 200 with the unchanged record.

### Technical design and files to modify

Follow current backend architecture (route -> controller -> service -> domain model):

1. Update backend/src/routes/candidateRoutes.ts
- Add PUT /:id/stage route.
- Delegate to candidate controller.

2. Update backend/src/presentation/controllers/candidateController.ts
- Add updateCandidateInterviewStep controller.
- Validate path/body primitive format.
- Map service errors to 400/404/409/500.

3. Update backend/src/application/services/candidateService.ts
- Add updateCandidateInterviewStep(candidateId, positionId, interviewStepId).
- Implement business and integrity validations.
- Call domain methods to persist.

4. Update backend/src/domain/models/Application.ts
- Add static finder for candidateId + positionId.
- Add update helper for currentInterviewStep.

5. Reuse existing domain lookups:
- backend/src/domain/models/Candidate.ts (findOne)
- backend/src/domain/models/Position.ts (findOne)
- backend/src/domain/models/InterviewStep.ts (findOne)

6. Update backend/api-spec.yaml
- Add PUT /candidates/{id}/stage with request/response/error schemas.

7. Update backend/docs/endpoints-catalog.md
- Add endpoint row for PUT /candidates/:id/stage.

### Definition of done

Implementation is complete when all conditions are met:
- Endpoint PUT /candidates/:id/stage is reachable.
- Valid request updates Application.currentInterviewStep.
- 400/404/409/500 behavior matches contract.
- InterviewFlow consistency rule is enforced.
- OpenAPI and docs are updated and aligned.
- Automated tests are added and passing.

### Test requirements

1. Service tests:
- File: backend/src/application/services/__tests__/candidateService.test.ts
- Cases:
  - Updates stage successfully.
  - Returns 400 for invalid ids.
  - Returns 404 when candidate/position/interviewStep/application not found.
  - Returns 409 when interviewStep does not belong to position flow.
  - Returns 200/idempotent result when stage is unchanged.

2. Route/controller integration tests:
- File: backend/src/routes/__tests__/candidateRoutes.test.ts
- Cases:
  - 200 success response shape.
  - 400 invalid path/body.
  - 404 missing resources/application.
  - 409 flow mismatch.
  - 500 unexpected failure fallback.

### Acceptance criteria (final)

1. Given a candidate with an existing application for a position
When calling PUT /candidates/:id/stage with valid positionId and interviewStepId from the same interview flow
Then the application currentInterviewStep is updated and returned with 200.

2. Given a valid request where the application already has the provided interviewStepId
When calling PUT /candidates/:id/stage
Then the endpoint returns 200 and the same persisted value.

3. Given invalid candidate id, positionId, or interviewStepId
When calling PUT /candidates/:id/stage
Then the endpoint returns 400.

4. Given a missing candidate, position, interviewStep, or application(candidate + position)
When calling PUT /candidates/:id/stage
Then the endpoint returns 404.

5. Given an interviewStep that belongs to a different interview flow than the position
When calling PUT /candidates/:id/stage
Then the endpoint returns 409 and does not update the application.

### Non-functional requirements

- Security:
  - Do not expose stack traces or internal SQL/Prisma details in response bodies.
- Consistency:
  - Enforce interview flow compatibility to prevent invalid pipeline states.
- Performance:
  - Avoid N+1 patterns; use direct lookups and a single update operation.
- Reliability:
  - Keep response schema stable for frontend integration.
- Maintainability:
  - Preserve existing layered structure and naming conventions.

### Out of scope

- Automatic creation of missing applications.
- Authorization/authentication changes.
- Batch stage updates.
- Interview scheduling or scoring side effects.
