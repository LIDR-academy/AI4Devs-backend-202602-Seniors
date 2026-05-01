# Tasks for STORY-002: Update Candidate Interview Stage

**Discipline**: API  
**Total Tasks**: 1  
**Coverage**: AC (endpoint contract definition)

---

## TASK-STORY-002-API-001

**Title**: Define and document PUT /candidates/:applicationId/stage API contract

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: API

**Depends On**: None

**Blocks**: TASK-STORY-002-QA-001 (test cases depend on contract specification)

---

### Purpose & Scope

**Purpose**
Define the complete API contract for the PUT /candidates/:applicationId/stage endpoint. This task ensures the contract is precise, testable, and ready for frontend integration and QA automation.

Fulfills AC: "API endpoint exists at `PUT /candidates/:id/stage` with proper HTTP method"

**Scope of Change**
- Add/verify: `@swagger` JSDoc annotation for `PUT /candidates/{applicationId}/stage` in `backend/src/routes/candidateRoutes.ts`
- Add/verify: shared schemas (`UpdateCandidateStageRequest`, `UpdateCandidateStageResponse`, `InterviewStep`, `ErrorResponse`) in `backend/swagger.ts`
- Document: Request payload schema (interviewStepId, notes)
- Document: Response payload schema (HTTP 200, 400, 401, 403, 404, 500)
- Document: All status codes, error response formats, validation rules
- Modify: `docs/API-REFERENCE.md` with endpoint description, examples, error codes

**Where**
- **Shared schemas & top-level config** (servers, security schemes, components): `backend/swagger.ts` — edit the `options.definition.components` block
- **Route-level JSDoc** (endpoint path, method, request/response schemas): `backend/src/routes/candidateRoutes.ts` — add/update `@swagger` block above the `router.put(...)` call
- **Generated spec** (read-only, auto-built at runtime): served at `GET /api-docs` via `swagger-ui-express`; do NOT create a `backend/docs/openapi.yaml` or any secondary YAML file that could drift from the JSDoc source
- API reference: `backend/docs/API-REFERENCE.md` (add new section)
- Postman collection: generated from the live spec at `GET /api-docs` (optional)

**Why**
Per CLAUDE.md architecture: API contracts are single source of truth for endpoint behavior. Explicit contracts prevent mismatches between backend implementation and frontend expectations. OpenAPI enables automated test generation and API client code generation.

Per story's technical design: All error responses, status codes, and payloads are defined in the story; this task formalizes them in machine-readable format.

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Add/verify `@swagger` JSDoc in `backend/src/routes/candidateRoutes.ts`**:
   - Add a JSDoc block above the `router.put('/:applicationId/stage', ...)` registration
   - Define endpoint: `PUT /candidates/{applicationId}/stage`
   - Reference shared request/response schemas via `$ref: '#/components/schemas/...'`
   - Add authentication: `security: [{ bearerAuth: [] }]`
   - Add examples for success and error responses
   - `swagger-jsdoc` (configured in `backend/swagger.ts`, `apis: ['./src/routes/*.ts']`) automatically picks up the JSDoc at runtime — no YAML file needed

2. **Document all response schemas**:
   ```yaml
   responses:
     '200':
       description: Stage updated successfully
       content:
         application/json:
           schema:
             type: object
             properties:
               applicationId: { type: integer }
               candidateId: { type: integer }
               positionId: { type: integer }
               applicationDate: { type: string, format: date-time }
               updatedAt: { type: string, format: date-time }
               currentInterviewStep:
                 type: object
                 properties:
                   stepId: { type: integer }
                   stepName: { type: string }
                   stepOrder: { type: integer }
                   interviewFlowId: { type: integer }
     '400':
       description: Invalid input (missing/invalid fields, stage not in flow)
       content:
         application/json:
           schema:
             type: object
             properties:
               error: { type: string }
               statusCode: { type: integer, const: 400 }
               message: { type: string }
     '401':
       description: Unauthorized (missing or invalid JWT)
     '403':
       description: Forbidden (insufficient role)
     '404':
       description: Application not found
   ```

3. **Update API reference markdown** (`docs/API-REFERENCE.md`):
   - Add section: "Update Candidate Interview Stage"
   - Include endpoint signature, authentication, request/response examples
   - List all error codes and when they occur
   - Add curl examples for happy path and error cases

4. **Validate OpenAPI syntax**:
   ```bash
   # Start the backend server
   cd backend && npm run dev

   # Fetch the generated spec (the live, authoritative output of swagger-jsdoc)
   curl http://localhost:3010/api-docs/swagger.json | jq . > /tmp/spec.json

   # Optionally validate with swagger-cli against the live output
   npm install -g @apidevtools/swagger-cli
   swagger-cli validate /tmp/spec.json
   ```
   Do NOT create a static `backend/docs/openapi.yaml` — it would become a second copy
   that drifts from the `swagger.ts`/JSDoc source of truth.

5. **Generate Postman collection** (optional):
   ```bash
   # Export the live spec from the running server, then import into Postman
   curl http://localhost:3010/api-docs/swagger.json -o backend/docs/postman-source.json
   npm install -g openapi-to-postman
   openapi2postmanv2 -s backend/docs/postman-source.json -o backend/docs/postman-collection.json
   ```

**Inputs / Outputs / Contracts**

**OpenAPI Specification (YAML):**
```yaml
openapi: 3.0.0
info:
  title: LTI Candidate Stage API
  version: 1.0.0
paths:
  /candidates/{applicationId}/stage:
    put:
      summary: Update candidate interview stage
      operationId: updateCandidateStage
      parameters:
        - name: applicationId
          in: path
          required: true
          schema:
            type: integer
          description: ID of the application to update
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                interviewStepId:
                  type: integer
                  description: ID of the target interview step
                notes:
                  type: string
                  description: Optional notes about the stage change
              required:
                - interviewStepId
      responses:
        '200':
          description: Stage updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApplicationResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'
        '500':
          $ref: '#/components/responses/InternalServerError'
      security:
        - BearerAuth: []
components:
  schemas:
    ApplicationResponse:
      type: object
      properties:
        applicationId: { type: integer }
        candidateId: { type: integer }
        positionId: { type: integer }
        applicationDate: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
        currentInterviewStep:
          type: object
          properties:
            stepId: { type: integer }
            stepName: { type: string }
            stepOrder: { type: integer }
            interviewFlowId: { type: integer }
    ErrorResponse:
      type: object
      properties:
        error: { type: string }
        statusCode: { type: integer }
        message: { type: string }
  responses:
    BadRequest:
      description: Invalid input
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Unauthorized:
      description: Missing or invalid authorization
    Forbidden:
      description: Insufficient permissions
    NotFound:
      description: Application not found
    InternalServerError:
      description: Internal server error
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

**API Reference Markdown:**
```markdown
## Update Candidate Interview Stage

Move a candidate to the next interview stage.

### Endpoint

`PUT /candidates/:applicationId/stage`

### Authentication

Requires Bearer token with `recruiter` or `hiring_manager` role.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| interviewStepId | integer | Yes | Target interview step ID |
| notes | string | No | Optional notes about the change |

### Success Response (HTTP 200)

```json
{
  "applicationId": 3,
  "candidateId": 1,
  "positionId": 1,
  "applicationDate": "2026-05-01T13:20:26.527Z",
  "updatedAt": "2026-05-01T14:35:00.000Z",
  "currentInterviewStep": {
    "stepId": 2,
    "stepName": "Technical Interview",
    "stepOrder": 2,
    "interviewFlowId": 1
  }
}
```

### Error Responses

**HTTP 400 - Invalid Input**
```json
{
  "error": "Invalid interview step ID",
  "statusCode": 400,
  "message": "Step 99 is not part of the interview flow for position 1"
}
```

**HTTP 401 - Unauthorized**
```json
{
  "error": "Unauthorized",
  "statusCode": 401,
  "message": "Missing or invalid authorization token"
}
```

**HTTP 403 - Forbidden**
```json
{
  "error": "Forbidden",
  "statusCode": 403,
  "message": "User role does not have permission to update candidate stages"
}
```

**HTTP 404 - Not Found**
```json
{
  "error": "Application not found",
  "statusCode": 404,
  "message": "Application with ID 9999 not found"
}
```

### Examples

**curl - Update to step 2:**
```bash
curl -X PUT http://localhost:3010/candidates/3/stage \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewStepId": 2,
    "notes": "Passed screening"
  }'
```

**curl - Error: step not in flow:**
```bash
curl -X PUT http://localhost:3010/candidates/3/stage \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"interviewStepId": 99}'

# Response (HTTP 400):
# {
#   "error": "Interview step not valid for this position",
#   "statusCode": 400,
#   "message": "Step 99 is not part of the interview flow for position 1"
# }
```
```

**Dependencies**
- `swagger-jsdoc` and `swagger-ui-express` are already installed in `backend/package.json`
- `backend/swagger.ts` already wired into `index.ts` (serves `/api-docs`)
- No additional library installs required; edit `swagger.ts` and route JSDoc only

---

### Acceptance Criteria

- [ ] `@swagger` JSDoc added/verified in `backend/src/routes/candidateRoutes.ts` for `PUT /{applicationId}/stage`; shared schemas in `backend/swagger.ts` — spec auto-generated at `GET /api-docs`
- [ ] Request schema includes: applicationId (path param), interviewStepId (required), notes (optional)
- [ ] Response schema (HTTP 200) matches story spec: applicationId, candidateId, positionId, applicationDate, updatedAt, currentInterviewStep
- [ ] All error responses documented: 400, 401, 403, 404, 500 with exact error messages
- [ ] Authentication schema defined: Bearer token with JWT format
- [ ] Authorization documented: `recruiter` or `hiring_manager` role required
- [ ] API reference markdown updated (`docs/API-REFERENCE.md`) with endpoint description and examples
- [ ] Spec validates: `GET /api-docs/swagger.json` serves valid JSON (or `swagger-cli validate` against the exported spec)
- [ ] curl examples provided for happy path (HTTP 200) and error cases (400, 401, 403, 404)
- [ ] Postman collection generated from OpenAPI (optional; if used for testing)

---

### Test Requirements

**Unit Tests** (N/A for API spec definition)

**Integration Tests**
- Validate OpenAPI syntax and structure (JSON schema validation)
- Verify all response examples match their schemas (semantic validation)
- Verify all error responses include required fields: error, statusCode, message

**Manual Testing / Regression Scope**
- Review OpenAPI spec with team: Does it match story acceptance criteria?
- Verify curl examples work (once backend implementation is complete)
- Test that Postman collection can be imported and requests execute successfully

---

### Non-Functional Requirements

**Specification Quality**
- OpenAPI spec is complete and unambiguous; no fields missing or underspecified
- Examples are realistic and match production behavior
- Error messages are user-friendly (not exposing internal DB errors)

**Maintainability**
- OpenAPI spec is version-controlled in same repo as code
- Spec is single source of truth; backend implementation must match spec
- When backend behavior changes, spec is updated first (contract-first development)

**Documentation Quality**
- API reference markdown is readable by non-technical stakeholders
- curl examples are copy-paste-ready (correct endpoints, headers, JSON format)
- All error codes explained: when they occur, how to handle them

---

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| OpenAPI spec and backend implementation diverge | Use contract-first development: spec is written before implementation; CI pipeline validates backend matches spec |
| Error messages in spec don't match actual errors | Implement error handling in backend to match spec; update spec if business rules change |
| Frontend can't parse response due to schema mismatch | Provide Postman collection so frontend team tests against working backend early |
| OpenAPI syntax errors prevent code generation | Validate spec in CI pipeline; block merges of invalid specs |

---

### Definition of Done

- [ ] `@swagger` JSDoc in `candidateRoutes.ts` and schemas in `swagger.ts` committed to version control (no separate openapi.yaml)
- [ ] All endpoint details specified: method, path, parameters, request/response schemas
- [ ] All status codes and error responses documented with examples
- [ ] Authentication and authorization requirements specified
- [ ] API reference markdown created with examples and error codes
- [ ] Spec validates (swagger-cli against live-exported JSON; no static YAML in repo)
- [ ] Postman collection generated (if tool supports it)
- [ ] API spec reviewed and approved by backend and frontend leads
- [ ] Code committed to main branch
- [ ] Link from story to API spec documented (or merged PR linked)

---
