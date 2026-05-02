# Backend Implementation Plan: Update Candidate Stage Endpoint

## Overview
This document provides a detailed implementation plan for the `PUT /candidates/:id/stage` endpoint that updates the current interview stage for all applications of a candidate across all positions.

## Context
Based on the existing codebase patterns and backend standards, this implementation follows:
- **DDD Layered Architecture**: Domain models (with Prisma persistence), Application services, Presentation controllers
- **Existing Patterns**: Direct Prisma instantiation in domain models, `save()` and `findOne()` static methods
- **Validation**: Custom validator module with regex patterns
- **Error Handling**: HTTP status code mapping (200, 400, 404, 500)
- **TypeScript**: Strict typing (note: current codebase uses `any` extensively, but standards require avoiding it)

## API Specification

### Endpoint
```
PUT /candidates/:id/stage
Content-Type: application/json
```

### Request
**Path Parameters:**
- `id` (number): Candidate ID

**Request Body:**
```json
{
  "currentInterviewStep": number
}
```

### Response
**Success (200 OK):**
```json
{
  "message": "Stage updated successfully",
  "updatedApplications": number
}
```

**Error Responses:**
- `400 Bad Request`: Invalid candidate ID format, invalid interview step ID, candidate has no applications
- `404 Not Found`: Candidate not found, interview step not found
- `500 Internal Server Error`: Unexpected server errors

## Implementation Details

### 1. API Specification Update
**File:** `backend/api-spec.yaml`

Add the following endpoint definition:

```yaml
/candidates/{id}/stage:
  put:
    summary: Update candidate's current interview stage across all applications
    description: Updates the current interview step for all applications of a specified candidate
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
          description: Candidate ID
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - currentInterviewStep
            properties:
              currentInterviewStep:
                type: integer
                description: ID of the new interview step
    responses:
      '200':
        description: Stage updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                updatedApplications:
                  type: integer
      '400':
        description: Invalid request (bad ID format, invalid step ID, no applications)
      '404':
        description: Candidate or interview step not found
      '500':
        description: Internal server error
```

### 2. Service Layer Implementation
**File:** `backend/src/application/services/candidateService.ts`

**Important Note:** The existing codebase directly uses Prisma in services (violating DDD repository pattern per standards). This implementation follows the existing pattern for consistency.

```typescript
import { Candidate } from '../../domain/models/Candidate';
import { InterviewStep } from '../../domain/models/InterviewStep';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Updates the current interview stage for all applications of a candidate
 * @param candidateId - The ID of the candidate
 * @param currentInterviewStep - The new interview step ID
 * @returns The number of applications updated
 */
export const updateCandidateStage = async (
  candidateId: number,
  currentInterviewStep: number
): Promise<number> => {
  // Validate interview step exists
  const step = await InterviewStep.findOne(currentInterviewStep);
  if (!step) {
    throw new Error('Interview step not found');
  }

  // Find candidate
  const candidate = await Candidate.findOne(candidateId);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  // Check if candidate has applications
  const applicationsCount = await prisma.application.count({
    where: { candidateId: candidateId }
  });

  if (applicationsCount === 0) {
    throw new Error('Candidate has no applications');
  }

  // Bulk update all applications for this candidate
  const result = await prisma.application.updateMany({
    where: { candidateId: candidateId },
    data: { currentInterviewStep: currentInterviewStep }
  });

  return result.count;
};
```

**Key Design Decisions:**
- Uses `InterviewStep.findOne()` and `Candidate.findOne()` static methods (existing pattern)
- Uses `prisma.application.count()` before update to validate applications exist
- Uses `prisma.application.updateMany()` for efficient bulk update
- Throws descriptive errors for different failure scenarios

### 3. Controller Implementation
**File:** `backend/src/presentation/controllers/candidateController.ts`

```typescript
import { Request, Response } from 'express';
import { updateCandidateStage } from '../../application/services/candidateService';

/**
 * Controller for updating candidate stage
 * Handles HTTP request/response and delegates to service layer
 */
export const updateCandidateStageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse and validate candidate ID from path parameter
    const { id } = req.params;
    const candidateId = parseInt(id, 10);
    
    if (isNaN(candidateId) || candidateId <= 0) {
      res.status(400).json({ error: 'Invalid candidate ID format' });
      return;
    }

    // Parse and validate interview step from request body
    const { currentInterviewStep } = req.body;
    
    if (
      currentInterviewStep === undefined ||
      currentInterviewStep === null ||
      typeof currentInterviewStep !== 'number' ||
      currentInterviewStep <= 0
    ) {
      res.status(400).json({ error: 'currentInterviewStep is required and must be a positive number' });
      return;
    }

    // Call service layer
    const updatedCount = await updateCandidateStage(candidateId, currentInterviewStep);
    
    // Return success response
    res.json({
      message: 'Stage updated successfully',
      updatedApplications: updatedCount
    });
  } catch (error) {
    // Handle specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage === 'Candidate not found' || errorMessage === 'Interview step not found') {
      res.status(404).json({ error: errorMessage });
      return;
    }
    
    if (errorMessage === 'Candidate has no applications') {
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    // Default to internal server error
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
```

**Key Design Decisions:**
- Explicit type checking for `currentInterviewStep` (not just falsy check)
- Validates `candidateId` is positive number
- Returns `void` for Express controller pattern
- Maps domain errors to appropriate HTTP status codes
- Uses `error instanceof Error` check for type safety

### 4. Routes Update
**File:** `backend/src/routes/candidateRoutes.ts`

Add the following route:

```typescript
import { Router } from 'express';
import {
  // ... existing imports
  updateCandidateStageController
} from '../presentation/controllers/candidateController';

const router = Router();

// ... existing routes

// Update candidate stage across all applications
router.put('/:id/stage', updateCandidateStageController);

export default router;
```

**Important Note:** Ensure this route is added AFTER any more specific routes that might conflict (e.g., `/:id/applications` should come before `/:id/stage`).

### 5. Validation Enhancement (Optional but Recommended)
**File:** `backend/src/application/validator.ts`

Add validation function for consistency with existing patterns:

```typescript
/**
 * Validates update candidate stage request data
 * @param data - The request body data
 * @returns Validated data
 * @throws Error if validation fails
 */
export const validateUpdateCandidateStage = (data: unknown): { currentInterviewStep: number } => {
  if (!data || typeof data !== 'object') {
    throw new Error('Request body must be an object');
  }

  const { currentInterviewStep } = data as { currentInterviewStep?: unknown };

  if (currentInterviewStep === undefined || currentInterviewStep === null) {
    throw new Error('currentInterviewStep is required');
  }

  if (typeof currentInterviewStep !== 'number' || !Number.isInteger(currentInterviewStep)) {
    throw new Error('currentInterviewStep must be an integer');
  }

  if (currentInterviewStep <= 0) {
    throw new Error('currentInterviewStep must be a positive number');
  }

  return { currentInterviewStep };
};
```

If using this validator, update the controller to use it:

```typescript
import { validateUpdateCandidateStage } from '../../application/validator';

// In controller:
const validatedData = validateUpdateCandidateStage(req.body);
const updatedCount = await updateCandidateStage(candidateId, validatedData.currentInterviewStep);
```

## Testing Requirements

### Unit Tests
**File:** `backend/src/application/services/__tests__/candidateService.test.ts`

Test cases to implement:

1. **should_update_stage_successfully_when_valid_data_provided**
   - Mock `InterviewStep.findOne()` to return valid step
   - Mock `Candidate.findOne()` to return valid candidate
   - Mock `prisma.application.count()` to return > 0
   - Mock `prisma.application.updateMany()` to return count
   - Assert correct return value and Prisma calls

2. **should_throw_error_when_interview_step_not_found**
   - Mock `InterviewStep.findOne()` to return null
   - Assert error with message 'Interview step not found'
   - Assert `Candidate.findOne()` is not called

3. **should_throw_error_when_candidate_not_found**
   - Mock `InterviewStep.findOne()` to return valid step
   - Mock `Candidate.findOne()` to return null
   - Assert error with message 'Candidate not found'

4. **should_throw_error_when_candidate_has_no_applications**
   - Mock all lookups to succeed
   - Mock `prisma.application.count()` to return 0
   - Assert error with message 'Candidate has no applications'
   - Assert `updateMany()` is not called

5. **should_return_correct_count_when_multiple_applications_updated**
   - Mock `prisma.application.updateMany()` to return specific count
   - Assert return value matches

### Controller Tests
**File:** `backend/src/presentation/controllers/__tests__/candidateController.test.ts`

Test cases to implement:

1. **should_return_200_when_update_successful**
   - Mock service to return count
   - Assert response status 200 and correct body

2. **should_return_400_when_invalid_candidate_id_format**
   - Test with non-numeric ID, negative ID, zero
   - Assert response status 400

3. **should_return_400_when_invalid_interview_step**
   - Test with undefined, null, string, negative, zero
   - Assert response status 400

4. **should_return_404_when_candidate_not_found**
   - Mock service to throw 'Candidate not found' error
   - Assert response status 404

5. **should_return_404_when_interview_step_not_found**
   - Mock service to throw 'Interview step not found' error
   - Assert response status 404

6. **should_return_400_when_candidate_has_no_applications**
   - Mock service to throw 'Candidate has no applications' error
   - Assert response status 400

7. **should_return_500_when_unexpected_error_occurs**
   - Mock service to throw unknown error
   - Assert response status 500

### Integration Tests
**File:** `backend/__tests__/integration/update-candidate-stage.test.ts`

Test scenarios:

1. **Full flow with existing candidate and applications**
   - Create candidate with 2 applications
   - Call PUT endpoint
   - Verify both applications updated in database
   - Verify response count matches

2. **Candidate with no applications**
   - Create candidate without applications
   - Call PUT endpoint
   - Verify 400 response

3. **Non-existent interview step**
   - Create candidate with applications
   - Call PUT with invalid step ID
   - Verify 404 response

## Database Considerations

### Query Optimization
The implementation uses `updateMany()` which generates an efficient single SQL UPDATE:

```sql
UPDATE "Application"
SET "current_interview_step" = $1
WHERE "candidateId" = $2
RETURNING "id";
```

### Indexes
Ensure the following indexes exist for performance:
- `Application.candidateId` (should already exist as foreign key)
- `Application.current_interview_step` (for future queries)

### Transaction Considerations
Currently, the implementation does not use transactions. If this becomes a requirement:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Validation queries
  const step = await tx.interviewStep.findUnique({ where: { id: currentInterviewStep } });
  // ... validations
  
  // Update
  return tx.application.updateMany({
    where: { candidateId: candidateId },
    data: { currentInterviewStep: currentInterviewStep }
  });
});
```

## Error Handling Summary

| Error Condition | HTTP Status | Error Message |
|----------------|-------------|---------------|
| Invalid candidate ID format | 400 | Invalid candidate ID format |
| Invalid interview step format | 400 | currentInterviewStep is required and must be a positive number |
| Candidate not found | 404 | Candidate not found |
| Interview step not found | 404 | Interview step not found |
| Candidate has no applications | 400 | Candidate has no applications |
| Database error | 500 | Internal Server Error |
| Unexpected error | 500 | Internal Server Error |

## Business Rules

1. **Interview Step Validation**: The interview step must exist in the database before updating
2. **Candidate Validation**: The candidate must exist before updating
3. **Applications Requirement**: The candidate must have at least one application
4. **Bulk Update**: All applications for the candidate are updated, not just one
5. **No Step Flow Validation**: The implementation does NOT validate if the step belongs to a specific flow (this may be a future enhancement)

## Future Enhancements

1. **Interview Flow Validation**: Validate that the new step belongs to a valid interview flow for the candidate's positions
2. **Audit Logging**: Log stage changes with timestamp and user
3. **Event Publishing**: Publish domain events when stage changes
4. **Validation Service**: Extract validation logic to dedicated validator function
5. **Custom Error Classes**: Implement custom error classes per backend standards (e.g., `NotFoundError`, `ValidationError`)
6. **Repository Pattern**: Implement proper repository pattern with interfaces (currently violates DDD per standards)
7. **Dependency Injection**: Inject Prisma client instead of direct instantiation

## Dependencies

### Existing (No new dependencies required)
- `Candidate` domain model with `findOne()` method
- `InterviewStep` domain model with `findOne()` method
- `PrismaClient` from `@prisma/client`
- Express.js for HTTP handling

### Files to Create/Modify
1. **Modify**: `backend/api-spec.yaml` - Add endpoint specification
2. **Modify**: `backend/src/application/services/candidateService.ts` - Add `updateCandidateStage` function
3. **Modify**: `backend/src/presentation/controllers/candidateController.ts` - Add `updateCandidateStageController` function
4. **Modify**: `backend/src/routes/candidateRoutes.ts` - Add route definition
5. **Modify**: `backend/src/application/validator.ts` (optional) - Add validation function
6. **Create**: `backend/src/application/services/__tests__/candidateService.test.ts` - Add service tests (if not exists)
7. **Create**: `backend/src/presentation/controllers/__tests__/candidateController.test.ts` - Add controller tests (if not exists)

## Implementation Order

1. Update API specification (`api-spec.yaml`)
2. Implement service layer function (`candidateService.ts`)
3. Implement controller function (`candidateController.ts`)
4. Add route definition (`candidateRoutes.ts`)
5. Add optional validator function (`validator.ts`)
6. Write unit tests for service layer
7. Write unit tests for controller layer
8. Write integration tests
9. Run tests and verify 90% coverage
10. Test manually with Postman/curl

## Important Notes for AI Agent

1. **Follow Existing Patterns**: The codebase directly instantiates `PrismaClient` in domain models and services. Do NOT refactor to repository pattern unless explicitly requested.

2. **Type Safety**: While the existing codebase uses `any` extensively, the backend standards require avoiding it. Use explicit types where possible.

3. **Error Handling**: Use descriptive error messages that can be caught and mapped to HTTP status codes in the controller.

4. **Validation**: Always validate input at the controller level before calling services. Consider using the validator module for consistency.

5. **Testing**: Follow the AAA pattern (Arrange-Act-Assert) and achieve 90% coverage as per backend standards.

6. **Route Order**: Ensure the new route is added after more specific routes to avoid routing conflicts.

7. **No Implementation Yet**: This is a planning document only. The AI coding agent will implement based on this plan.
