# API Contract Tasks for STORY-001: Retrieve Position Candidates

**Discipline**: API / Contract  
**Total Tasks**: 1  
**Coverage**: AC-6 (response format), AC-7 (error handling), AC-8 (authorization headers)

---

## TASK-STORY-001-API-001

**Title**: Define OpenAPI spec and error response contract for GET /positions/:id/candidates endpoint

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: API

**Depends On**: None (can run in parallel with Backend tasks)

**Blocks**: TASK-STORY-001-FRONTEND-001 (Frontend needs API spec to mock)

---

### Purpose

Define the complete API contract (OpenAPI/Swagger spec) for the GET /positions/:id/candidates endpoint, including request/response schemas, error response format, status codes, headers, and authentication requirements. This ensures Frontend and Backend teams have a shared understanding of the contract before implementation begins.

Fulfills AC-6 (response format and structure), AC-7 (error handling with specific status codes), and AC-8 (authorization header requirements).

### Scope of Change

- **Create**: OpenAPI 3.0 schema definition in `backend/docs/openapi.yaml` or Swagger doc in code comments
- **Modify**: Swagger-jsdoc configuration (if not already set up) to auto-generate OpenAPI spec from route/controller comments
- **Document**: Request schema (path params, query params, headers), response schema (success and all error cases), examples

### Where

- **API Spec File**: `backend/docs/openapi.yaml` (if YAML) or `backend/src/routes/positionRoutes.ts` (if using swagger-jsdoc decorators)
- **Swagger UI**: Served at `http://localhost:5000/api-docs` (or configured port)
- **Example Request/Response**: Included in OpenAPI spec

### Why

Per STORY-001 Technical Design, the API contract is the interface between Frontend and Backend. An explicit, detailed OpenAPI spec:
1. Enables Frontend developers to mock the API before Backend is ready
2. Documents all error cases (400, 404, 403, 500) with exact status codes and error message format
3. Validates Authorization header requirements (Bearer token expected)
4. Provides a contract that both teams can test against (Frontend calls mock spec, Backend implements spec)
5. Supports API documentation generation for external consumers (if needed post-MVP)

Per CLAUDE.md (Layered Architecture), the API contract is the boundary between presentation layer (HTTP) and application layer (business logic).

### How: Technical Approach

**Step 1**: Choose OpenAPI tooling
- **Option A**: Use swagger-jsdoc decorators in route handlers (code-first approach)
  - Pros: Contract lives near code; easier to keep in sync
  - Cons: Route files become verbose; harder to see full spec
- **Option B**: Write OpenAPI YAML spec directly (spec-first approach)
  - Pros: Clear, declarative spec; easier to review entire contract at once
  - Cons: Manual sync required if route structure changes
- **Recommendation**: Use swagger-jsdoc (Option A) because backend already uses Swagger-UI Express per package.json

**Step 2**: Define request schema
- Path parameter: `id` (integer, required, example: 1)
- No query parameters (MVP scope)
- Headers: `Authorization: Bearer <JWT>` (required, per AC-8)
- Content-Type: `application/json` (implicit)

**Step 3**: Define success response schema (200 OK)
- HTTP 200 status
- Body: JSON object with structure from AC-6:
  ```json
  {
    "positionId": number,
    "positionTitle": string,
    "candidates": [
      {
        "candidateId": number,
        "fullName": string,
        "email": string,
        "phone": string (nullable),
        "address": string (nullable),
        "applicationDate": ISO 8601 date string,
        "applicationNotes": string (nullable),
        "currentInterviewStep": {
          "stepId": number,
          "stepName": string,
          "stepOrder": number,
          "interviewFlowId": number
        },
        "averageScore": number (nullable, 1-5 or similar),
        "totalInterviewsCompleted": number
      }
    ]
  }
  ```

**Step 4**: Define error response schemas
- **400 Bad Request** (invalid position ID)
  - Body: `{ "error": "Invalid position ID", "statusCode": 400, "message": "Position ID must be a valid integer" }`
- **401 Unauthorized** (missing Authorization header)
  - Body: `{ "error": "Unauthorized", "statusCode": 401, "message": "Missing or invalid Authorization header" }`
- **403 Forbidden** (user not in recruiter/hiring_manager role)
  - Body: `{ "error": "Forbidden", "statusCode": 403, "message": "User role does not have permission to access this endpoint" }`
- **404 Not Found** (position does not exist)
  - Body: `{ "error": "Position not found", "statusCode": 404, "message": "No position with ID 1 exists" }`
- **500 Internal Server Error** (database query failed)
  - Body: `{ "error": "Internal Server Error", "statusCode": 500, "message": "An error occurred while fetching position candidates" }`

**Step 5**: Add OpenAPI spec to Swagger UI
- Ensure swagger-jsdoc is configured to scan route files
- Generate spec at startup (or on demand)
- Serve at `/api-docs` endpoint
- Validate spec is readable and accurate in browser

**Step 6**: Document example requests/responses
- Include cURL example in spec
- Include Postman collection example (optional)
- Document auth flow (how to obtain JWT token for testing)

### Inputs / Outputs / Contracts

**Input**:
- Swagger-jsdoc configuration (likely already exists in backend project)
- OpenAPI 3.0 spec template (standard format)
- Error response format convention (must match Backend error handling)

**Output**:
- OpenAPI YAML or JSON spec defining full endpoint contract
- Swagger UI page at `/api-docs` showing interactive API explorer
- Documentation file: `docs/API-CONTRACT-STORY-001.md` with:
  - Endpoint summary (method, path, purpose)
  - Request schema with examples
  - Response schema (all status codes) with examples
  - Authentication requirements (Bearer token, required roles)
  - Error cases with example error messages
  - Curl and Postman examples

**Contracts**:
- Authorization header: `Authorization: Bearer <JWT>`
- Error response format (consistent across all endpoints):
  ```typescript
  {
    error: string;        // e.g., "Position not found"
    statusCode: number;   // HTTP status code
    message?: string;     // Optional detailed message
  }
  ```

### Dependencies

- Backend project must already have swagger-jsdoc and swagger-ui-express (confirmed in package.json)
- Backend team must agree on error response format (if not already standardized)
- Authorization middleware must be documented (how JWT is extracted, validated, roles checked)

### Acceptance Criteria

- [ ] OpenAPI spec (YAML or JSON) created and validated for correctness
- [ ] Endpoint path, method, parameters, headers documented
- [ ] Success response (200) schema matches AC-6 exactly (field names, types, nullability)
- [ ] All error responses (400, 401, 403, 404, 500) documented with example payloads
- [ ] Authorization header requirement documented (Bearer token, required)
- [ ] Swagger UI displays spec correctly and is interactive
- [ ] Example cURL request provided for each status code (200, 400, 404, 403, 500)
- [ ] Endpoint marked as "requires authentication" in spec
- [ ] No breaking changes to existing API endpoints (spec is additive only)
- [ ] Spec can be served to Frontend team for mocking before implementation

### Test Requirements

**Manual API Contract Validation**:
- Open Swagger UI (`http://localhost:5000/api-docs`)
- Verify endpoint appears in UI with correct method (GET) and path (`/positions/{id}/candidates`)
- Click "Try it out" in UI
- Attempt requests with valid and invalid position IDs
- Verify response matches schema (field names, types)

**OpenAPI Spec Validation** (tools like Swagger CLI):
- Run: `swagger-cli validate backend/docs/openapi.yaml` (or equivalent)
- Expected: No validation errors
- Check: All required fields present, all types match definition, all examples are valid JSON

**Contract Consistency Check**:
- Verify Backend error responses match spec examples
- Verify Frontend mocks use spec definition (not hardcoded values)
- Verify Authorization header is actually required in runtime (not just spec)

**No automated tests required**: This is a specification task; validation is manual inspection and tooling validation.

### Non-Functional Requirements

**API Quality**:
- Spec must be RESTful (GET for retrieval, no side effects)
- Response time documented or implied (inherited from Backend performance NFR: <500ms)
- Spec must be clear enough for Frontend to implement without Backend guidance

**Documentation Quality**:
- OpenAPI spec must be complete (no `TODO` or `FIXME` placeholders)
- Examples must be realistic (not placeholder data like "xxx" or "test123")
- Error messages must be user-friendly and specific (not generic "error occurred")

**Backwards Compatibility**:
- New endpoint does not affect existing endpoints
- Error response format must match any existing error convention in backend (if any)
- No deprecation warnings needed (new endpoint, no legacy)

**Security** (per AC-8):
- Authorization requirement explicitly documented (Bearer token required)
- Roles (recruiter, hiring_manager) listed in spec
- Spec does not expose sensitive information (no database IDs in examples, no internal error details)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Spec and Backend implementation drift (spec says one thing, Backend does another) | Pair-programming or peer review: Backend engineer implements from spec and reviews spec change; spec engineer reviews Backend code |
| Error response format not standardized across endpoints (this endpoint uses different format than others) | Document current error response convention in backend; enforce consistency via linting rule or API review checklist |
| Frontend waits for Backend implementation instead of mocking from spec | Share spec early (this task); point Frontend to Swagger UI; use Postman/Insomnia to mock responses |
| OpenAPI spec too verbose or unclear | Keep spec concise; use examples liberally; test spec readability with non-author (peer review) |

### Definition of Done

- [ ] OpenAPI spec created (YAML or JSON) in `docs/` directory or inline in code
- [ ] Spec includes endpoint path, method, parameters, headers, all request/response schemas
- [ ] All error cases (400, 401, 403, 404, 500) documented with example payloads
- [ ] Success response schema matches AC-6 exactly (field names, types, nullability, array structure)
- [ ] Authorization header requirement documented and marked as required in spec
- [ ] Swagger UI serves spec and displays correctly (endpoint visible, examples readable)
- [ ] Spec validated with tooling (no syntax errors, valid OpenAPI 3.0)
- [ ] Example cURL requests provided for happy path and error cases
- [ ] Error response format consistent with other backend endpoints (or new standard documented)
- [ ] Frontend team can access spec and mock API without Backend code
- [ ] Peer review completed (spec engineer + Backend engineer sign-off)
- [ ] Task linked to STORY-001

---
