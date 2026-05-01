# STORY-001: Retrieve Position Candidates in Active Interview Process

**Status:** Draft  
**Created:** 2026-05-01  
**Last Updated:** 2026-05-01  
**Sprint:** Backlog (Ready for Sprint Planning)

---

## 📖 Narrative & Business Value

### User Story

**As a** recruiter or hiring manager  
**I want to** view all candidates currently in the interview process for a specific job position  
**So that** I can track candidate progress, understand current pipeline status, and make informed decisions about interview scheduling and candidate advancement

### Business Value

- **Pipeline Visibility**: Recruiters can see all active candidates for a position at a glance, enabling faster decision-making
- **Interview Tracking**: Real-time view of where each candidate is in the interview funnel (which phase/step)
- **Performance Metrics**: Average interview scores per position help identify successful interview criteria and candidate fit
- **Operational Efficiency**: Reduces time spent querying candidate status; enables bulk operations (e.g., schedule next interviews, send updates)
- **Candidate Experience**: Faster decision-making leads to quicker feedback and better candidate experience

### Problem It Solves

Currently, recruiters must manually query candidates and cross-reference applications to understand:
- Which candidates have applied to a position
- What interview stage each candidate is in
- How well candidates are performing (average interview score)

This creates friction and delays in pipeline management. A dedicated endpoint provides a single source of truth for position-level candidate tracking.

### Out of Scope

- **Bulk Operations**: This story provides read-only data retrieval. Bulk updates (e.g., advance all candidates to next stage, send bulk emails) are future stories.
- **Interview Scheduling**: Scheduling or rescheduling interviews is out of scope. The endpoint returns step info; scheduling is a separate API.
- **Filtering & Advanced Search**: Filters (by interview stage, score range, date range) are future enhancements. This story returns all candidates for the position.
- **Candidate History**: The endpoint returns current state only. Historical interview data (previous scores, prior rounds) is out of scope.
- **Pagination**: For MVP, assume positions have <100 active candidates. Pagination can be added later if needed.

---

## ✅ Acceptance Criteria

- [ ] **AC-1: Endpoint Creation**
  - `GET /positions/:id/candidates` exists and responds with HTTP 200 for valid position IDs
  - Response includes all candidates with active applications for the position
  - Endpoint validates that position exists; returns 404 if not found

- [ ] **AC-2: Candidate Data**
  - Response includes full name (constructed from `candidate.firstName` + `candidate.lastName`)
  - Response includes candidate email for contact purposes
  - Response includes candidate phone (if available in database)
  - Response includes candidate address (if available in database)

- [ ] **AC-3: Interview Step Tracking**
  - Response includes `currentInterviewStep` (the phase the candidate is currently in)
  - Step includes `stepId`, `stepName` (e.g., "Technical Round 1"), `stepOrder` (sequential position)
  - Step includes `interviewFlowId` to identify which interview flow the position uses

- [ ] **AC-4: Average Score Calculation**
  - Response includes `averageScore` (average of all interview scores for the candidate at this position)
  - Score is calculated from all Interview records linked to the candidate's Application for this position
  - If no interviews have been conducted yet, `averageScore` is `null` (not 0)
  - If interviews exist but have null scores, exclude them from the average (only average non-null scores)

- [ ] **AC-5: Application Status**
  - Response includes `applicationDate` (when the candidate applied)
  - Response includes `applicationNotes` (optional notes on the application)
  - Response includes `totalInterviewsCompleted` (count of interviews with non-null scores)

- [ ] **AC-6: Response Format**
  - Response body is a JSON object with `positionId`, `positionTitle`, and `candidates` (array of candidate objects)
  - Example response:
    ```json
    {
      "positionId": 1,
      "positionTitle": "Software Engineer",
      "candidates": [
        {
          "candidateId": 1,
          "fullName": "John Doe",
          "email": "john.doe@gmail.com",
          "phone": "1234567890",
          "address": "123 Main St",
          "applicationDate": "2026-05-01T10:00:00Z",
          "applicationNotes": "Strong technical background",
          "currentInterviewStep": {
            "stepId": 1,
            "stepName": "Technical Round 1",
            "stepOrder": 1,
            "interviewFlowId": 1
          },
          "averageScore": 4.5,
          "totalInterviewsCompleted": 2
        }
      ]
    }
    ```

- [ ] **AC-7: Error Handling**
  - Returns 404 if position does not exist
  - Returns 400 if position ID is invalid (non-numeric)
  - Returns 200 with empty `candidates` array if position exists but has no active applications
  - Returns 500 with descriptive error message if database query fails

- [ ] **AC-8: Authorization**
  - Only authenticated users with "recruiter" or "hiring_manager" role can access this endpoint
  - Unauthorized users receive 403 Forbidden
  - (Note: Auth implementation may be out of scope for this story; flag if not implemented)

---

## 🏗️ Technical Design

### Affected Systems & Domains

- **Presentation Layer**: New route handler in `src/presentation/controllers/positionController.ts`
- **Application Layer**: New service method in `src/application/services/positionService.ts` for business logic (average score calculation, data transformation)
- **Domain Layer**: Candidate and Application domain models (no changes needed; existing relations sufficient)
- **Routes**: New route registered in `src/routes/positionRoutes.ts`
- **Database Query**: Prisma query spanning Candidate, Application, Interview, InterviewStep, Position models

### Data Model Changes

**No schema changes required.** The endpoint leverages existing relations:
- `Position` → `Application` (one-to-many)
- `Application` → `Candidate` (many-to-one)
- `Application` → `InterviewStep` (many-to-one, via `currentInterviewStep` field)
- `Interview` → `Application` (one-to-many)
- `Interview.score` (nullable integer, 1–5 or similar)

**Note**: Ensure `Interview.score` column allows `null` (for incomplete interviews). Per schema review, this is already the case.

### API Contract Changes

**New Endpoint:**
```
GET /positions/:id/candidates
```

**Path Parameters:**
- `id` (integer, required) — Position ID

**Query Parameters:**
- None (MVP; filters are future work)

**Response:**
- Status: `200 OK`
- Body: JSON object with structure as described in AC-6
- Content-Type: `application/json`

**Error Responses:**
- `400 Bad Request` — Invalid position ID (non-numeric)
- `404 Not Found` — Position does not exist
- `403 Forbidden` — User not authorized
- `500 Internal Server Error` — Database or server error

**Example Request:**
```
GET /positions/1/candidates
```

**Example Success Response (200):**
```json
{
  "positionId": 1,
  "positionTitle": "Software Engineer",
  "candidates": [
    {
      "candidateId": 1,
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "applicationDate": "2026-05-01T10:00:00Z",
      "applicationNotes": "Strong technical background",
      "currentInterviewStep": {
        "stepId": 1,
        "stepName": "Technical Round 1",
        "stepOrder": 1,
        "interviewFlowId": 1
      },
      "averageScore": 4.5,
      "totalInterviewsCompleted": 2
    }
  ]
}
```

**Example Error Response (404):**
```json
{
  "error": "Position not found",
  "statusCode": 404
}
```

### Implementation Notes

#### Query Strategy

Use Prisma `findUnique` with nested relation fetching:

```typescript
const position = await prisma.position.findUnique({
  where: { id: positionId },
  include: {
    applications: {
      include: {
        candidate: true,
        interviewStep: true,
        interviews: {
          where: { score: { not: null } }, // Exclude incomplete interviews
        },
      },
    },
  },
});
```

Then, in the service layer, transform the result:
1. Extract `candidate` and `application` data
2. Calculate `averageScore` from `interviews` array (safe divide if empty)
3. Format `currentInterviewStep` and other fields
4. Return structured response

#### Average Score Calculation

```typescript
const scores = interviews.map(i => i.score).filter(s => s !== null);
const averageScore = scores.length > 0 
  ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
  : null;
```

#### Error Handling

- Parse `positionId` as integer; return 400 if invalid
- Handle `prisma.position.findUnique()` returning `null` (position not found) → return 404
- Wrap query in try-catch; return 500 with error message if database fails

### Non-Functional Requirements

**Performance:**
- Query must complete in <500ms for positions with up to 100 active candidates
- No N+1 queries (use Prisma `include`, not separate queries per candidate)
- Consider indexing on `Application.positionId` and `Interview.applicationId` if not already present

**Scalability:**
- If a position ever exceeds 100 candidates, implement pagination (future story)
- Current response format allows easy pagination addition without breaking clients

**Security:**
- Authorization required (AC-8); block unauthorized users with 403
- No sensitive data leakage (e.g., do not expose password hashes, internal IDs)
- SQL injection not applicable (Prisma handles parameterization)

**Data Integrity:**
- If an application is deleted, excluded from results (soft delete or cascade handled by schema)
- If an interview step is changed mid-process, return current step (no historical tracking)

**Accessibility:**
- Response is JSON; no UI rendering in this story. Consuming frontend must ensure accessibility.

### Dependencies

- **Prerequisite**: Authentication/Authorization middleware must be implemented (or flagged as out of scope for this story)
- **Database**: PostgreSQL with Prisma ORM must be configured (assumed complete per project setup)
- **No other stories required**: This story is independent and can be implemented immediately

### Observability

**Logging:**
- Log request: `GET /positions/{positionId}/candidates`
- Log position lookup: `position.findUnique({ id: positionId })`
- Log response: `200 OK | 404 Not Found | 500 Error` with candidate count

**Metrics:**
- `http_request_duration_seconds` — histogram of response time (bucket: <100ms, <500ms, <1s)
- `position_candidates_endpoint_errors_total` — counter for 4xx/5xx responses (labeled by error type)
- `position_candidates_count` — gauge of total candidates returned (helps detect anomalies)

**Example logging (Node.js):**
```typescript
logger.info(`GET /positions/:id/candidates`, {
  positionId,
  candidateCount: candidates.length,
  durationMs: Date.now() - startTime,
});
```

### Security & Privacy

- **Authorization**: Enforce role-based access (recruiter, hiring_manager only)
- **Data Sensitivity**: Candidate contact info (email, phone, address) is semi-public within the system. Ensure logs do not expose this in production (PII handling).
- **Rate Limiting**: Consider rate-limiting this endpoint to prevent abuse (future policy)
- **Audit Trail**: Log who accessed this endpoint and when (useful for compliance)

### Rollout & Rollback Plan

**Feature Flag:**
- Feature flag: `FEATURE_POSITION_CANDIDATES_ENDPOINT` (default: off in production)
- Rollout: Gradual, 10% → 50% → 100% over 2 days
- Testing: QA validates endpoint on 10% cohort; no regressions found before expanding

**Safe Rollback:**
- Disable feature flag; endpoint returns 501 Not Implemented if flag is off
- No data migration required; endpoint is read-only
- No schema changes; safe to disable anytime

**Monitoring & Alerts:**
- Alert if response time exceeds 1s (slow query)
- Alert if error rate exceeds 1% (data issue or bug)
- Alert if unauthorized access attempts (security concern)

---

## 🔗 Project Analysis Linkage

### Referenced Analysis Documents

- **Project Documentation** (file: `BACKEND-DOCUMENTATION.md`)
  - Section: "API Endpoints" and "Database Models"
  - Context: Documents existing Candidate, Application, Interview, Position models and current API structure
  - Relevance: Confirms database schema and API design patterns

- **Domain Model Documentation** (file: `CLAUDE.md`)
  - Section: "Architecture → Backend Structure"
  - Context: Describes layered architecture (presentation → application → domain → infrastructure)
  - Relevance: This story follows the documented architecture pattern

### Traceability to Business Goals

- **Pipeline Visibility**: Directly addresses recruiter need for quick candidate status overview
- **Operational Efficiency**: Eliminates manual data gathering; estimated 5–10 min saved per recruiter per day
- **Candidate Experience**: Faster decision-making leads to quicker feedback (indirect benefit)

### Assumptions & Constraints Inherited from Analysis

- **Assumption**: Positions have <100 active candidates (MVP scope)
  - Impact: No pagination required for this story; simple array response sufficient
  - Review: Monitor after launch; if violated, escalate to pagination story

- **Assumption**: Interview scores are numeric and nullable (1–5 or similar)
  - Impact: Safe division when calculating averages; `null` scores excluded from average
  - Review: Confirm scoring scale with product/recruiter feedback post-launch

- **Assumption**: All users have access to recruiter/hiring_manager role (or auth is out of scope)
  - Impact: AC-8 may need adjustment if auth system is not ready
  - Review: Flag with product owner if auth is blocked; may defer to follow-up story

### How to Keep This Story Synced as Analysis Evolves

1. **If schema changes** (e.g., new score fields, resume storage): Update AC-4 and Implementation Notes
2. **If business goals shift** (e.g., new OKR around hiring speed): Update Business Value and Traceability
3. **If interview process changes** (e.g., multi-flow support): Review AC-3 and ensure step data is complete
4. **Sync cadence**: Before each sprint planning, review if assumptions still hold; update if needed

---

## 📋 Definition of Ready (DoR)

- [ ] **Narrative is clear**: Engineers understand the recruiter's need and the business value
- [ ] **Acceptance criteria are testable**: All 8 ACs can be verified via API testing and code review
- [ ] **Technical scope is bounded**: Implementation is limited to new route, service method, and Prisma query
- [ ] **Dependencies identified**: No blocking dependencies; auth may be flagged separately
- [ ] **Analysis linkage is present**: Story references project documentation and architecture
- [ ] **Non-functional requirements are explicit**: Performance, security, observability targets are clear
- [ ] **Rollout plan is documented**: Feature flag and monitoring strategy in place
- [ ] **No open questions remain**: Product owner and tech lead have reviewed and approved
- [ ] **Database schema confirmed**: Existing relations (Candidate → Application → Interview) are sufficient; no schema migration needed

**Readiness Check**: ✅ Ready for sprint planning once auth/authorization approach is confirmed.

---

## ✨ Definition of Done (DoD)

- [ ] **All acceptance criteria pass**
  - Endpoint returns 200 with correct data structure for valid positions
  - Endpoint returns 404 for non-existent positions
  - Error handling tested (400, 500, 403)
  - Average score calculation verified with edge cases (no interviews, null scores, etc.)

- [ ] **Code is reviewed and merged**
  - PR includes new controller, service, and route files
  - Code review approves implementation against architecture patterns
  - No console.logs or debug code left behind

- [ ] **Integration tests pass**
  - Test: Valid position returns all candidates with scores
  - Test: Invalid position ID returns 400
  - Test: Non-existent position returns 404
  - Test: Empty application list returns 200 with empty array
  - Test: Authorization check (401/403 for unauthorized users)

- [ ] **Unit tests for service layer**
  - Test: Average score calculation (empty, one score, multiple scores, null scores)
  - Test: Data transformation (null handling, field mapping)

- [ ] **Observability in place**
  - Logging added for request, response, errors
  - Metrics added to monitoring system
  - No PII (email, phone) logged in production

- [ ] **Documentation updated**
  - API documentation (Swagger/OpenAPI) includes new endpoint
  - Link to this story in PR and merged commit

- [ ] **Story linked to merged PR(s)**
  - Story ID (STORY-001) referenced in PR title or description
  - PR is merged to main branch

- [ ] **Analysis-linked assumptions verified**
  - Confirm <100 candidate limit assumption (or escalate to pagination story)
  - Confirm interview score schema matches implementation
  - Confirm auth/authorization approach is finalized

---

## 📝 Implementation Checklist

### Phase 1: Setup (Backend Engineer)
- [ ] Create `src/presentation/controllers/positionController.ts` (if not exists)
- [ ] Add `getPositionCandidates` method to controller
- [ ] Create `src/application/services/positionService.ts` (if not exists)
- [ ] Add business logic: candidate data fetching, score calculation, transformation

### Phase 2: Integration (Backend Engineer)
- [ ] Register new route in `src/routes/positionRoutes.ts`: `router.get('/:id/candidates', getPositionCandidates)`
- [ ] Add auth/authorization middleware check
- [ ] Add error handling and HTTP status mapping

### Phase 3: Testing (Backend/QA)
- [ ] Write integration tests (Postman or Jest)
- [ ] Test valid and edge cases (empty, null scores, invalid IDs)
- [ ] Verify response format against AC-6

### Phase 4: Deployment (DevOps/Backend)
- [ ] Enable feature flag in staging
- [ ] Run load test (100+ simultaneous requests)
- [ ] Verify monitoring and logging work
- [ ] Deploy to production with feature flag (10% → 50% → 100%)

---

**Story ID:** STORY-001  
**Prepared by:** Product + Engineering  
**Next Review Date:** Sprint Planning (Week of 2026-05-06)
