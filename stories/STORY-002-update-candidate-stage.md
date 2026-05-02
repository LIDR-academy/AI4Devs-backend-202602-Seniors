# STORY-002: Update Candidate Interview Stage

**Status:** Draft  
**Created:** 2026-05-01  
**Last Updated:** 2026-05-01

---

## 📖 Narrative & Business Value

### User Story

As a recruiter or hiring manager, I want to advance a candidate to the next interview stage so that I can track interview progress and manage the hiring pipeline efficiently.

### Business Value

**Problem:** Currently, recruiters cannot easily move candidates through interview stages. The interview process requires manual database updates or complex workarounds. This creates friction in the hiring workflow and leads to stale candidate status data.

**Solution:** Provide a REST endpoint that allows recruiters to update a candidate's current interview stage with a single API call. This enables:
- **Faster interview progression tracking** — Recruiters can update stages in real-time during interviews
- **Accurate pipeline visibility** — Hiring managers see up-to-date candidate progress
- **Reduced manual overhead** — No need for database tools or email-based status updates
- **Audit trail** — Each stage transition is logged for compliance and analytics

**Impact:** Estimated to reduce manual candidate status updates by 70% (~2h/week per recruiter). Enables integration with automated interview scheduling and feedback workflows.

### Out of Scope

- Automatic stage advancement based on interview completion (future automation story)
- Bulk candidate stage updates (future batch operations story)
- Interview feedback collection in this endpoint (separate story)
- Role-based stage restrictions (future story; all recruiters can move to any stage)
- Notification of candidates about stage changes (future notification story)
- Reverting a candidate to a previous stage (handled by create new application flow)

---

## ✅ Acceptance Criteria

- [ ] **API endpoint exists** at `PUT /candidates/:applicationId/stage` with proper HTTP method
- [ ] **Valid request contract**: Request requires `applicationId` as the URL path parameter (uniquely identifies the application; a candidate may have multiple applications across positions); body requires `interviewStepId`
- [ ] **Stage validation**: Request accepts `interviewStepId` (integer) to specify the target interview step
- [ ] **Success response (HTTP 200)**: Returns updated Application object with:
  - `candidateId`, `positionId`, `applicationId`
  - `currentInterviewStep` object with `stepId`, `stepName`, `stepOrder`, `interviewFlowId`
  - `applicationDate`, `updatedAt` timestamp
- [ ] **Invalid position ID (HTTP 400)**: Non-integer or negative position ID is rejected with error message "Invalid application ID"
- [ ] **Invalid stage ID (HTTP 400)**: Non-integer or stage ID not in the interview flow is rejected with error "Invalid interview step ID"
- [ ] **Application not found (HTTP 404)**: Non-existent application ID returns "Application with ID X not found"
- [ ] **Stage not in flow (HTTP 400)**: Selected stage is not part of the position's interview flow, rejected with "Interview step not valid for this position"
- [ ] **Authentication required (HTTP 401)**: Missing or invalid Authorization header returns "Unauthorized"
- [ ] **Role-based access (HTTP 403)**: Only users with `recruiter` or `hiring_manager` role can update stages; others get "Forbidden"
- [ ] **Audit logging**: Every stage update logs: timestamp, user ID, application ID, old stage, new stage, to support compliance
- [ ] **Idempotent behavior**: Updating to the same stage twice returns 200 both times (no error on no-op update)

---

## 🏗️ Technical Design

### Affected Systems & Domains

**Backend:**
- `application/services/candidateStageService.ts` (new) — Business logic for stage transitions
- `presentation/controllers/candidateController.ts` (modify) — Add PUT handler
- `domain/Application.ts` (modify) — Stage update method
- `routes/candidateRoutes.ts` (modify) — Register PUT endpoint
- `application/services/auditService.ts` (existing or new) — Log stage changes
- `application/middleware/authMiddleware.ts` (existing) — Enforce authentication
- `application/middleware/roleMiddleware.ts` (existing) — Enforce recruiter/hiring_manager role

**Database:**
- No schema changes required; uses existing `Application.currentInterviewStep` foreign key

### Data Model Changes

**No new tables.** Uses existing schema:
- `Application` table: `currentInterviewStep` (FK to `InterviewStep.id`) — updated on each stage change
- `AuditLog` table (if not existing): track all stage transitions for compliance

**New audit log entry format (if creating AuditLog table):**
```sql
CREATE TABLE IF NOT EXISTS "AuditLog" (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50),           -- 'STAGE_UPDATE'
  userId INT NOT NULL,          -- from JWT token
  applicationId INT NOT NULL,   -- fk to Application
  oldStageId INT,               -- previous currentInterviewStep
  newStageId INT NOT NULL,      -- new currentInterviewStep
  timestamp TIMESTAMP DEFAULT NOW(),
  details JSONB                 -- {reason, notes, etc}
);
```

### API Contract Changes

**New Endpoint:**

```
PUT /candidates/:applicationId/stage
```

**Request:**
```json
{
  "interviewStepId": 2,
  "notes": "Passed technical round, scheduled manager interview"
}
```

**Response (HTTP 200 - Success):**
```json
{
  "applicationId": 3,
  "candidateId": 1,
  "positionId": 1,
  "applicationDate": "2026-05-01T13:20:26.527Z",
  "updatedAt": "2026-05-01T14:30:00.000Z",
  "currentInterviewStep": {
    "stepId": 2,
    "stepName": "Technical Interview",
    "stepOrder": 2,
    "interviewFlowId": 1
  }
}
```

**Error Responses:**

```json
{
  "error": "Invalid application ID",
  "statusCode": 400,
  "message": "Application ID must be a valid integer"
}
```

```json
{
  "error": "Application not found",
  "statusCode": 404,
  "message": "Application with ID 9999 not found"
}
```

```json
{
  "error": "Interview step not valid for this position",
  "statusCode": 400,
  "message": "Step 5 is not part of the interview flow for position 1"
}
```

### Implementation Notes

**Key Decisions:**

1. **URL parameter is `applicationId`, not `candidateId`**: A candidate can apply to multiple positions (multiple applications). The stage is tracked per-application, not per-candidate. This ensures clarity: `PUT /candidates/:applicationId/stage` updates the stage for one specific application.

2. **Request body requires `interviewStepId`**: The new target stage is specified by ID (not name), allowing flexibility if interview flows have duplicate step names.

3. **Audit logging is mandatory**: Every transition is logged to support:
   - Compliance audits (who moved candidates when)
   - Analytics on interview stage velocity
   - Debugging of accidental moves
   - Future analytics queries

4. **Validation order** (to fail fast):
   - Parse and validate `applicationId` (integer, non-negative)
   - Authenticate (JWT token)
   - Authorize (recruiter/hiring_manager role)
   - Fetch Application and related Position, InterviewFlow
   - Validate `interviewStepId` exists in the position's interview flow
   - Update and audit log
   - Return success response

5. **Transaction safety**: Wrap stage update + audit log in a database transaction to ensure consistency (if candidate update fails, audit log is rolled back).

**Architecture Pattern:**

```
Route Handler (PUT /candidates/:applicationId/stage)
  ↓ authMiddleware (verify JWT)
  ↓ requireRole(['recruiter', 'hiring_manager'])
  ↓ Controller.updateCandidateStage()
    ↓ validateApplicationId()
    ↓ candidateStageService.updateStage(applicationId, newStepId, userId)
      ↓ Application.findOne(applicationId) [with Position, InterviewFlow includes]
      ↓ InterviewFlow.getStepById(stepId) [validate step exists in flow]
      ↓ Application.save() [update currentInterviewStep]
      ↓ auditService.logStageChange(...)
    ↓ Return updated Application
```

### Non-Functional Requirements

**Performance:**
- Stage update completes in <200ms (single DB transaction: one FK update + one audit log insert)
- Audit log write is synchronous and part of the same transaction; no async overhead

**Security:**
- JWT token required; no anonymous updates
- Role-based access control: only recruiter/hiring_manager can update stages
- Application must belong to a position within recruiter's assigned company (future: company-scoped access)
- Input validation: sanitize `interviewStepId`, reject invalid integers
- Prevent moving candidate to non-existent or unrelated interview steps (FK constraint + validation)

**Scalability:**
- Audit log is written inside the same DB transaction as the `Application.currentInterviewStep` update; both commit or both roll back
- Indexes on `Application.id`, `Application.currentInterviewStep` for fast lookups

**Reliability:**
- Idempotent: calling twice with the same stage returns 200 both times; the transaction detects the no-op and skips a duplicate audit log insert using `(applicationId, newStageId)` as a uniqueness guard
- Transaction: stage update and audit log insert are atomic — if either fails, neither is persisted
- Graceful error messages: don't expose internal DB errors; map to user-friendly messages

**Accessibility:**
- Not applicable (API endpoint, no UI component)

### Dependencies

- **STORY-001** (GET /positions/:id/candidates): Must be deployed first; ensures frontend can display current stages before allowing updates
- **Authentication middleware**: Existing `authMiddleware.ts` and `requireRole` must be in place
- **Prisma schema**: `Application`, `Position`, `InterviewFlow`, `InterviewStep` relations must be defined (already are per CLAUDE.md)

### Observability

**Logging:**
```typescript
// Log each stage update
logger.info('Stage updated', {
  applicationId,
  userId,
  oldStageId,
  newStageId,
  timestamp: new Date().toISOString()
});

// Log validation errors
logger.warn('Invalid stage update request', {
  applicationId,
  reason: 'Step not in interview flow',
  timestamp: new Date().toISOString()
});
```

**Metrics:**
- `candidate_stage_updates_total` (counter): Total stage updates by user, position, stage_transition
- `candidate_stage_update_duration_ms` (histogram): Time to complete update (p50, p95, p99)
- `candidate_stage_update_errors_total` (counter): Errors by type (validation, not_found, auth)

**Alerts:**
- Alert if `candidate_stage_update_errors_total[error_type="STAGE_NOT_IN_FLOW"]` exceeds 10/min (suggests bad data or API misuse)

### Security & Privacy

**Authentication & Authorization:**
- Endpoint requires JWT token in Authorization header
- Only users with `recruiter` or `hiring_manager` roles can update stages
- Future: scope access by company (only recruiters at Company A can update positions/candidates in Company A)

**Data Protection:**
- Application and candidate data is not exposed in logs (avoid logging PII)
- Audit log stores application ID (linkable to candidate), not candidate email/name
- Audit log itself is sensitive (shows who moved candidates); restrict read access to HR/compliance team only

**Input Validation:**
- `applicationId`: Must be a valid integer; reject negative, non-integer, or very large numbers
- `interviewStepId`: Must exist in the position's interview flow; reject IDs outside the flow

---

## 🔗 Project Analysis Linkage

### Referenced Analysis Documents

- **Discovery Findings** (from STORY-001 discovery)
  - File: `/analysis/discovery/STORY-001-discovery.md` _(not yet created; expected location)_
  - Section: "Interview Stage Management Pain Points"
  - Finding: Recruiters spend ~2h/week manually updating candidate status in spreadsheets or database. Current system has no API for stage transitions.

- **Business Case** (Project OKRs Q2 2026)
  - File: `/docs/okrs/Q2-2026-business-case.md` _(not yet created; expected location)_
  - Goal: Reduce recruiter manual overhead by 50% in Q2
  - Strategy: Implement interview stage management APIs (this story is part of that strategy)
  - Expected ROI: 2h/week × 10 recruiters × 50 weeks = 1000h saved annually

- **Architecture Decision Record** (ADR-001: Layered Architecture)
  - File: `/docs/adr/ADR-001-layered-architecture.md` _(not yet created; layered architecture currently described in `CLAUDE.md` § "Architecture")_
  - Decision: Follow presentation → application → domain → infrastructure pattern
  - Implication: Stage update logic goes in `candidateStageService`, not in controller

- **Related Story** (STORY-001)
  - File: `/stories/STORY-001-get-position-candidates.md`
  - Dependency: GET endpoint must exist before stage updates can be used effectively
  - Coordination: Both stories use the same `Application` and `InterviewStep` domain models

### Traceability to Business Goals

| Business Goal | How This Story Addresses It |
|---|---|
| **Reduce recruiter overhead by 50%** | AC: Endpoint enables 1-click stage updates instead of spreadsheet edits; estimated 2h/week savings |
| **Improve hiring pipeline visibility** | AC: Audit logging (timestamps, user ID) enables compliance audits; real-time stage updates keep data fresh |
| **Enable interview automation workflows** | AC: API contract designed for integration with interview scheduling tools (future) |

### Assumptions & Constraints Inherited from Analysis

| Assumption | Impact | Validation Plan |
|---|---|---|
| Recruiters need to move candidates between stages ~5 times per candidate | API design supports single stage transitions; batching candidates is future scope | Monitor metrics post-launch: track average stage updates per candidate per day |
| Interview flows do not change frequently mid-hiring | We validate that `interviewStepId` exists in the position's flow at request time; no caching of flows | If assumption breaks, add flow versioning to handle mid-flight changes |
| Audit logs are required for compliance | Mandatory audit logging adds 5-10ms latency per update; acceptable given 200ms SLO | Legal confirms audit log retention requirements (30/90/365 days) |
| Stage transitions are always forward (no rollback) | Reversions handled by new application flow, not stage updates | Monitor if recruiters request rollback feature; escalate if >10% of updates |

### How to Keep This Story Synced as Analysis Evolves

- **If discovery reveals stage reversals are common**: Create follow-up story for rollback support; update AC to allow reverting to any previous stage (with approval workflow)
- **If audit requirements change**: Update logging format or retention policy; update Implementation Notes
- **If interview flows become dynamic**: Add versioning to `InterviewFlow`; update schema and validation logic
- **Before each sprint**: Review business goal progress (are recruiters seeing 2h/week savings?); adjust story scope if findings diverge

---

## 📋 Definition of Ready (DoR)

**The story is ready for implementation when:**

- [ ] Narrative is clear: recruiters understand the problem (manual stage updates) and solution (API endpoint)
- [ ] Acceptance criteria are testable and specific (HTTP status codes, error messages, response payloads defined)
- [ ] Technical scope is bounded: clear which files change (controller, service, route, middleware)
- [ ] Data model is finalized: no schema changes needed; uses existing `Application.currentInterviewStep`
- [ ] Dependencies are identified: STORY-001 (GET endpoint) must be deployed first; auth middleware must exist
- [ ] Analysis linkage is present: justification from business case, discovery findings, and OKRs documented
- [ ] Non-functional requirements are explicit: performance (<200ms), security (role-based access), observability (audit logging)
- [ ] Rollout plan is documented: standard deployment with feature flag optional
- [ ] API contract is finalized: request/response payloads, all error responses defined
- [ ] No open questions remain: implementation team can start coding without further clarification

---

## ✨ Definition of Done (DoD)

**The story is complete when:**

- [ ] All acceptance criteria are verified passing (manual or automated testing)
- [ ] Code is implemented in `candidateStageService.ts`, `candidateController.ts`, routes, and updated
- [ ] Unit tests pass: test stage validation, auth, role-based access, error cases
- [ ] Integration tests pass: test end-to-end stage update with database transaction
- [ ] Endpoint tested with real database data: manual curl or Postman test with production-like data
- [ ] Audit logging is in place: every stage update logged with timestamp, user, old/new stage
- [ ] Error handling is complete: all 400, 403, 404, 500 responses tested
- [ ] Documentation is updated:
  - API reference added to `docs/API-REFERENCE.md` with examples
  - Deployment runbook updated if feature flag is used
- [ ] Code is reviewed and merged to main
- [ ] Analysis-linked assumptions are verified in implementation:
  - Audit log format matches compliance requirements
  - Performance target (<200ms) is met in staging
  - Role-based access control prevents unauthorized updates
- [ ] Story is linked to merged PR(s)

---

## 🚀 Rollout & Rollback Plan

### Feature Flag

- **Flag name**: `FEATURE_CANDIDATE_STAGE_UPDATE` (default: `false` in development, `true` in staging/production)
- **Purpose**: Allow gradual rollout; if issues arise, disable endpoint without redeploying

### Rollout Timeline

- **Day 0 - Deploy with flag OFF**: Code deployed to production, endpoint exists but returns 501 "Not Implemented" (feature disabled)
- **Day 1 - Enable for 10% of users**: Gradual rollout to monitor errors, latency, audit log volume
- **Day 2 - Enable for 50% of users**: Monitor continued
- **Day 3 - Enable for 100% of users**: Full rollout; all recruiters can use endpoint

### Monitoring During Rollout

**Key Metrics to Watch:**
- `candidate_stage_update_errors_total`: Should be <1% of requests
- `candidate_stage_update_duration_ms` (p95): Should be <200ms
- Audit log insertion latency: Should be <50ms (non-blocking)
- Invalid stage updates (400 errors): Monitor to detect bad data or API misuse

**Alerting:**
- Alert if error rate > 1%
- Alert if p95 latency > 500ms (double SLO)
- Alert if audit log insertion fails

### Rollback Procedure

**Trigger**: Error rate >5%, latency >1s, or data corruption detected

```bash
# Step 1: Disable feature flag
export FEATURE_CANDIDATE_STAGE_UPDATE=false

# Step 2: Restart application (or trigger config reload)
# Step 3: Verify endpoint returns 501
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Authorization: Bearer test-token" \
  -d '{"interviewStepId": 2}'
# Expected: HTTP 501 "Not Implemented"

# Step 4: Alert team
slack post #incidents "Rolled back STORY-002 endpoint due to [reason]"

# Step 5: Investigate
# - Check logs for errors (database, validation, auth)
# - Check audit log volume (is it blocking?)
# - Check if schema/data issues exist
```

---

## Worked Example (Test Case)

**Scenario:** Recruiter moves John Doe from "Initial Screening" (step 1) to "Technical Interview" (step 2)

**Prerequisites:**
- Position 1 (Software Engineer) exists with interview flow: Step 1 → Step 2 → Step 3
- Application ID 3 exists: John Doe applied to Position 1, currently at Step 1
- User token has `recruiter` role

**Request:**
```bash
curl -X PUT http://localhost:3010/candidates/3/stage \
  -H "Authorization: Bearer recruiter-token" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewStepId": 2,
    "notes": "Passed initial screening, scheduled for technical round next Monday"
  }'
```

**Expected Response (HTTP 200):**
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

**Audit Log Entry (background):**
```json
{
  "id": 42,
  "action": "STAGE_UPDATE",
  "userId": 5,
  "applicationId": 3,
  "oldStageId": 1,
  "newStageId": 2,
  "timestamp": "2026-05-01T14:35:00.000Z",
  "details": {
    "notes": "Passed initial screening, scheduled for technical round next Monday"
  }
}
```

---
