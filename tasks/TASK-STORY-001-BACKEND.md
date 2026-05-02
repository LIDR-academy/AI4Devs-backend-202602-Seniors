# Tasks for STORY-001: Retrieve Position Candidates in Active Interview Process

**Discipline**: Backend  
**Total Tasks**: 3  
**Coverage**: AC-1 (endpoint creation), AC-2 (candidate data), AC-3 (interview step), AC-4 (average score), AC-5 (application status), AC-6 (response format), AC-7 (error handling)

---

## TASK-STORY-001-BACKEND-001

**Title**: Implement positionController.getPositionCandidates endpoint handler

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: Backend

**Depends On**: TASK-STORY-001-DB-001

**Blocks**: TASK-STORY-001-SECURITY-001, TASK-STORY-001-QA-001

---

### Purpose

Create HTTP endpoint handler in presentation layer that accepts GET /positions/:id/candidates, validates input, calls service layer, and returns formatted response per AC-6.

Fulfills AC-1 (endpoint creation + validation), AC-6 (response format), AC-7 (error handling).

### Scope of Change

- **Create**: `src/presentation/controllers/positionController.ts` (if doesn't exist) with `getPositionCandidates` method
- **Modify**: `src/routes/positionRoutes.ts` to register new route
- **Create**: Type definitions for request/response payloads in `src/types/position.types.ts` (if new file needed)

### Where

- Controller: `backend/src/presentation/controllers/positionController.ts`
- Routes: `backend/src/routes/positionRoutes.ts`
- Types: `backend/src/types/position.types.ts` (or existing types file)

### Why

Per CLAUDE.md (Layered Architecture), HTTP handlers belong in presentation layer. Separating concerns allows:
- Controller to handle HTTP concerns (status codes, error mapping, request parsing)
- Service layer to handle business logic (query building, data transformation)
- Easy unit testing of controller logic separately from business logic

### How: Technical Approach

**Step 1**: Create/verify position controller file exists
- If `src/presentation/controllers/positionController.ts` doesn't exist, create it
- Import required dependencies: Express, Request/Response types, positionService, logger

**Step 2**: Implement `getPositionCandidates` handler
```typescript
export const getPositionCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Input validation: must be a positive integer
    const positionId = Number(id);
    if (!Number.isInteger(positionId) || positionId <= 0) {
      res.status(400).json({
        error: 'Invalid position ID',
        statusCode: 400,
        message: 'Position ID must be a valid integer',
      });
      return;
    }

    // Extract company context from auth token (populated by authMiddleware)
    const requesterCompanyId = parseInt(req.user?.companyId ?? '0', 10);
    if (!requesterCompanyId || isNaN(requesterCompanyId)) {
      res.status(401).json({
        error: 'Unauthorized',
        statusCode: 401,
        message: 'Company context is missing from authentication token',
      });
      return;
    }

    // Call service with company scope
    const positionService = new PositionService(req.prisma);
    const result = await positionService.getPositionCandidates(positionId, requesterCompanyId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'PositionNotFoundError') {
      res.status(404).json({ error: 'Position not found', statusCode: 404, message: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error', statusCode: 500 });
  }
};
```

**Step 3**: Register route in `positionRoutes.ts`
```typescript
router.get('/:id/candidates', getPositionCandidates);
```

**Step 4**: Ensure route is registered in main app
- Verify in `src/index.ts`: `app.use('/positions', positionRoutes);`

**Step 5**: Add request/response types (TypeScript)
```typescript
interface PositionCandidatesRequest {
  params: { id: string };
}

interface PositionCandidatesResponse {
  positionId: number;
  positionTitle: string;
  candidates: Array<{
    candidateId: number;
    fullName: string;
    email: string;
    phone: string | null;
    address: string | null;
    applicationDate: string;
    applicationNotes: string | null;
    currentInterviewStep: {
      stepId: number;
      stepName: string;
      stepOrder: number;
      interviewFlowId: number;
    };
    averageScore: number | null;
    totalInterviewsCompleted: number;
  }>;
}
```

### Inputs / Outputs / Contracts

**Input**: 
- HTTP Request: `GET /positions/:id/candidates`
- Path param: `id` (string, must parse to integer)

**Output**:
- HTTP Response: 
  - Status 200: JSON body matching PositionCandidatesResponse type
  - Status 400: `{ error: string, statusCode: 400 }`
  - Status 404: `{ error: string, statusCode: 404 }`
  - Status 403: `{ error: string, statusCode: 403 }`
  - Status 500: `{ error: string, statusCode: 500 }`

**Response Payload** (AC-6):
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

### Dependencies

- TASK-STORY-001-DB-001 (schema verified)
- TASK-STORY-001-BACKEND-002 (service layer must exist; can run in parallel)
- Express.js (already in project)
- TypeScript (already configured)

### Acceptance Criteria

- [ ] getPositionCandidates handler implemented in positionController
- [ ] Handler accepts GET /positions/:id/candidates
- [ ] Handler validates positionId is numeric; returns 400 if invalid
- [ ] Handler extracts requesterCompanyId from req.user.companyId; returns 401 if missing
- [ ] Handler calls positionService.getPositionCandidates(id, requesterCompanyId)
- [ ] Handler returns HTTP 200 with JSON response body
- [ ] Response format matches AC-6 specification exactly
- [ ] Errors delegated to error handling middleware (next(error))
- [ ] Route registered in positionRoutes.ts
- [ ] positionRoutes imported and used in src/index.ts
- [ ] No console.log or debug code in production code
- [ ] Types defined for request/response payloads
- [ ] Code follows project conventions (per CLAUDE.md)

### Test Requirements

**Unit Tests** (src/presentation/controllers/__tests__/positionController.test.ts):
- Test: Invalid positionId (non-numeric) returns 400
- Test: Service called with correct ID
- Test: Response status 200 returned
- Test: Response body format matches type definition
- Test: Error from service caught and delegated to next(error)

**Mock Requirements**:
- Mock positionService.getPositionCandidates()
- Mock Express Request/Response objects

### Non-Functional Requirements

**Validation**:
- positionId must be a positive integer (not negative, zero, or string)
- Error messages must be specific ("Invalid position ID" not "Bad request")

**HTTP Compliance**:
- Use correct HTTP status codes (200, 400, 404, 403, 500)
- Use application/json Content-Type (Express default)
- Return JSON even for errors (consistency)

**Performance**:
- Controller handler <50ms (mostly delegating to service)
- Response serialization <100ms for 100 candidates

**Security**:
- Input validation (positionId must be numeric) prevents injection
- No sensitive data in error messages (e.g., don't expose DB errors to client)
- Authorization check deferred to middleware/service layer (TASK-STORY-001-SECURITY-001)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| positionId parsing fails (parseInt throws) | Use Number() or parseInt with radix; handle NaN case explicitly |
| Service layer throws unexpected error | Use try-catch and delegate to error middleware for consistent handling |
| Response format doesn't match API spec | Create response DTO in service layer; controller just passes through |

### Definition of Done

- [ ] Handler implemented with input validation
- [ ] Handler calls service layer correctly
- [ ] HTTP status codes match specification (200, 400, 404, 403, 500)
- [ ] Response format matches AC-6 JSON schema
- [ ] Route registered in positionRoutes and used in index.ts
- [ ] Unit tests written and passing
- [ ] Code reviewed and approved by backend lead
- [ ] No console.log or debug code
- [ ] Task linked to STORY-001

---

## TASK-STORY-001-BACKEND-002

**Title**: Implement positionService.getPositionCandidates business logic and data transformation

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: Backend

**Depends On**: TASK-STORY-001-DB-001

**Blocks**: TASK-STORY-001-BACKEND-001, TASK-STORY-001-QA-001, TASK-STORY-001-OBSERVABILITY-001

---

### Purpose

Implement business logic in application layer: query database for position with related applications, candidates, interview steps, and interviews. Calculate average score per candidate. Transform raw data into response DTO. Handle domain errors (position not found).

Fulfills AC-1 (position validation), AC-2 (candidate data retrieval), AC-3 (interview step data), AC-4 (average score calculation), AC-5 (application metadata), AC-6 (response format).

### Scope of Change

- **Create**: `src/application/services/positionService.ts` (if doesn't exist) with `getPositionCandidates` method
- **Create**: DTO types: `PositionCandidatesDTO`, `CandidateDTO` in `src/types/position.types.ts`
- **Create**: Utility function for average score calculation: `calculateAverageScore()` in service or utils

### Where

- Service: `backend/src/application/services/positionService.ts`
- Types/DTOs: `backend/src/types/position.types.ts`
- Utils (if needed): `backend/src/application/utils/scoreCalculator.ts`

### Why

Per CLAUDE.md (Layered Architecture), business logic belongs in application layer. Service layer:
- Handles Prisma queries and data access
- Contains business rules (average score calculation, null handling)
- Transforms raw database entities into response DTOs
- Throws domain errors (PositionNotFound) that controller maps to HTTP status codes
- Testable independently of HTTP layer

### How: Technical Approach

**Step 1**: Create positionService.ts structure
```typescript
import { PrismaClient } from '@prisma/client';
import { PositionCandidatesDTO, CandidateDTO } from '../types/position.types';

export class PositionService {
  constructor(private prisma: PrismaClient) {}

  async getPositionCandidates(positionId: number, requesterCompanyId: number): Promise<PositionCandidatesDTO> {
    // Implementation here
  }
}
```

**Step 2**: Implement Prisma query
```typescript
const position = await this.prisma.position.findUnique({
  where: { id: positionId },
  include: {
    company: true,
    applications: {
      include: {
        candidate: true,
        interviewStep: true,
        interviews: {
          where: { score: { not: null } },
        },
      },
    },
  },
});

if (!position) {
  throw new PositionNotFoundError(`Position ${positionId} not found`);
}

// Enforce company scope: treat cross-company access as not-found to avoid leaking existence
if (position.companyId !== requesterCompanyId) {
  throw new PositionNotFoundError(`Position ${positionId} not found`);
}
```

**Step 3**: Implement data transformation
```typescript
const candidates: CandidateDTO[] = position.applications.map(app => {
  const averageScore = this.calculateAverageScore(app.interviews);
  return {
    candidateId: app.candidate.id,
    fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
    email: app.candidate.email,
    phone: app.candidate.phone || null,
    address: app.candidate.address || null,
    applicationDate: app.applicationDate.toISOString(),
    applicationNotes: app.notes || null,
    currentInterviewStep: {
      stepId: app.interviewStep.id,
      stepName: app.interviewStep.name,
      stepOrder: app.interviewStep.orderIndex,
      interviewFlowId: app.interviewStep.interviewFlowId,
    },
    averageScore,
    totalInterviewsCompleted: app.interviews.length,
  };
});

return {
  positionId: position.id,
  positionTitle: position.title,
  candidates,
};
```

**Step 4**: Implement average score calculation (null-safe)
```typescript
private calculateAverageScore(interviews: Interview[]): number | null {
  if (!interviews || interviews.length === 0) {
    return null;
  }
  
  const scores = interviews.map(i => i.score).filter(s => s !== null);
  if (scores.length === 0) {
    return null;
  }
  
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return sum / scores.length;
}
```

**Step 5**: Define custom errors
```typescript
export class PositionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PositionNotFoundError';
  }
}
```

### Inputs / Outputs / Contracts

**Input**:
- positionId (number, positive integer)
- Prisma client (injected)

**Output**:
- PositionCandidatesDTO object matching response schema
- OR throws PositionNotFoundError if position doesn't exist
- OR throws database error (caught by error middleware)

**DTO Contracts**:
```typescript
interface PositionCandidatesDTO {
  positionId: number;
  positionTitle: string;
  candidates: CandidateDTO[];
}

interface CandidateDTO {
  candidateId: number;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  applicationDate: string; // ISO 8601
  applicationNotes: string | null;
  currentInterviewStep: {
    stepId: number;
    stepName: string;
    stepOrder: number;
    interviewFlowId: number;
  };
  averageScore: number | null;
  totalInterviewsCompleted: number;
}
```

### Dependencies

- TASK-STORY-001-DB-001 (schema verified)
- Prisma client (already configured)
- TypeScript (already configured)

### Acceptance Criteria

- [ ] getPositionCandidates method implemented
- [ ] Prisma query fetches position with all relations
- [ ] Throws PositionNotFoundError if position doesn't exist
- [ ] Average score calculated correctly (null-safe, excludes nulls)
- [ ] fullName constructed from firstName + lastName
- [ ] applicationDate formatted as ISO 8601 string
- [ ] currentInterviewStep includes stepId, stepName, stepOrder, interviewFlowId
- [ ] totalInterviewsCompleted counted correctly
- [ ] All AC-2 through AC-5 data included in DTO
- [ ] Response DTO matches AC-6 JSON schema exactly
- [ ] Service exported and can be instantiated in controller
- [ ] No console.log or debug code

### Test Requirements

**Unit Tests** (src/application/services/__tests__/positionService.test.ts):
- Test: Valid position returns DTO with all fields
- Test: Invalid position throws PositionNotFoundError
- Test: Average score calculation with multiple interviews
- Test: Average score null when no interviews
- Test: Average score null when only null scores
- Test: fullName constructed correctly (with space)
- Test: applicationDate in ISO 8601 format
- Test: Empty candidates array when position has no applications

**Mock Requirements**:
- Mock Prisma client with position, applications, candidates, interview steps, interviews
- Mock data: Set up at least 2 candidates with different score counts (0, 1, 2+ interviews)

### Non-Functional Requirements

**Correctness**:
- Average score calculation must handle edge cases:
  - No interviews: return null
  - Some null scores: exclude from average
  - All null scores: return null
- fullName formatting: "John Doe" (not "John  Doe", not "Doe John")
- Dates in ISO 8601 (e.g., "2026-05-01T10:00:00Z")

**Performance**:
- Single Prisma query with all relations (no N+1)
- Data transformation <50ms for 100 candidates
- Average score calculation O(n) where n = interviews per candidate

**Error Handling**:
- PositionNotFoundError for missing position (thrown, not returned)
- Database errors propagate (caught by middleware)
- No silent failures (e.g., don't return empty array for not found)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Average calculation divides by zero | Check scores.length > 0 before dividing |
| fullName concatenation creates double spaces | Handle null firstName/lastName or use trim() |
| ISO 8601 formatting timezone issues | Use toISOString() method (UTC) consistently |
| Prisma query includes too many relations (performance) | Verify only needed relations are included |
| PositionNotFoundError not caught by controller | Test error handling flow in integration test |

### Definition of Done

- [ ] getPositionCandidates method fully implemented
- [ ] Prisma query with all required relations
- [ ] Data transformation to DTO complete
- [ ] Average score calculation null-safe and correct
- [ ] PositionNotFoundError defined and thrown appropriately
- [ ] Response DTO matches AC-6 schema exactly
- [ ] Unit tests written and passing (coverage >90%)
- [ ] Error flow tested (PositionNotFoundError → controller → 404)
- [ ] Service exported and can be imported by controller
- [ ] Code reviewed and approved
- [ ] No console.log or debug code
- [ ] Task linked to STORY-001

---

## TASK-STORY-001-BACKEND-003

**Title**: Integrate authorization middleware and error handling for position candidates endpoint

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: Backend

**Depends On**: TASK-STORY-001-BACKEND-001, TASK-STORY-001-SECURITY-001

**Blocks**: TASK-STORY-001-QA-001 (final integration test)

---

### Purpose

Add authorization checks to ensure only authenticated recruiters/hiring managers can access endpoint. Integrate error handling middleware to map service errors to HTTP status codes. Handle edge cases (position without candidates).

Fulfills AC-7 (error handling: 400, 404, 403, 500), AC-8 (authorization).

### Scope of Change

- **Modify**: `src/routes/positionRoutes.ts` to add auth middleware before route handler
- **Modify**: `src/presentation/controllers/positionController.ts` error handling to map specific errors
- **Modify** or **Verify**: Error handling middleware in `src/index.ts` or `src/middleware/errorHandler.ts`

### Where

- Routes: `backend/src/routes/positionRoutes.ts`
- Controller: `backend/src/presentation/controllers/positionController.ts`
- Error middleware: `backend/src/middleware/errorHandler.ts` (or `src/index.ts`)

### Why

Per STORY-001 AC-8: "Only authenticated users with recruiter or hiring_manager role can access this endpoint". Per CLAUDE.md (middleware pattern), authorization is enforced at route level. Error handling middleware provides consistent error response format (AC-7).

### How: Technical Approach

**Step 1**: Verify/create authorization middleware
```typescript
// src/middleware/authMiddleware.ts
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user; // Set by JWT verification middleware
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', statusCode: 401 });
  }
  next();
};

export const requireRole = (roles: string[]) => (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const user = req.user;
  if (!user || !roles.includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden', statusCode: 403 });
  }
  next();
};
```

**Step 2**: Add middleware to route
```typescript
// src/routes/positionRoutes.ts
router.get(
  '/:id/candidates',
  requireAuth,
  requireRole(['recruiter', 'hiring_manager']),
  getPositionCandidates
);
```

**Step 3**: Update controller error handling
```typescript
export const getPositionCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const positionId = req.params.id;
    
    if (!positionId || isNaN(Number(positionId))) {
      return res.status(400).json({ 
        error: 'Invalid position ID',
        statusCode: 400 
      });
    }

    // Extract company context from auth token (populated by authMiddleware)
    const requesterCompanyId = parseInt(req.user?.companyId ?? '0', 10);
    if (!requesterCompanyId || isNaN(requesterCompanyId)) {
      return res.status(401).json({
        error: 'Unauthorized',
        statusCode: 401,
        message: 'Company context is missing from authentication token',
      });
    }
    
    const result = await positionService.getPositionCandidates(Number(positionId), requesterCompanyId);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof PositionNotFoundError) {
      return res.status(404).json({
        error: error.message,
        statusCode: 404,
      });
    }
    // Other errors to middleware
    next(error);
  }
};
```

**Step 4**: Verify error handling middleware
```typescript
// src/middleware/errorHandler.ts (or in src/index.ts)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`[${status}] ${message}`, { error: err });
  
  res.status(status).json({
    error: message,
    statusCode: status,
  });
});
```

**Step 5**: Test edge cases
- Position with 0 applications: returns 200 with empty candidates array
- Position with applications but no completed interviews: averageScore null, totalInterviewsCompleted 0

### Inputs / Outputs / Contracts

**Input**:
- Authenticated request with user object (set by auth middleware)
- User object must include `role` field

**Output**:
- **200 OK**: Position candidates data (from TASK-STORY-001-BACKEND-002)
- **400 Bad Request**: `{ error: "Invalid position ID", statusCode: 400 }`
- **401 Unauthorized**: `{ error: "Unauthorized", statusCode: 401 }` (from requireAuth)
- **403 Forbidden**: `{ error: "Forbidden", statusCode: 403 }` (from requireRole)
- **404 Not Found**: `{ error: "Position [id] not found", statusCode: 404 }`
- **500 Internal Server Error**: `{ error: string, statusCode: 500 }`

### Dependencies

- TASK-STORY-001-BACKEND-001 (controller)
- TASK-STORY-001-BACKEND-002 (service)
- TASK-STORY-001-SECURITY-001 (auth/authz requirements clarified)
- Authentication middleware (must exist; assumed in project per CLAUDE.md)

### Acceptance Criteria

- [ ] requireAuth middleware validates user is authenticated
- [ ] requireRole middleware validates user has recruiter or hiring_manager role
- [ ] Middleware applied to /:id/candidates route before handler
- [ ] 401 returned if user not authenticated
- [ ] 403 returned if user doesn't have required role
- [ ] 400 returned for invalid position ID
- [ ] 404 returned if position doesn't exist
- [ ] 500 returned for unhandled server errors
- [ ] Error response format consistent (error + statusCode)
- [ ] Position with 0 candidates returns 200 with empty array
- [ ] Error messages don't expose internal details (no DB errors to client)
- [ ] Error middleware logs all errors (with level appropriate to status)

### Test Requirements

**Integration Tests** (src/routes/__tests__/positionRoutes.test.ts):
- Test: GET /positions/1/candidates without auth returns 401
- Test: GET /positions/1/candidates with invalid role returns 403
- Test: GET /positions/1/candidates with valid auth and role returns 200
- Test: GET /positions/abc/candidates returns 400 (invalid ID)
- Test: GET /positions/9999/candidates returns 404 (not found)
- Test: Position with 0 candidates returns 200 with empty array

**Mock Requirements**:
- Mock authentication middleware to set req.user
- Mock PositionService to throw PositionNotFoundError
- Mock database errors to verify 500 error handling

### Non-Functional Requirements

**Security**:
- Reject unauthorized users before querying database (fail-fast)
- Don't expose database errors to client (generic "Internal Server Error" for 500)
- No user data in error logs (don't log user ID, email, etc.)

**Consistency**:
- All error responses use same format (error + statusCode)
- All errors logged with appropriate level (warn for 4xx, error for 5xx)
- HTTP status codes match specification (200, 400, 401, 403, 404, 500)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Auth middleware not configured correctly | Verify requireAuth/requireRole exported and imported correctly |
| Error middleware catches all errors (good) but logs sensitive data | Implement structured logging that excludes PII |
| Position not found error has different format than other errors | Standardize error format in controller catch block |
| Authentication bypass (user.role not validated) | Test all role combinations (valid, invalid, missing) |

### Definition of Done

- [ ] Authorization middleware applied to route
- [ ] 401 response tested (unauthenticated)
- [ ] 403 response tested (wrong role)
- [ ] 404 response for missing position mapped in controller
- [ ] 400 response for invalid ID tested
- [ ] 500 response for server errors tested
- [ ] Error format consistent across all error types
- [ ] All error responses include statusCode field
- [ ] Error messages don't expose internal details
- [ ] Error middleware logs appropriately
- [ ] Integration tests passing
- [ ] Edge cases tested (0 candidates, null scores)
- [ ] Code reviewed and approved
- [ ] Task linked to STORY-001

---
