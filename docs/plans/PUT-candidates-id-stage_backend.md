# Backend Implementation Plan: PUT /candidates/:id/stage

## 1. Overview

This endpoint updates the current interview stage of a specific candidate. It allows modifying the current phase of the interview process for a candidate. The implementation follows DDD principles with clear separation between Presentation (controllers/routes), Application (services), and Domain (models) layers.

## 2. Architecture Context

### Layers Involved
- **Presentation**: Route handler + Controller
- **Application**: Service layer for business logic
- **Domain**: Prisma models (Application, InterviewStep, Candidate)

### Components/Files Referenced
- Existing patterns: `backend/src/routes/candidateRoutes.ts`, `backend/src/presentation/controllers/candidateController.ts`, `backend/src/application/services/candidateService.ts`
- New files required: `backend/src/presentation/controllers/candidateStageController.ts`, `backend/src/application/services/candidateStageService.ts`
- Prisma schema: `backend/prisma/schema.prisma`

### Data Model Relationships
- `Application` has `currentInterviewStep` FK to `InterviewStep`
- `Candidate` has many `Application` records (one per position)
- `InterviewStep` belongs to `InterviewFlow` (defines the stages)
- `Application` belongs to `Position` (which has `interviewFlowId`)

## 3. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create and switch to a new feature branch following the development workflow
- **Branch Naming**: `feature/PUT-candidates-id-stage-backend`
- **Implementation Steps**:
  1. Ensure you're on the latest `main` or `develop` branch
  2. Pull latest changes: `git pull origin develop`
  3. Create new branch: `git checkout -b feature/PUT-candidates-id-stage-backend`
  4. Verify branch creation: `git branch`
- **Notes**: This must be the FIRST step before any code changes. Refer to `docs/backend-standards.mdc` section "Development Workflow" for specific branch naming conventions and workflow rules.

### Step 1: Create CandidateStageService Method
- **File**: `backend/src/application/services/candidateStageService.ts`
- **Action**: Implement `updateCandidateStage` service method
- **Function Signature**:
  ```typescript
  export const updateCandidateStage = async (candidateId: number, newStageId: number): Promise<Application>
  ```
- **Implementation Steps**:
  1. **Validate Candidate Exists**:
     - Use `prisma.candidate.findUnique({ where: { id: candidateId } })`
     - If candidate not found, throw `new Error('Candidate not found')`
  2. **Find Candidate's Active Application**:
     - Use `prisma.application.findFirst` with:
       - `where: { candidateId }`
       - `orderBy: { applicationDate: 'desc' }` (most recent application)
     - If no application found, throw `new Error('No application found for this candidate')`
  3. **Validate New Stage Exists**:
     - Use `prisma.interviewStep.findUnique({ where: { id: newStageId } })`
     - If stage not found, throw `new Error('Interview stage not found')`
  4. **Validate InterviewFlow Consistency** (CRITICAL):
     - Get the position's `interviewFlowId` from the application
     - Verify the new stage belongs to the SAME interview flow
     - If not matching, throw `new Error('Invalid stage for this position')`
  5. **Update the Application's Stage**:
     - Use domain model: `new Application({ id: application.id, currentInterviewStep: newStageId }).save()`
     - Or use `prisma.application.update` with `where: { id: application.id }` and `data: { currentInterviewStep: newStageId }`
  6. **Return Updated Application** with related data (include position, interviewStep)
- **Dependencies**: `@prisma/client`
- **Implementation Notes**:
  - Only update the most recent application for the candidate
  - InterviewFlow consistency check is MANDATORY — prevents moving a candidate to a stage from a different interview flow
  - Use domain model pattern: `new Model(data).save()` where applicable

### Step 2: Create CandidateStageController Method
- **File**: `backend/src/presentation/controllers/candidateStageController.ts`
- **Action**: Implement `updateCandidateStage` controller
- **Function Signature**:
  ```typescript
  export const updateCandidateStage = async (req: Request, res: Response): Promise<void>
  ```
- **Implementation Steps**:
  1. **Parse and Validate ID**:
     - `const candidateId = parseInt(req.params.id)`
     - If `isNaN(candidateId)`, return `400` with `{ error: 'Invalid candidate ID format' }`
  2. **Parse and Validate Stage ID**:
     - `const newStageId = parseInt(req.body.stageId)` or `req.body.currentInterviewStep`
     - If `isNaN(newStageId)`, return `400` with `{ error: 'Invalid stage ID format' }`
  3. **Call Service**:
     - `const updatedApplication = await updateCandidateStage(candidateId, newStageId)`
  4. **Return Success** (standardized format):
     - `res.status(200).json(updatedApplication)` — return the domain model directly
  5. **Error Handling** (standardized to `{ error: string }`):
     - Catch candidate not found → `404` with `{ error: 'Candidate not found' }`
     - Catch stage not found → `400` with `{ error: 'Interview stage not found' }`
     - Catch no application → `404` with `{ error: 'No application found for this candidate' }`
     - Catch interview flow mismatch → `400` with `{ error: 'Invalid stage for this position' }`
     - Catch validation errors → `400` with `{ error: error.message }`
     - Catch generic errors → `500` with `{ error: 'Internal Server Error' }`
- **Dependencies**: `Request`, `Response` from `express`
- **Implementation Notes**: Follow existing controller patterns in `candidateController.ts`

### Step 3: Create CandidateStage Route
- **File**: `backend/src/routes/candidateStageRoutes.ts`
- **Action**: Define route for `PUT /:id/stage`
- **Function Signature**:
  ```typescript
  const router = Router();
  router.put('/:id/stage', updateCandidateStage);
  export default router;
  ```
- **Implementation Steps**:
  1. Create route file following `candidateRoutes.ts` pattern
  2. Import controller method
  3. Export router
- **Dependencies**: `Router` from `express`
- **Implementation Notes**: Route path is `/:id/stage` (candidateId is the id param)

### Step 4: Mount Route in index.ts
- **File**: `backend/src/index.ts`
- **Action**: Add candidateStageRoutes mount
- **Implementation Steps**:
  1. Add import: `import candidateStageRoutes from './routes/candidateStageRoutes';`
  2. Add mount: `app.use('/candidates', candidateStageRoutes);`
  3. Mount BEFORE candidateRoutes — more specific routes should come first in Express
- **Dependencies**: None
- **Implementation Notes**: `PUT /candidates/:id/stage` is more specific than other `/candidates/:id` routes, so it must be mounted first to avoid conflicts.

### Step 5: Write Unit Tests
- **File**: Verify test location — run `ls backend/src/__tests__/` to check existing structure before creating tests
- **Action**: Test `updateCandidateStage` service and controller
- **Service Test Cases** (in `candidateStageService.test.ts`):
  1. **Successful Cases**:
     - Successfully updates candidate stage when valid candidate and stage provided
     - Returns updated application with new stage
  2. **Not Found**:
     - Candidate does not exist → throws 'Candidate not found'
     - Interview stage does not exist → throws 'Interview stage not found'
     - No application found for candidate → throws 'No application found for this candidate'
  3. **InterviewFlow Consistency** (CRITICAL):
     - Stage from different interview flow → throws 'Invalid stage for this position'
     - Stage from correct interview flow → succeeds
  4. **Edge Cases**:
     - Candidate with multiple applications (should update most recent)
     - Candidate with no applications
  5. **Server Errors**:
     - Database connection failures
- **Controller Test Cases** (in `candidateStageController.test.ts`):
  1. **Successful Response**: Returns 200 with updated application
  2. **Invalid Candidate ID**: Returns 400
  3. **Invalid Stage ID**: Returns 400
  4. **Not Found Scenarios**: Returns appropriate 404

## 4. Implementation Order

1. Step 0: Create Feature Branch
2. Step 1: Create CandidateStageService Method
3. Step 2: Create CandidateStageController Method
4. Step 3: Create CandidateStage Route
5. Step 4: Mount Route in index.ts
6. Step 5: Write Unit Tests
7. Step 6: Update Documentation

## 5. Testing Checklist

- [ ] Valid candidate ID and stage ID updates successfully
- [ ] Invalid candidate ID returns 400
- [ ] Non-existent candidate returns 404
- [ ] Non-existent stage returns 400
- [ ] Candidate with no applications returns 404
- [ ] Stage from wrong interview flow returns 400
- [ ] `pnpm --filter backend lint` passes
- [ ] Tests pass: `pnpm --filter backend test`

## 6. Error Response Format

All error responses follow this standardized format:

```json
{
  "error": "Error message describing the issue"
}
```

| Scenario | HTTP Status |
|----------|-------------|
| Invalid candidate ID format | 400 |
| Invalid stage ID format | 400 |
| Candidate not found | 404 |
| Interview stage not found | 400 |
| No application found | 404 |
| Invalid stage for position (InterviewFlow mismatch) | 400 |
| Internal server error | 500 |

## 7. Request/Response Format

**Request Body**:
```json
{
  "stageId": 2
}
```

Or alternatively:
```json
{
  "currentInterviewStep": 2
}
```

**Success Response** (200):
```json
{
  "id": 1,
  "positionId": 1,
  "candidateId": 1,
  "applicationDate": "2024-01-15T10:00:00Z",
  "currentInterviewStep": 2,
  "notes": "Moved to technical interview",
  "position": {
    "id": 1,
    "title": "Backend Engineer",
    "interviewFlowId": 1
  },
  "interviewStep": {
    "id": 2,
    "name": "Technical Interview",
    "interviewFlowId": 1
  }
}
```

## 8. Partial Update Support

Not applicable — this is an update operation for a specific field (stage).

## 9. Dependencies

- `@prisma/client` (already in use)
- No new external libraries required

## 10. Notes

- **Language**: All code and documentation in English
- **Branch naming**: Must follow `feature/PUT-candidates-id-stage-backend`
- **Package manager**: Use `pnpm` exclusively
- **No TypeScript errors**: Run `pnpm --filter backend lint` before declaring done
- **graphify**: After implementation, run `graphify update .` to update knowledge graph
- **Domain Model Pattern**: Use `new Model(data).save()` pattern where applicable, consistent with `candidateService.ts`

## 11. Next Steps After Implementation

1. Run `pnpm --filter backend prisma:generate` if schema was touched (not needed for this change)
2. Run `pnpm --filter backend dev` to start server
3. Test endpoint: `PUT http://localhost:3010/candidates/:id/stage` with `{ "stageId": 2 }`
4. Run full test suite: `pnpm --filter backend test`
5. Verify lint passes: `pnpm --filter backend lint`

## 12. Implementation Verification

- [ ] **Code Quality**: No `any` types, proper error handling, follows existing patterns
- [ ] **Functionality**: Endpoint updates the candidate's currentInterviewStep correctly
- [ ] **InterviewFlow Validation**: Stage change is validated against position's interview flow
- [ ] **Testing**: Unit tests cover success, error, InterviewFlow consistency, and edge cases
- [ ] **Integration**: Route properly mounted and accessible at `/candidates/:id/stage`
- [ ] **Documentation**: Updated `docs/data-model.md` or other relevant docs

## 13. Critical Business Rule: InterviewFlow Consistency

A candidate applies to a Position, and each Position belongs to an InterviewFlow. The InterviewFlow contains the stages (InterviewSteps). When updating a candidate's stage:

**MUST** validate that the new stage belongs to the SAME InterviewFlow as the candidate's position.

**Why this matters**: Without this check, you could move a candidate for a "Tech Hiring" flow to a stage from a "Sales Hiring" flow entirely — breaking the integrity of the hiring pipeline.

**Validation Logic**:
```
application.position.interviewFlowId == newStage.interviewFlowId
```
