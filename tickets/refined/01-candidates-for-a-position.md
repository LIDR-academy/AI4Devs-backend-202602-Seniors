# 01 - Candidates for a position

## [original]

As a recruiter
I want to have a list of candidates that a position has
So that I can easily take a decission about what is the next step I have to perform

### Description

We want to implement the following endpoint: GET /positions/:id/candidates

This endpoint will get all the candidates associated to a position. All the applies a possition (positionID) has received. The response should include the following information:
- Full name of the candidate (candidate table)
- Current candidate's phase (application table, currentInterviewStep field)
- Average score of the candidate based on the interview score

Endpoint response:

```json
[
  {
    "fullName": "Candidate 1 full name",
    "currentInterviewStep": 2,
    "averageScore": 75
  },
  {
    "fullName": "Candidate 2 full name",
    "currentInterviewStep": 1,
    "averageScore": null
  }
]
```

### Acceptance criteria

Given a position without candidates
When calling the endpoint
Then it will return an empty array of records

Given a position with candidates
When calling the endpoint
Then it will return an array with all the values

Given a position with a candidate in the first interview step
When calling the endpoing
Then it will return an array with one candidate
And the candidate will have null as averageScore because it has not been interviewed yet

## [enhanced]

### Story quality assessment

Status: Not implementation-ready yet.

The original story defines the business intent but is missing key delivery details needed for autonomous implementation:
- API contract details for invalid and not-found cases.
- Deterministic aggregation rules for average score.
- Exact backend files to create/update following current architecture.
- Required tests and documentation updates.
- Non-functional requirements (performance, security, consistency).

### User story

As a recruiter,
I want to list the candidates that applied to a specific position,
so that I can quickly evaluate who is in each interview phase and their current average interview score.

### Functional scope

Implement one new endpoint:
- Method: GET
- URL: /positions/:id/candidates
- Purpose: return all applications for one position as candidate summary rows.

### API contract

#### Request

- Path params:
  - id (required, integer > 0): Position ID.

#### Response 200 (position exists)

Return an array (possibly empty), with one item per application for that position:

```json
[
  {
    "fullName": "Ada Lovelace",
    "currentInterviewStep": 2,
    "averageScore": 75
  },
  {
    "fullName": "Alan Turing",
    "currentInterviewStep": 1,
    "averageScore": null
  }
]
```

Field rules:
- fullName: candidate.firstName + " " + candidate.lastName, trimmed.
- currentInterviewStep: value from Application.currentInterviewStep.
- averageScore:
  - Compute from Interview.score rows linked to the same application.
  - Ignore null scores in the average.
  - If there are no non-null scores, return null.
  - If there are scores, return numeric average rounded to 2 decimals.

Recommended order (deterministic output):
- currentInterviewStep ASC, then fullName ASC.

#### Error responses

- 400 Bad Request:
  - id is missing, not numeric, or <= 0.
- 404 Not Found:
  - Position with given id does not exist.
- 500 Internal Server Error:
  - Unexpected server/database error.

### Data source mapping

Use these tables and relations:
- Position (validate existence).
- Application (filter by positionId, read currentInterviewStep).
- Candidate (read firstName, lastName).
- Interview (read score for average calculation).

### Technical design and files to modify

Follow existing backend architecture (route -> controller -> service -> domain model):

1. Create `backend/src/routes/positionRoutes.ts`
- Add `GET /:id/candidates` route.
- Delegate to controller function.

2. Create `backend/src/presentation/controllers/positionController.ts`
- Parse and validate `req.params.id` basic format.
- Call service.
- Return 200/400/404/500 with consistent JSON errors.

3. Create `backend/src/application/services/positionService.ts`
- Validate business rules for `positionId`.
- Ensure position exists.
- Fetch and map candidate summaries.
- Compute averageScore using application interviews.

4. Update `backend/src/domain/models/Position.ts`
- Add a static read method for candidate summaries by position id.
- Keep data access encapsulated in domain model style used in current codebase.

5. Update `backend/src/index.ts`
- Register new positions router: `app.use('/positions', positionRoutes)`.

6. Update `backend/api-spec.yaml`
- Add `/positions/{id}/candidates` endpoint.
- Document params, 200 schema, and 400/404/500 responses.

7. Update `backend/docs/endpoints-catalog.md`
- Add row for the new endpoint and behavior summary.

### Definition of done

Implementation is complete when all of the following are true:
- Endpoint is available at `GET /positions/:id/candidates`.
- Returns 200 with an empty array when position exists and has no applications.
- Returns mapped fields exactly: fullName, currentInterviewStep, averageScore.
- Average score follows aggregation rules defined above.
- Returns 400 for invalid IDs and 404 for missing position.
- OpenAPI spec and docs are updated and aligned with implementation.
- Tests are added and passing.

### Test requirements

Minimum required tests:

1. Service-level tests (`backend/src/application/services/__tests__/positionService.test.ts`)
- Valid position with no applications -> [].
- Valid position with applications and scored interviews -> computed average.
- Interviews with null score are ignored.
- Valid position with only null scores -> averageScore = null.
- Non-existing position -> not-found error.
- Invalid positionId -> validation error.

2. Route/controller integration tests (`backend/src/routes/__tests__/positionRoutes.test.ts`)
- 200 success payload shape.
- 400 on invalid id.
- 404 on unknown position.
- 500 fallback on unexpected errors.

Note:
- If integration tests are implemented with Supertest, add required dev dependencies.

### Acceptance criteria (final)

1. Given an existing position without applications
When calling `GET /positions/:id/candidates`
Then response is `200` and body is `[]`.

2. Given an existing position with candidate applications
When calling `GET /positions/:id/candidates`
Then response is `200` and each item contains `fullName`, `currentInterviewStep`, and `averageScore`.

3. Given a candidate in first interview step with no scored interviews
When calling `GET /positions/:id/candidates`
Then `averageScore` is `null` for that candidate.

4. Given a candidate with multiple scored interviews (e.g., 70 and 80)
When calling `GET /positions/:id/candidates`
Then `averageScore` is `75`.

5. Given an invalid position id (non-numeric or <= 0)
When calling `GET /positions/:id/candidates`
Then response is `400`.

6. Given a non-existing position id
When calling `GET /positions/:id/candidates`
Then response is `404`.

### Non-functional requirements

- Security:
  - Do not expose stack traces or internal DB details in API responses.
- Performance:
  - Query strategy should avoid N+1 behavior.
  - For up to 1000 applications in one position, endpoint should respond under 300 ms in local baseline environment.
- Reliability:
  - Deterministic ordering of results.
  - Stable response shape for frontend consumption.
- Maintainability:
  - Keep new code within existing layered architecture and naming conventions.
- Documentation quality:
  - API spec and docs must reflect actual behavior with no drift.

### Out of scope

- Authentication/authorization changes.
- Pagination/filtering/sorting query parameters beyond the deterministic default ordering above.
- Frontend UI changes.
