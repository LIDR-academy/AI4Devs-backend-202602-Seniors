# Backend Implementation Plan: GET /positions/:id/candidates Endpoint

## Overview
This document provides a detailed implementation plan for the `GET /positions/:id/candidates` endpoint that retrieves all candidates who have applied to a specific position, including their average interview scores.

## Context
Based on the existing codebase patterns and backend standards, this implementation follows:
- **DDD Layered Architecture**: Domain models (with Prisma persistence), Application services, Presentation controllers
- **Existing Patterns**: Direct Prisma instantiation in services, controller → service → domain model pattern
- **Error Handling**: HTTP status code mapping (200, 400, 404, 500)
- **TypeScript**: Strict typing where possible (note: existing codebase uses `any` extensively)

## Database Schema Reference
The implementation relies on the following Prisma schema relationships:
- `Position` has many `Application`
- `Application` belongs to `Candidate`, `Position`, and `InterviewStep`
- `Application` has many `Interview`
- `Interview` has nullable `score` field (Int?)
- `Application.currentInterviewStep` is a required FK to `InterviewStep` (but can be null in practice based on schema)

## Implementation Steps (in order)

### 1. Update API Specification
**File:** `backend/api-spec.yaml`

**Action:** Add the following endpoint definition at the end of the paths section:

```yaml
  /positions/{id}/candidates:
    get:
      summary: Get all candidates for a position with average interview scores
      description: Retrieves all candidates who have applied to a specific position, including their average interview score calculated from all interviews
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            description: Position ID
      responses:
        '200':
          description: List of candidates with average scores
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    candidateId:
                      type: integer
                      description: Candidate unique identifier
                    firstName:
                      type: string
                      description: Candidate first name
                    lastName:
                      type: string
                      description: Candidate last name
                    email:
                      type: string
                      format: email
                      description: Candidate email address
                    applicationDate:
                      type: string
                      format: date-time
                      description: Date when candidate applied to this position
                    currentInterviewStep:
                      type: object
                      description: Current interview step for this application
                      properties:
                        id:
                          type: integer
                        name:
                          type: string
                      nullable: true
                    averageScore:
                      type: number
                      description: Average score across all interviews (null if no scores)
                      nullable: true
        '400':
          description: Invalid position ID format
        '404':
          description: Position not found
        '500':
          description: Internal server error
```

---

### 2. Implement Service Layer
**File:** `backend/src/application/services/positionService.ts` (CREATE NEW FILE)

**Content:**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Interface for candidate data returned by the endpoint
 */
export interface PositionCandidate {
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  applicationDate: string;
  currentInterviewStep: {
    id: number;
    name: string;
  } | null;
  averageScore: number | null;
}

/**
 * Retrieves all candidates for a specific position with their average interview scores
 * @param positionId - The ID of the position
 * @returns Array of candidates with their application data and average scores
 * @throws Error when position is not found
 */
export const getCandidatesForPosition = async (
  positionId: number
): Promise<PositionCandidate[]> => {
  // Validate position exists
  const position = await prisma.position.findUnique({
    where: { id: positionId }
  });

  if (!position) {
    throw new Error('Position not found');
  }

  // Fetch applications with candidate and interview data
  const applications = await prisma.application.findMany({
    where: { positionId: positionId },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      interviewStep: {
        select: {
          id: true,
          name: true
        }
      },
      interviews: {
        select: {
          score: true
        }
      }
    },
    orderBy: {
      applicationDate: 'desc'
    }
  });

  // Transform data and calculate average scores
  const candidates: PositionCandidate[] = applications.map(app => {
    // Filter out null scores and calculate average
    const scores = app.interviews
      .filter(interview => interview.score !== null)
      .map(interview => interview.score as number);

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

    return {
      candidateId: app.candidate.id,
      firstName: app.candidate.firstName,
      lastName: app.candidate.lastName,
      email: app.candidate.email,
      applicationDate: app.applicationDate.toISOString(),
      currentInterviewStep: app.interviewStep
        ? { id: app.interviewStep.id, name: app.interviewStep.name }
        : null,
      averageScore: averageScore
    };
  });

  return candidates;
};
```

**Key Design Decisions:**
- Uses direct Prisma queries for fetching position and applications (follows existing pattern)
- Includes nested relations (candidate, interviewStep, interviews) in single query
- Filters null scores before calculating average
- Returns null for averageScore when no valid scores exist
- Orders results by application date (newest first)
- Handles nullable interviewStep gracefully (renamed from currentInterviewStep to match schema)

---

### 3. Implement Controller
**File:** `backend/src/presentation/controllers/positionController.ts` (CREATE NEW FILE)

**Content:**

```typescript
import { Request, Response } from 'express';
import { getCandidatesForPosition } from '../../application/services/positionService';

/**
 * Controller for getting candidates for a position
 * Handles HTTP request/response and delegates to service layer
 */
export const getCandidatesForPositionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse and validate position ID from path parameter
    const { id } = req.params;
    const positionId = parseInt(id, 10);
    
    if (isNaN(positionId) || positionId <= 0) {
      res.status(400).json({ error: 'Invalid position ID format' });
      return;
    }

    // Call service layer
    const candidates = await getCandidatesForPosition(positionId);
    
    // Return success response
    res.json(candidates);
  } catch (error) {
    // Handle specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage === 'Position not found') {
      res.status(404).json({ error: errorMessage });
      return;
    }
    
    // Default to internal server error
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
```

**Key Design Decisions:**
- Validates positionId is positive number
- Returns `void` for Express controller pattern
- Maps domain errors to appropriate HTTP status codes
- Uses `error instanceof Error` check for type safety
- Returns empty array when position exists but has no candidates

---

### 4. Create Routes
**File:** `backend/src/routes/positionRoutes.ts` (CREATE NEW FILE)

**Content:**

```typescript
import { Router } from 'express';
import { getCandidatesForPositionController } from '../presentation/controllers/positionController';

const router = Router();

// Get all candidates for a position with average scores
router.get('/:id/candidates', getCandidatesForPositionController);

export default router;
```

---

### 5. Register Routes
**File:** `backend/src/index.ts`

**Changes:**

1. Add import after line 5 (after candidateRoutes import):
```typescript
import positionRoutes from './routes/positionRoutes';
```

2. Add route registration after line 40 (after candidateRoutes registration):
```typescript
app.use('/positions', positionRoutes);
```

**Resulting file structure:**
```typescript
import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidateRoutes';
import positionRoutes from './routes/positionRoutes';  // ADD THIS LINE
import { uploadFile } from './application/services/fileUploadService';
import cors from 'cors';

// ... rest of file ...

// Import and use candidateRoutes
app.use('/candidates', candidateRoutes);

app.use('/positions', positionRoutes);  // ADD THIS LINE

// Route for file uploads
app.post('/upload', uploadFile);

// ... rest of file ...
```

---

### 6. Write Unit Tests for Service
**File:** `backend/src/application/services/__tests__/positionService.test.ts` (CREATE NEW FILE)

**Content:**

```typescript
import { PrismaClient } from '@prisma/client';
import { getCandidatesForPosition } from '../positionService';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    position: {
      findUnique: jest.fn()
    },
    application: {
      findMany: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('getCandidatesForPosition', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  const mockPosition = {
    id: 1,
    companyId: 1,
    interviewFlowId: 1,
    title: 'Software Engineer',
    description: 'Test position',
    status: 'Active',
    isVisible: true,
    location: 'Remote'
  };

  const mockApplications = [
    {
      id: 1,
      positionId: 1,
      candidateId: 1,
      applicationDate: new Date('2024-01-15T10:30:00.000Z'),
      currentInterviewStep: 1,
      candidate: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      },
      interviewStep: {
        id: 1,
        name: 'Technical Interview'
      },
      interviews: [
        { score: 4 },
        { score: 5 },
        { score: 3 }
      ]
    },
    {
      id: 2,
      positionId: 1,
      candidateId: 2,
      applicationDate: new Date('2024-01-14T10:30:00.000Z'),
      currentInterviewStep: 1,
      candidate: {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com'
      },
      interviewStep: {
        id: 1,
        name: 'Technical Interview'
      },
      interviews: [
        { score: 5 },
        { score: 5 }
      ]
    }
  ];

  it('should return candidates with average scores for a valid position', async () => {
    (prisma.position.findUnique as jest.Mock).mockResolvedValue(mockPosition);
    (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);

    const result = await getCandidatesForPosition(1);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      candidateId: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      applicationDate: '2024-01-15T10:30:00.000Z',
      currentInterviewStep: { id: 1, name: 'Technical Interview' },
      averageScore: 4 // (4 + 5 + 3) / 3 = 4
    });
    expect(result[1]).toEqual({
      candidateId: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      applicationDate: '2024-01-14T10:30:00.000Z',
      currentInterviewStep: { id: 1, name: 'Technical Interview' },
      averageScore: 5 // (5 + 5) / 2 = 5
    });
  });

  it('should throw error when position is not found', async () => {
    (prisma.position.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getCandidatesForPosition(999)).rejects.toThrow('Position not found');
  });

  it('should return empty array when position has no applications', async () => {
    (prisma.position.findUnique as jest.Mock).mockResolvedValue(mockPosition);
    (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getCandidatesForPosition(1);

    expect(result).toEqual([]);
  });

  it('should handle candidates with null scores correctly', async () => {
    const applicationsWithNullScores = [
      {
        id: 1,
        positionId: 1,
        candidateId: 3,
        applicationDate: new Date('2024-01-13T10:30:00.000Z'),
        currentInterviewStep: 1,
        candidate: {
          id: 3,
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com'
        },
        interviewStep: {
          id: 1,
          name: 'Technical Interview'
        },
        interviews: [
          { score: null },
          { score: null }
        ]
      }
    ];

    (prisma.position.findUnique as jest.Mock).mockResolvedValue(mockPosition);
    (prisma.application.findMany as jest.Mock).mockResolvedValue(applicationsWithNullScores);

    const result = await getCandidatesForPosition(1);

    expect(result).toHaveLength(1);
    expect(result[0].averageScore).toBeNull();
  });

  it('should handle candidates with mixed null and valid scores', async () => {
    const applicationsWithMixedScores = [
      {
        id: 1,
        positionId: 1,
        candidateId: 4,
        applicationDate: new Date('2024-01-12T10:30:00.000Z'),
        currentInterviewStep: 1,
        candidate: {
          id: 4,
          firstName: 'Alice',
          lastName: 'Williams',
          email: 'alice.williams@example.com'
        },
        interviewStep: {
          id: 1,
          name: 'Technical Interview'
        },
        interviews: [
          { score: 4 },
          { score: null },
          { score: 6 }
        ]
      }
    ];

    (prisma.position.findUnique as jest.Mock).mockResolvedValue(mockPosition);
    (prisma.application.findMany as jest.Mock).mockResolvedValue(applicationsWithMixedScores);

    const result = await getCandidatesForPosition(1);

    expect(result).toHaveLength(1);
    expect(result[0].averageScore).toBe(5); // (4 + 6) / 2 = 5
  });

  it('should order results by application date descending', async () => {
    (prisma.position.findUnique as jest.Mock).mockResolvedValue(mockPosition);
    (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);

    const result = await getCandidatesForPosition(1);

    expect(result[0].candidateId).toBe(1); // John applied on 2024-01-15
    expect(result[1].candidateId).toBe(2); // Jane applied on 2024-01-14
  });
});
```

---

### 7. Write Unit Tests for Controller
**File:** `backend/src/presentation/controllers/__tests__/positionController.test.ts` (CREATE NEW FILE)

**Content:**

```typescript
import { Request, Response } from 'express';
import { getCandidatesForPositionController } from '../positionController';
import { getCandidatesForPosition } from '../../../application/services/positionService';

// Mock the service
jest.mock('../../../application/services/positionService', () => ({
  getCandidatesForPosition: jest.fn()
}));

describe('getCandidatesForPositionController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();
    
    mockReq = {
      params: {}
    };
    mockRes = {
      status: statusSpy,
      json: jsonSpy
    };
    
    jest.clearAllMocks();
  });

  it('should return 400 for invalid position ID format', async () => {
    mockReq.params = { id: 'invalid' };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid position ID format' });
  });

  it('should return 400 for negative position ID', async () => {
    mockReq.params = { id: '-1' };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid position ID format' });
  });

  it('should return 400 for zero position ID', async () => {
    mockReq.params = { id: '0' };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid position ID format' });
  });

  it('should return candidates for valid position ID', async () => {
    mockReq.params = { id: '1' };
    
    const mockCandidates = [
      {
        candidateId: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        applicationDate: '2024-01-15T10:30:00.000Z',
        currentInterviewStep: { id: 1, name: 'Technical Interview' },
        averageScore: 4
      }
    ];

    (getCandidatesForPosition as jest.Mock).mockResolvedValue(mockCandidates);

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(getCandidatesForPosition).toHaveBeenCalledWith(1);
    expect(statusSpy).not.toHaveBeenCalled();
    expect(jsonSpy).toHaveBeenCalledWith(mockCandidates);
  });

  it('should return 404 when position is not found', async () => {
    mockReq.params = { id: '999' };
    
    (getCandidatesForPosition as jest.Mock).mockRejectedValue(new Error('Position not found'));

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalledWith({ error: 'Position not found' });
  });

  it('should return 500 for internal server errors', async () => {
    mockReq.params = { id: '1' };
    
    (getCandidatesForPosition as jest.Mock).mockRejectedValue(new Error('Database connection error'));

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  it('should return 500 for non-Error exceptions', async () => {
    mockReq.params = { id: '1' };
    
    (getCandidatesForPosition as jest.Mock).mockRejectedValue('Unknown error');

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
```

---

### 8. Write Integration Tests
**File:** `backend/src/__tests__/positionCandidates.integration.test.ts` (CREATE NEW FILE)

**Content:**

```typescript
import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /positions/:id/candidates - Integration Tests', () => {
  let testPositionId: number;
  let testCandidateId1: number;
  let testCandidateId2: number;

  beforeAll(async () => {
    // Create test data
    const candidate1 = await prisma.candidate.create({
      data: {
        firstName: 'Test',
        lastName: 'Candidate1',
        email: 'test1@example.com'
      }
    });
    testCandidateId1 = candidate1.id;

    const candidate2 = await prisma.candidate.create({
      data: {
        firstName: 'Test',
        lastName: 'Candidate2',
        email: 'test2@example.com'
      }
    });
    testCandidateId2 = candidate2.id;

    const position = await prisma.position.create({
      data: {
        companyId: 1,
        interviewFlowId: 1,
        title: 'Test Position',
        description: 'Test description',
        location: 'Remote',
        jobDescription: 'Test job description'
      }
    });
    testPositionId = position.id;

    // Create applications
    await prisma.application.create({
      data: {
        positionId: testPositionId,
        candidateId: testCandidateId1,
        applicationDate: new Date('2024-01-15T10:30:00.000Z'),
        currentInterviewStep: 1,
        interviews: {
          create: [
            {
              interviewStepId: 1,
              employeeId: 1,
              interviewDate: new Date('2024-01-16T10:00:00.000Z'),
              score: 4
            },
            {
              interviewStepId: 1,
              employeeId: 1,
              interviewDate: new Date('2024-01-17T10:00:00.000Z'),
              score: 5
            }
          ]
        }
      }
    });

    await prisma.application.create({
      data: {
        positionId: testPositionId,
        candidateId: testCandidateId2,
        applicationDate: new Date('2024-01-14T10:30:00.000Z'),
        currentInterviewStep: 1,
        interviews: {
          create: [
            {
              interviewStepId: 1,
              employeeId: 1,
              interviewDate: new Date('2024-01-16T10:00:00.000Z'),
              score: 3
            }
          ]
        }
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.application.deleteMany({
      where: { positionId: testPositionId }
    });
    await prisma.position.delete({ where: { id: testPositionId } });
    await prisma.candidate.delete({ where: { id: testCandidateId1 } });
    await prisma.candidate.delete({ where: { id: testCandidateId2 } });
    await prisma.$disconnect();
  });

  it('should return candidates for a valid position', async () => {
    const response = await request(app)
      .get(`/positions/${testPositionId}/candidates`)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);
    
    // Check first candidate (ordered by applicationDate desc)
    expect(response.body[0].candidateId).toBe(testCandidateId1);
    expect(response.body[0].firstName).toBe('Test');
    expect(response.body[0].lastName).toBe('Candidate1');
    expect(response.body[0].averageScore).toBe(4.5); // (4 + 5) / 2

    // Check second candidate
    expect(response.body[1].candidateId).toBe(testCandidateId2);
    expect(response.body[1].averageScore).toBe(3);
  });

  it('should return 404 for non-existent position', async () => {
    const response = await request(app)
      .get('/positions/99999/candidates')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Position not found');
  });

  it('should return 400 for invalid position ID', async () => {
    const response = await request(app)
      .get('/positions/invalid/candidates')
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid position ID format');
  });

  it('should return empty array for position with no candidates', async () => {
    // Create a position without applications
    const emptyPosition = await prisma.position.create({
      data: {
        companyId: 1,
        interviewFlowId: 1,
        title: 'Empty Position',
        description: 'No candidates',
        location: 'Remote',
        jobDescription: 'Test'
      }
    });

    const response = await request(app)
      .get(`/positions/${emptyPosition.id}/candidates`)
      .expect(200);

    expect(response.body).toEqual([]);

    // Clean up
    await prisma.position.delete({ where: { id: emptyPosition.id } });
  });
});
```

---

## Important Notes

### 1. Prisma Schema Field Names
- The schema uses `currentInterviewStep` as the FK field name in `Application` model
- The relation is named `interviewStep` (singular)
- When querying with `include`, use `interviewStep` to get the related InterviewStep object

### 2. Score Calculation
- Interview scores are nullable (`Int?` in schema)
- Null scores should be excluded from average calculation
- If all scores are null or no interviews exist, return `null` for averageScore
- Average is calculated as: sum of non-null scores / count of non-null scores

### 3. Error Handling
- **400 Bad Request**: Invalid position ID format (non-numeric, negative, zero)
- **404 Not Found**: Position does not exist in database
- **500 Internal Server Error**: Any other unexpected errors

### 4. Response Format
- Returns array of `PositionCandidate` objects
- Empty array `[]` when position exists but has no applications
- `applicationDate` is ISO 8601 string format
- `currentInterviewStep` can be null if the FK is null in database
- `averageScore` can be null if no valid scores exist

### 5. Test Coverage Requirements
- Unit tests should achieve 90%+ coverage
- Mock PrismaClient for unit tests
- Use real database for integration tests
- Test edge cases: null scores, empty results, invalid IDs

### 6. File Structure
```
backend/
├── src/
│   ├── application/
│   │   ├── services/
│   │   │   ├── positionService.ts (NEW)
│   │   │   └── __tests__/
│   │   │       └── positionService.test.ts (NEW)
│   │   └── validator.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── positionController.ts (NEW)
│   │   │   └── __tests__/
│   │   │       └── positionController.test.ts (NEW)
│   │   └── ...
│   ├── routes/
│   │   ├── positionRoutes.ts (NEW)
│   │   └── candidateRoutes.ts
│   ├── domain/
│   │   └── models/
│   │       ├── Position.ts
│   │       ├── Application.ts
│   │       ├── Interview.ts
│   │       └── ...
│   ├── __tests__/
│   │   └── positionCandidates.integration.test.ts (NEW)
│   └── index.ts (UPDATE)
└── api-spec.yaml (UPDATE)
```

### 7. Dependencies
Ensure these dependencies are installed:
- `@prisma/client` - Already installed
- `express` - Already installed
- `jest` - Already installed
- `supertest` - May need to install for integration tests: `npm install --save-dev supertest`

### 8. Implementation Order
1. Update `api-spec.yaml`
2. Create `positionService.ts`
3. Create `positionController.ts`
4. Create `positionRoutes.ts`
5. Update `index.ts` to register routes
6. Create unit tests for service
7. Create unit tests for controller
8. Create integration tests
9. Run tests and verify coverage

---

## Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- positionService.test.ts

# Run with coverage
npm test -- --coverage

# Run integration tests only
npm test -- integration
```

---

## API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/positions/:id/candidates` | Get all candidates for a position with average scores |

**Response Example:**
```json
[
  {
    "candidateId": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "applicationDate": "2024-01-15T10:30:00.000Z",
    "currentInterviewStep": {
      "id": 1,
      "name": "Technical Interview"
    },
    "averageScore": 4.5
  },
  {
    "candidateId": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "applicationDate": "2024-01-14T10:30:00.000Z",
    "currentInterviewStep": {
      "id": 1,
      "name": "Technical Interview"
    },
    "averageScore": 5
  }
]
```
