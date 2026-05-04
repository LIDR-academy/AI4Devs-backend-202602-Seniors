# Backend Implementation Plan: GET /positions/:id/candidates

## 1. Overview

This endpoint retrieves all candidates currently in process for a specific position, returning candidate details, their current interview step, and average score. The implementation follows DDD principles with clear separation between Presentation (controllers/routes), Application (services), and Domain (models) layers.

## 2. Architecture Context

### Layers Involved
- **Presentation**: Route handler + Controller
- **Application**: Service layer for business logic
- **Domain**: Domain models (`Position`, `Application`, `Candidate`, `InterviewStep`, `Interview`) — use domain methods, NOT direct Prisma client

### Components/Files Referenced
- Existing patterns: `backend/src/routes/candidateRoutes.ts`, `backend/src/presentation/controllers/candidateController.ts`, `backend/src/application/services/candidateService.ts`
- New files required: `backend/src/routes/positionRoutes.ts`, `backend/src/presentation/controllers/positionController.ts`, `backend/src/application/services/positionService.ts`
- Prisma schema: `backend/prisma/schema.prisma`

## 3. Implementation Steps

### Step 0: Create Feature Branch
- **Action**: Create and switch to a new feature branch
- **Branch Naming**: `feature/GET-positions-id-candidates-backend`
- **Implementation Steps**:
  1. Ensure you're on the latest `main` or `develop` branch
  2. Pull latest changes: `git pull origin develop`
  3. Create new branch: `git checkout -b feature/GET-positions-id-candidates-backend`
  4. Verify branch creation: `git branch`
- **Notes**: This must be the FIRST step before any code changes.

### Step 1: Create PositionService Method
- **File**: `backend/src/application/services/positionService.ts`
- **Action**: Implement `getCandidatesByPositionId` service method
- **Function Signature**:
  ```typescript
  export const getCandidatesByPositionId = async (positionId: number): Promise<PositionCandidatesResponse[]>
  ```
- **Implementation Steps**:
  1. **Validate Position Exists**:
     - Use `Position.findOne(positionId)` (domain model, not direct Prisma)
     - If position not found, throw `new Error('Position not found')`
  2. **Query Applications with Related Data**:
     - Use `Application.findMany({ where: { positionId }, include: { candidate: true, interviewStep: true, interviews: true } })` (domain model)
  3. **Calculate Average Score per Candidate**:
     - For each application, iterate through `interviews`
     - Filter out null scores: `const scores = interviews.map(i => i.score).filter((s): s is number => s !== null)`
     - Calculate `averageScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null`
     - Handle edge case: if no interviews or no valid scores, return `null`
  4. **Map to Response DTO**:
     - Build `PositionCandidatesResponse[]` with:
       - `candidateId`, `fullName` (from `candidate.firstName + ' ' + candidate.lastName`)
       - `currentInterviewStep` (from `application.currentInterviewStep` or `interviewStep.name`)
       - `averageScore` (calculated)
- **Dependencies**: Domain models (`Position`, `Application`, `Candidate`, `InterviewStep`, `Interview`)
- **Implementation Notes**:
  - Use Prisma's aggregation or raw query if performance is a concern
  - Ensure proper type definitions for the response

### Step 2: Create PositionController Method
- **File**: `backend/src/presentation/controllers/positionController.ts`
- **Action**: Implement `getCandidatesByPositionId` controller
- **Function Signature**:
  ```typescript
  export const getCandidatesByPositionId = async (req: Request, res: Response): Promise<void>
  ```
- **Implementation Steps**:
  1. **Parse and Validate ID**:
     - `const positionId = parseInt(req.params.id)`
     - If `isNaN(positionId)`, return `400` with `{ error: 'Invalid ID format' }`
  2. **Call Service**:
     - `const candidates = await getCandidatesByPositionId(positionId)`
  3. **Return Success**:
     - `res.status(200).json(candidates)`
  4. **Error Handling**:
     - Catch position not found → `404` with `{ message: 'Position not found' }`
     - Catch validation errors → `400` with `{ message: error.message }`
     - Catch generic errors → `500` with `{ message: 'Internal Server Error' }`
- **Dependencies**: `Request`, `Response` from `express`
- **Implementation Notes**: Follow existing controller patterns in `candidateController.ts`

### Step 3: Create PositionRoutes
- **File**: `backend/src/routes/positionRoutes.ts`
- **Action**: Define route for `GET /:id/candidates`
- **Function Signature**:
  ```typescript
  const router = Router();
  router.get('/:id/candidates', getCandidatesByPositionId);
  export default router;
  ```
- **Implementation Steps**:
  1. Create route file following `candidateRoutes.ts` pattern
  2. Import controller method
  3. Export router
- **Dependencies**: `Router` from `express`
- **Implementation Notes**: Route path is `/:id/candidates` (positionId is the id param)

### Step 4: Mount Route in index.ts
- **File**: `backend/src/index.ts`
- **Action**: Add positionRoutes mount
- **Implementation Steps**:
  1. Add import: `import positionRoutes from './routes/positionRoutes';`
  2. Add mount: `app.use('/positions', positionRoutes);`
  3. Place after candidateRoutes mount
- **Dependencies**: None
- **Implementation Notes**: Ensure route mounting order doesn't conflict with other routes

### Step 5: Write Unit Tests
- **File**: `backend/src/__tests__/unit/positionService.test.ts` (or alongside source)
- **Action**: Test `getCandidatesByPositionId` service
- **Test Cases**:
  1. **Successful Cases**:
     - Returns list of candidates with fullName, currentInterviewStep, averageScore
     - Handles multiple interviews with different scores
     - Handles single interview
  2. **Validation Errors**:
     - Invalid position ID format
  3. **Not Found**:
     - Position does not exist → throw error caught by controller
  4. **Edge Cases**:
     - No candidates for position → return empty array
     - Candidate with no interviews → averageScore is null
     - Candidate with interviews but no scores (all null) → averageScore is null
     - **CRITICAL**: Test that null scores do NOT produce NaN in response

### Step 6: Update Documentation
- **Action**: Review and update technical documentation
- **Implementation Steps**:
  1. **API Spec**: If `docs/api-spec.yml` exists, add endpoint documentation
  2. **Data Model**: If there are new relationships, update `docs/data-model.md`
  3. **Backend Standards**: If new patterns established, document in relevant standards file
- **References**: Follow process in `docs/documentation-standards.mdc` if exists
- **Notes**: This step is MANDATORY before considering implementation complete

## 4. Implementation Order

1. Step 0: Create Feature Branch
2. Step 1: Create PositionService Method
3. Step 2: Create PositionController Method
4. Step 3: Create PositionRoutes
5. Step 4: Mount Route in index.ts
6. Step 5: Write Unit Tests
7. Step 6: Update Documentation

## 5. Testing Checklist

- [ ] Position with candidates returns correct data structure
- [ ] Empty position returns empty array
- [ ] Non-existent position returns 404
- [ ] Invalid ID returns 400
- [ ] Average score calculation is correct
- [ ] Full name is properly concatenated
- [ ] **Null scores do NOT produce NaN** (critical edge case)
- [ ] `pnpm --filter backend lint` passes
- [ ] Tests pass: `pnpm --filter backend test`

## 6. Error Response Format

```json
{
  "message": "Error message describing the issue"
}
```

| Scenario | HTTP Status |
|----------|-------------|
| Invalid ID format | 400 |
| Position not found | 404 |
| Internal server error | 500 |

## 7. Response Format

```typescript
interface PositionCandidatesResponse {
  candidateId: number;
  fullName: string;       // "firstName lastName"
  currentInterviewStep: string;
  averageScore: number | null;
}
```

**Example Response**:
```json
[
  {
    "candidateId": 1,
    "fullName": "John Doe",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 85.5
  }
]
```

## 8. Partial Update Support

Not applicable — this is a read-only GET endpoint.

## 9. Dependencies

- `@prisma/client` (already in use)
- No new external libraries required

## 10. Notes

- **Language**: All code and documentation in English
- **Branch naming**: Must follow `feature/GET-positions-id-candidates-backend`
- **Package manager**: Use `pnpm` exclusively
- **No TypeScript errors**: Run `pnpm --filter backend lint` before declaring done
- **graphify**: After implementation, run `graphify update .` to update knowledge graph

## 11. Next Steps After Implementation

1. Run `pnpm --filter backend prisma:generate` if schema was touched
2. Run `pnpm --filter backend dev` to start server
3. Test endpoint: `GET http://localhost:3010/positions/:id/candidates`
4. Run full test suite: `pnpm --filter backend test`
5. Verify lint passes: `pnpm --filter backend lint`

## 12. Implementation Verification

- [ ] **Code Quality**: No `any` types, proper error handling, follows existing patterns
- [ ] **Functionality**: Endpoint returns correct data structure with all required fields
- [ ] **Testing**: Unit tests cover success, error, and edge cases
- [ ] **Integration**: Route properly mounted and accessible at `/positions/:id/candidates`
- [ ] **Documentation**: Updated `docs/data-model.md` or other relevant docs