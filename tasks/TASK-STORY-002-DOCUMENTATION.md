# Tasks for STORY-002: Update Candidate Interview Stage

**Discipline**: Documentation  
**Total Tasks**: 1  
**Coverage**: API reference, deployment runbook, troubleshooting guide

---

## TASK-STORY-002-DOCUMENTATION-001

**Title**: Create comprehensive documentation for stage update endpoint

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: Documentation

**Depends On**: TASK-STORY-002-API-001 (API contract), TASK-STORY-002-DEVOPS-001 (deployment runbook), TASK-STORY-002-OBSERVABILITY-001 (debugging guide)

**Blocks**: None (documentation is final step before team handoff)

---

### Purpose & Scope

**Purpose**
Create comprehensive documentation for the PUT /candidates/:applicationId/stage endpoint. Enables frontend developers, QA, ops, and support teams to understand, integrate, deploy, and troubleshoot the feature.

Fulfills story's DoD: "Documentation is updated: API reference added to `docs/API-REFERENCE.md` with examples, Deployment runbook updated if feature flag is used"

**Scope of Change**
- Create: Endpoint documentation in `backend/docs/API-REFERENCE.md` with curl examples
- Create: Integration guide for frontend developers (how to call endpoint from React)
- Create: Deployment runbook with rollout steps and rollback (consolidated from DevOps task)
- Create: Troubleshooting guide (common errors and solutions)
- Create: Release notes entry for this feature
- Update: Main README.md with reference to new feature
- Generate: Postman collection (from OpenAPI spec) for manual testing

**Where**
- API reference: `backend/docs/API-REFERENCE.md` (update existing)
- Integration guide: `backend/docs/INTEGRATION-GUIDE.md` (new)
- Deployment runbook: `backend/docs/DEPLOYMENT-RUNBOOK.md` (from DevOps task)
- Troubleshooting: `backend/docs/TROUBLESHOOTING.md` (extend or create new)
- Release notes: `RELEASE-NOTES.md` (root level, new section for v1.1.0)
- README: `backend/README.md` (update feature list)
- Postman: `backend/docs/postman-collection.json` (from OpenAPI)

**Why**
Per team handoff: Without documentation, developers waste time asking questions, ops struggles with deployments, and support has no troubleshooting guide. Documentation is critical for knowledge transfer and operational excellence.

Per CLAUDE.md: "Always document changes that affect other teams or systems."

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Update API reference** (`backend/docs/API-REFERENCE.md`):
   ```markdown
   ## Update Candidate Interview Stage
   
   Move a candidate to the next interview stage.
   
   ### Endpoint
   
   ```
   PUT /candidates/:applicationId/stage
   ```
   
   ### Authentication
   
   Requires Bearer token with `recruiter` or `hiring_manager` role.
   
   ### URL Parameters
   
   | Parameter | Type | Required | Description |
   |-----------|------|----------|-------------|
   | applicationId | integer | Yes | ID of the application to update |
   
   ### Request Body
   
   ```json
   {
     "interviewStepId": 2,
     "notes": "Passed technical round, scheduled manager interview"
   }
   ```
   
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
   
   #### 400 Bad Request
   
   Returned when input validation fails (invalid integers, stage not in flow, etc.)
   
   ```json
   {
     "error": "Invalid interview step ID",
     "statusCode": 400,
     "message": "Step 99 is not part of the interview flow for position 1"
   }
   ```
   
   **Common causes:**
   - `applicationId` is not a positive integer
   - `interviewStepId` is not a positive integer
   - `interviewStepId` is not in the position's interview flow
   
   #### 401 Unauthorized
   
   Returned when JWT token is missing or invalid.
   
   ```json
   {
     "error": "Unauthorized",
     "statusCode": 401,
     "message": "Missing or invalid Authorization header"
   }
   ```
   
   **Solution:** Include valid JWT token in Authorization header: `Authorization: Bearer <token>`
   
   #### 403 Forbidden
   
   Returned when user role is not recruiter or hiring_manager.
   
   ```json
   {
     "error": "Forbidden",
     "statusCode": 403,
     "message": "User role does not have permission to update candidate stages"
   }
   ```
   
   **Solution:** Use token with recruiter or hiring_manager role.
   
   #### 404 Not Found
   
   Returned when application does not exist.
   
   ```json
   {
     "error": "Application not found",
     "statusCode": 404,
     "message": "Application with ID 9999 not found"
   }
   ```
   
   **Solution:** Verify application ID is correct; retrieve valid ID from GET /positions/:id/candidates.
   
   ### Examples
   
   #### curl: Successful update
   
   ```bash
   curl -X PUT http://localhost:3010/candidates/3/stage \
     -H "Authorization: Bearer eyJhbGc..." \
     -H "Content-Type: application/json" \
     -d '{
       "interviewStepId": 2,
       "notes": "Passed screening"
     }'
   ```
   
   **Response:**
   ```
   HTTP 200 OK
   {
     "applicationId": 3,
     "candidateId": 1,
     "positionId": 1,
     "currentInterviewStep": { "stepId": 2, "stepName": "Technical Interview", ... }
   }
   ```
   
   #### curl: Missing authorization
   
   ```bash
   curl -X PUT http://localhost:3010/candidates/3/stage \
     -H "Content-Type: application/json" \
     -d '{"interviewStepId": 2}'
   ```
   
   **Response:**
   ```
   HTTP 401 Unauthorized
   {
     "error": "Unauthorized",
     "message": "Missing or invalid Authorization header"
   }
   ```
   
   #### curl: Stage not in flow
   
   ```bash
   curl -X PUT http://localhost:3010/candidates/3/stage \
     -H "Authorization: Bearer eyJhbGc..." \
     -H "Content-Type: application/json" \
     -d '{"interviewStepId": 999}'
   ```
   
   **Response:**
   ```
   HTTP 400 Bad Request
   {
     "error": "Invalid interview step ID",
     "message": "Step 999 is not part of the interview flow for position 1"
   }
   ```
   ```

2. **Create integration guide for frontend**:
   ```markdown
   # Integration Guide: Update Candidate Stage (Frontend)
   
   ## Overview
   
   This guide explains how to integrate the PUT /candidates/:applicationId/stage endpoint into your React frontend.
   
   ## API Service
   
   Create a service in `frontend/src/services/candidateService.ts`:
   
   ```typescript
   export const updateCandidateStage = async (
     applicationId: number,
     interviewStepId: number,
     notes?: string
   ): Promise<Application> => {
     const response = await fetch(
       `http://localhost:3010/candidates/${applicationId}/stage`,
       {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${getAuthToken()}`
         },
         body: JSON.stringify({ interviewStepId, notes })
       }
     );
     
     if (!response.ok) {
       const error = await response.json();
       throw new Error(error.message);
     }
     
     return response.json();
   };
   ```
   
   ## React Component
   
   Example component for updating a candidate's stage:
   
   ```typescript
   import React, { useState } from 'react';
   import { updateCandidateStage } from '../services/candidateService';
   
   interface StageUpdateProps {
     applicationId: number;
     currentStepId: number;
     availableSteps: InterviewStep[];
     onSuccess: (updated: Application) => void;
   }
   
   export const StageUpdateForm: React.FC<StageUpdateProps> = ({
     applicationId,
     currentStepId,
     availableSteps,
     onSuccess
   }) => {
     const [selectedStep, setSelectedStep] = useState<number>(currentStepId);
     const [notes, setNotes] = useState('');
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     
     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       setLoading(true);
       setError(null);
       
       try {
         const updated = await updateCandidateStage(
           applicationId,
           selectedStep,
           notes || undefined
         );
         onSuccess(updated);
       } catch (err: any) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };
     
     return (
       <form onSubmit={handleSubmit}>
         <select
           value={selectedStep}
           onChange={(e) => setSelectedStep(Number(e.target.value))}
           disabled={loading}
         >
           {availableSteps.map((step) => (
             <option key={step.id} value={step.id}>
               {step.stepName}
             </option>
           ))}
         </select>
         
         <textarea
           placeholder="Optional notes..."
           value={notes}
           onChange={(e) => setNotes(e.target.value)}
           disabled={loading}
         />
         
         <button type="submit" disabled={loading}>
           {loading ? 'Updating...' : 'Update Stage'}
         </button>
         
         {error && <div className="alert alert-danger">{error}</div>}
       </form>
     );
   };
   ```
   
   ## Error Handling
   
   Always handle these error cases:
   
   | Error | HTTP | Action |
   |-------|------|--------|
   | Application not found | 404 | Show: "Application not found. Please try again." |
   | Invalid stage | 400 | Show: "Selected stage is not valid for this position." |
   | Unauthorized | 401 | Redirect to login or refresh token |
   | Forbidden | 403 | Show: "You don't have permission to update stages." |
   | Server error | 500 | Show: "An error occurred. Please try again later." |
   
   ## Testing
   
   Test with Postman collection:
   
   1. Import `backend/docs/postman-collection.json` into Postman
   2. Set environment variable: `api_token` to valid JWT
   3. Run request: "Update Candidate Stage - Success"
   4. Verify response: HTTP 200 with updated application
   
   ## Best Practices
   
   - Always include Authorization header (Bearer token)
   - Validate applicationId and interviewStepId before sending
   - Show loading state while request is in progress
   - Display error message if request fails
   - Refresh candidate data after successful update
   ```

3. **Create troubleshooting guide**:
   ```markdown
   # Troubleshooting: Candidate Stage Update Endpoint
   
   ## Problem: HTTP 404 Application Not Found
   
   **Error Message:**
   ```
   {
     "error": "Application not found",
     "message": "Application with ID 9999 not found"
   }
   ```
   
   **Cause:** Application ID doesn't exist in database.
   
   **Debug Steps:**
   1. Verify applicationId is correct
   2. Query database: `SELECT * FROM "Application" WHERE id = ?`
   3. Check if application was deleted
   
   **Solution:**
   - Use correct applicationId (retrieve from GET /positions/:id/candidates)
   - If application was deleted, create new application for candidate
   
   ## Problem: HTTP 400 Interview Step Not Valid
   
   **Error Message:**
   ```
   {
     "error": "Invalid interview step ID",
     "message": "Step 99 is not part of the interview flow for position 1"
   }
   ```
   
   **Cause:** interviewStepId is not in the position's interview flow.
   
   **Debug Steps:**
   1. Get position's interview flow: `SELECT * FROM "InterviewFlow" WHERE position_id = ?`
   2. List valid steps: `SELECT * FROM "InterviewStep" WHERE flow_id = ?`
   3. Verify interviewStepId is in the list
   
   **Solution:**
   - Use valid step ID from the position's interview flow
   - Example valid steps for Position 1: [1, 2, 3] (Initial Screening, Technical, Final)
   
   ## Problem: HTTP 401 Unauthorized
   
   **Error Message:**
   ```
   {
     "error": "Unauthorized",
     "message": "Missing or invalid Authorization header"
   }
   ```
   
   **Cause:** JWT token missing or invalid.
   
   **Debug Steps:**
   1. Check request headers: Is "Authorization: Bearer <token>" present?
   2. Verify token format: Starts with "Bearer " (note space)
   3. Check token validity: Decode at jwt.io (not in production!)
   4. Verify token not expired: Check "exp" claim
   
   **Solution:**
   - Include Authorization header: `Authorization: Bearer <valid-jwt-token>`
   - If token expired, refresh via login endpoint
   
   ## Problem: HTTP 403 Forbidden
   
   **Error Message:**
   ```
   {
     "error": "Forbidden",
     "message": "User role does not have permission to update candidate stages"
   }
   ```
   
   **Cause:** User role is not recruiter or hiring_manager.
   
   **Debug Steps:**
   1. Decode JWT token: `jq -R 'split(".")[1] | @base64d' <<< <token>`
   2. Check "role" claim: Should be "recruiter" or "hiring_manager"
   3. Verify user's role in database
   
   **Solution:**
   - Use JWT token with recruiter or hiring_manager role
   - If user's role is incorrect, update in database or create new token
   
   ## Problem: Slow Performance (>500ms)
   
   **Observed:** Stage update request takes >500ms to complete.
   
   **Debug Steps:**
   1. Check database performance:
      ```sql
      SELECT * FROM pg_stat_statements 
      WHERE query LIKE '%Application%' 
      ORDER BY total_time DESC LIMIT 10;
      ```
   2. Verify indexes exist:
      ```sql
      SELECT * FROM pg_indexes WHERE tablename = 'Application';
      ```
   3. Check audit log insertion:
      ```sql
      SELECT COUNT(*) FROM "AuditLog";
      ```
   4. Monitor application logs for slow queries
   
   **Solution:**
   - Create missing indexes (run migrations)
   - Optimize slow queries
   - Check database connection pool size
   
   ## Problem: Audit Log Not Created
   
   **Observed:** Stage update succeeds, but no audit log entry exists.
   
   **Debug Steps:**
   1. Verify AuditLog table exists:
      ```sql
      SELECT * FROM information_schema.tables WHERE table_name = 'AuditLog';
      ```
   2. Check application logs for audit insertion errors
   3. Verify database connection is working
   
   **Solution:**
   - Run database migration to create AuditLog table:
      ```bash
      npx prisma migrate dev
      ```
   - Check application logs for errors during audit log insertion
   
   ## Need More Help?
   
   - Check application logs: `/var/log/app.log` or `docker logs <container-id>`
   - Check database logs: `SELECT * FROM pg_log LIMIT 20;`
   - Ask in #support Slack channel with error message and timestamp
   ```

4. **Create release notes entry**:
   ```markdown
   # Release Notes v1.1.0 (May 1, 2026)
   
   ## New Features
   
   ### Candidate Stage Update Endpoint (STORY-002)
   
   **What's New:**
   Recruiters can now update candidate interview stages with a single API call. No more manual database updates or workarounds.
   
   **Endpoint:**
   ```
   PUT /candidates/:applicationId/stage
   ```
   
   **Request:**
   ```json
   {
     "interviewStepId": 2,
     "notes": "Passed technical round"
   }
   ```
   
   **Response:**
   ```json
   {
     "applicationId": 3,
     "candidateId": 1,
     "currentInterviewStep": { "stepId": 2, "stepName": "Technical Interview" }
   }
   ```
   
   **Requirements:**
   - JWT authentication (Bearer token)
   - recruiter or hiring_manager role
   - Valid applicationId and interviewStepId
   
   **Breaking Changes:** None
   
   **Migration Notes:**
   - New AuditLog table created (tracks all stage changes)
   - No changes to existing tables or endpoints
   - Existing applications unaffected
   
   **For More Details:**
   - [API Reference](docs/API-REFERENCE.md)
   - [Integration Guide](docs/INTEGRATION-GUIDE.md)
   - [Deployment Runbook](docs/DEPLOYMENT-RUNBOOK.md)
   ```

5. **Update main README**:
   ```markdown
   ## Features
   
   - ✅ Candidate management (create, view, update)
   - ✅ Position and interview flow tracking
   - ✅ **NEW**: Candidate stage updates (move through interview pipeline)
   - ✅ Audit logging (compliance and debugging)
   - ✅ Role-based access control (recruiter, hiring_manager)
   ```

6. **Generate Postman collection** (from OpenAPI spec):
   ```bash
   npm install -g openapi-to-postman
   openapi2postmanv2 -s backend/docs/openapi.yaml -o backend/docs/postman-collection.json
   ```

**Inputs / Outputs / Contracts**

**Documentation Files:**
```
backend/docs/API-REFERENCE.md          (update with new endpoint)
backend/docs/INTEGRATION-GUIDE.md      (new file: frontend integration)
backend/docs/TROUBLESHOOTING.md        (new or extended file)
backend/docs/DEPLOYMENT-RUNBOOK.md     (from DevOps task)
RELEASE-NOTES.md                       (root level, new section)
backend/README.md                      (update feature list)
backend/docs/postman-collection.json   (generated from OpenAPI)
```

**Documentation Quality Checklist:**
```
✓ All error codes documented with examples
✓ All HTTP methods and paths listed
✓ Request and response payloads shown with examples
✓ Frontend integration code provided (TypeScript/React)
✓ Troubleshooting guide covers top 5 common issues
✓ Deployment runbook includes rollout and rollback steps
✓ Postman collection importable and executable
✓ Release notes include what's new, breaking changes, migration notes
✓ No typos or dead links
✓ All documentation reviewed and approved
```

**Dependencies**
- OpenAPI specification (from TASK-API-001)
- Deployment details (from TASK-DEVOPS-001)
- Error codes and troubleshooting (from implementation experience)
- Frontend integration patterns (standard React practices)

---

### Acceptance Criteria

- [ ] API reference updated with PUT /candidates/:applicationId/stage endpoint
- [ ] All HTTP status codes and error responses documented
- [ ] curl examples provided for happy path and error cases
- [ ] Frontend integration guide created with TypeScript/React code
- [ ] Error handling guide provided (401, 403, 400, 404, 500)
- [ ] Troubleshooting guide created with top common issues
- [ ] Deployment runbook includes rollout steps and rollback procedure
- [ ] Release notes created with feature description and breaking changes
- [ ] README updated with new feature in feature list
- [ ] Postman collection generated and importable
- [ ] All documentation links are valid (no 404 links)
- [ ] All code examples are syntactically correct
- [ ] Documentation reviewed and approved by team
- [ ] No typos or grammatical errors

---

### Test Requirements

**Unit Tests**
- N/A (documentation is not code)

**Integration Tests**
- N/A (documentation is not code)

**Manual Testing / Regression Scope**
- Review all documentation for clarity and accuracy
- Follow integration guide: verify code examples work in actual React component
- Test all curl examples: verify endpoints return expected responses
- Import Postman collection: verify all requests execute successfully
- Test troubleshooting steps: reproduce common errors and verify solutions work
- Verify links: all internal links point to correct files, external links are valid

---

### Non-Functional Requirements

**Clarity**
- Documentation is understandable by developers unfamiliar with the codebase
- Examples are realistic and production-ready
- Error messages are actionable (explain cause and solution)

**Completeness**
- All endpoints documented
- All error codes explained
- Integration patterns provided for main use cases

**Maintainability**
- Documentation is version-controlled in same repo as code
- Links between docs are relative (not hardcoded URLs)
- Code examples don't diverge from actual implementation

---

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Documentation becomes outdated | Update docs when endpoint behavior changes; link PR to docs changes |
| Code examples have bugs | Test all examples before publication; run linter on code blocks |
| Postman collection breaks on import | Validate JSON syntax; test import in Postman before release |
| Troubleshooting guide is incomplete | Collect feedback from QA/support; update with new issues found |
| Frontend developers can't follow integration guide | Get feedback from frontend team; refine code examples |

---

### Definition of Done

- [ ] API reference updated and reviewed
- [ ] Integration guide created with working code examples
- [ ] Troubleshooting guide covers top 5 common issues
- [ ] Deployment runbook complete with rollout and rollback
- [ ] Release notes created and reviewed
- [ ] README updated with new feature
- [ ] Postman collection generated and tested
- [ ] All documentation reviewed by team
- [ ] All links tested (no broken links)
- [ ] All code examples validated
- [ ] No typos or grammatical errors
- [ ] Documentation published and accessible
- [ ] Code merged to main branch
- [ ] Team trained on new documentation (Slack announcement)

---
