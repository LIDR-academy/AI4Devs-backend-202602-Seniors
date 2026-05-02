# Tasks for STORY-002: Update Candidate Interview Stage

**Discipline**: Security  
**Total Tasks**: 1  
**Coverage**: Authentication, authorization, input validation, data protection

---

## TASK-STORY-002-SECURITY-001

**Title**: Implement security controls for stage update endpoint

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: Security

**Depends On**: None (security is embedded in implementation)

**Blocks**: TASK-STORY-002-BACKEND-002 (auth/authz logic depends on this security design)

---

### Purpose & Scope

**Purpose**
Design and implement security controls (authentication, authorization, input validation, data protection) for the PUT /candidates/:applicationId/stage endpoint. Ensures no unauthorized access, no injection attacks, no data exposure.

Fulfills AC: "Authentication required (HTTP 401)", "Role-based access (HTTP 403)", all error handling with no PII exposure

**Scope of Change**
- Validate: JWT authentication (Bearer token in Authorization header)
- Validate: Role-based access control (only recruiter/hiring_manager can update)
- Validate: Input validation (applicationId and interviewStepId are integers, not negative)
- Prevent: SQL injection (use Prisma parameterized queries, not raw SQL)
- Prevent: XSS attacks (no user input echoed in responses without sanitization)
- Prevent: Insecure deserialization (validate JSON request structure)
- Protect: PII in logs (no candidate email/name in audit logs; use applicationId only)
- Protect: Audit log access (only HR/compliance team can read audit logs)
- Verify: No hardcoded secrets or credentials in code

**Where**
- Authentication: `backend/src/application/middleware/authMiddleware.ts` (validate JWT)
- Authorization: `backend/src/application/middleware/roleMiddleware.ts` (check recruiter/hiring_manager)
- Input validation: `backend/src/presentation/controllers/candidateController.ts` (validate integers)
- Error handling: `backend/src/application/services/candidateStageService.ts` (no PII in errors)
- Audit logging: `backend/src/application/services/auditService.ts` (applicationId only, no PII)
- Secrets management: `.env` file (never committed to version control)

**Why**
Per story's security & privacy section: "JWT token required; only recruiter/hiring_manager role; prevent non-existent/unrelated interview step moves (FK constraint + validation)".

Per OWASP Top 10: Injection, broken authentication/authorization, and sensitive data exposure are top 3 risks. This task addresses all three.

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Validate JWT authentication**:
   ```typescript
   // backend/src/application/middleware/authMiddleware.ts
   import jwt from 'jsonwebtoken';
   import { Request, Response, NextFunction } from 'express';
   
   declare global {
     namespace Express {
       interface Request {
         userId?: number;
         userRole?: string;
       }
     }
   }
   
   export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
     const authHeader = req.headers.authorization;
     
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return res.status(401).json({
         error: 'Unauthorized',
         statusCode: 401,
         message: 'Missing or invalid Authorization header'
       });
     }
     
     const token = authHeader.substring(7); // Remove 'Bearer ' prefix
     
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET!);
       req.userId = decoded.sub as number;
       req.userRole = decoded.role as string;
       next();
     } catch (err) {
       return res.status(401).json({
         error: 'Unauthorized',
         statusCode: 401,
         message: 'Invalid or expired token'
       });
     }
   };
   ```

2. **Validate role-based access**:
   ```typescript
   // backend/src/application/middleware/roleMiddleware.ts
   import { Request, Response, NextFunction } from 'express';
   
   export const requireRole = (allowedRoles: string[]) =>
     (req: Request, res: Response, next: NextFunction) => {
       if (!req.userRole || !allowedRoles.includes(req.userRole)) {
         return res.status(403).json({
           error: 'Forbidden',
           statusCode: 403,
           message: 'User role does not have permission to perform this action'
         });
       }
       next();
     };
   ```

3. **Validate input: applicationId and interviewStepId**:
   ```typescript
   // backend/src/presentation/controllers/candidateController.ts
   
   // Helper function to validate integers
   const parsePositiveInteger = (value: string, fieldName: string): number => {
     const parsed = parseInt(value, 10);
     
     if (isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
       throw new Error(`Invalid ${fieldName}: must be a positive integer`);
     }
     
     return parsed;
   };
   
   export class CandidateController {
     async updateCandidateStage(req: Request, res: Response) {
       try {
         const { applicationId } = req.params;
         const { interviewStepId, notes } = req.body;
         
         // Validate applicationId (from URL params)
         let parsedApplicationId: number;
         try {
           parsedApplicationId = parsePositiveInteger(applicationId, 'application ID');
         } catch (err) {
           return res.status(400).json({
             error: 'Invalid application ID',
             statusCode: 400,
             message: 'Application ID must be a valid positive integer'
           });
         }
         
         // Validate interviewStepId (from request body)
         if (typeof interviewStepId !== 'number' || !Number.isInteger(interviewStepId) || interviewStepId <= 0) {
           return res.status(400).json({
             error: 'Invalid interview step ID',
             statusCode: 400,
             message: 'Interview step ID must be a positive integer'
           });
         }
         
         // Validate notes if provided (prevent XSS)
         if (notes !== undefined && typeof notes !== 'string') {
           return res.status(400).json({
             error: 'Invalid notes',
             statusCode: 400,
             message: 'Notes must be a string'
           });
         }
         
         // Sanitize notes (remove script tags, etc)
         const sanitizedNotes = notes ? sanitizeHtml(notes) : undefined;
         
         // Call service (all further validation in service)
         const updated = await this.candidateStageService.updateStage(
           parsedApplicationId,
           interviewStepId,
           req.userId!,
           sanitizedNotes
         );
         
         res.status(200).json(updated);
       } catch (err: any) {
         // Log error for debugging (but don't expose to client)
         console.error('Error updating candidate stage:', err);
         
         // Return generic error (don't expose internal details)
         res.status(500).json({
           error: 'Internal server error',
           statusCode: 500,
           message: 'An error occurred while updating the candidate stage'
         });
       }
     }
   }
   ```

4. **Use Prisma parameterized queries (prevent SQL injection)**:
   ```typescript
   // backend/src/application/services/candidateStageService.ts
   
   // CORRECT: Use Prisma (safe from injection)
   const application = await this.prisma.application.update({
     where: { id: applicationId },
     data: { currentInterviewStep: interviewStepId },
     include: { currentInterviewStepData: true }
   });
   
   // INCORRECT: Raw SQL (vulnerable to injection)
   // ❌ const result = await this.prisma.$queryRaw(`
   //      UPDATE "Application" SET "currentInterviewStep" = ${interviewStepId}
   //      WHERE id = ${applicationId}
   //    `);
   ```

5. **Log audit entries without PII**:
   ```typescript
   // backend/src/application/services/auditService.ts
   
   export const logStageChange = async (
     prisma: PrismaClient,
     applicationId: number,
     userId: number,
     oldStageId: number | null,
     newStageId: number,
     notes?: string
   ) => {
     // Store applicationId (linkable to candidate), not candidate name/email
     // Store userId (recruiter who made change), not user email/name
     // Store interview step IDs (not names, to avoid redundancy)
     
     await prisma.auditLog.create({
       data: {
         action: 'STAGE_UPDATE',
         applicationId,       // ✓ Safe: just an ID
         userId,              // ✓ Safe: just an ID
         oldStageId,
         newStageId,
         timestamp: new Date(),
         details: notes ? { notes } : null  // ✓ Safe: optional notes
       }
     });
     
     // ❌ DON'T log: candidate email, name, salary, etc.
     // ❌ DON'T log: user email, name, phone, etc.
   };
   ```

6. **Restrict audit log access** (add note for future task):
   ```typescript
   // Note: In future, add an endpoint GET /audit-logs with additional role check
   // export const requireRole = (allowedRoles: string[]) => ...
   // router.get('/audit-logs', authMiddleware, requireRole(['hr', 'compliance']), ...);
   ```

7. **Validate no hardcoded secrets**:
   ```bash
   # Check for hardcoded secrets in code
   grep -r "password" backend/src --exclude-dir=node_modules
   grep -r "secret" backend/src --exclude-dir=node_modules
   grep -r "api_key" backend/src --exclude-dir=node_modules
   
   # All secrets should be in .env (not committed)
   cat .gitignore | grep "\.env"
   # Expected: .env is listed
   ```

8. **Run security linting**:
   ```bash
   # Install security linter
   npm install --save-dev eslint-plugin-security
   
   # Run security checks
   npx eslint backend/src --plugin security --rule 'security/detect-non-literal-regexp: error'
   
   # Results should show no security issues
   ```

**Inputs / Outputs / Contracts**

**JWT Token Structure:**
```json
{
  "sub": 5,              // userId (subject)
  "role": "recruiter",   // role (recruiter or hiring_manager)
  "exp": 1700000000,     // expiration timestamp
  "iat": 1699999999      // issued at timestamp
}
```

**Authentication/Authorization Flow:**
```
Request → authMiddleware (validate JWT) → requireRole(['recruiter', 'hiring_manager']) → controller
  ↓ Missing/invalid JWT → HTTP 401 Unauthorized
  ↓ Wrong role → HTTP 403 Forbidden
  ↓ All validations pass → Execute business logic
```

**Input Validation Rules:**

| Field | Rule | Example | Invalid |
|-------|------|---------|---------|
| applicationId | Positive integer | 123 | -1, 0, "abc", 123.45 |
| interviewStepId | Positive integer | 2 | -1, 0, "2", 2.5 |
| notes | String (optional) | "Passed screening" | null (if provided, must be string) |

**Error Response Format (No PII):**
```json
{
  "error": "Invalid application ID",
  "statusCode": 400,
  "message": "Application ID must be a positive integer"
}
```
✓ Safe: No candidate data, no internal details
❌ Unsafe: "Application 1234 (john@example.com) not found" — exposes candidate email

**Audit Log Format (No PII):**
```json
{
  "id": 42,
  "action": "STAGE_UPDATE",
  "userId": 5,              // ✓ Safe: just ID
  "applicationId": 3,       // ✓ Safe: just ID
  "oldStageId": 1,
  "newStageId": 2,
  "timestamp": "2026-05-01T14:35:00.000Z",
  "details": {
    "notes": "Passed screening"
  }
}
```
✓ Safe: No candidate email/name, no recruiter email/name
❌ Unsafe: "candidateEmail": "john@example.com" — PII exposure

**Dependencies**
- JWT library (jsonwebtoken)
- Input validation library (optional; can use manual checks)
- HTML sanitization library (optional; can use simple escaping)
- Prisma ORM (safe from SQL injection by design)
- Environment variables for secrets (.env)

---

### Acceptance Criteria

- [ ] JWT authentication validates Bearer token in Authorization header
- [ ] Missing/invalid JWT returns HTTP 401 "Unauthorized"
- [ ] Role-based access control enforces recruiter/hiring_manager role
- [ ] Non-authorized roles return HTTP 403 "Forbidden"
- [ ] Input validation rejects non-integer or negative applicationId (HTTP 400)
- [ ] Input validation rejects non-integer or negative interviewStepId (HTTP 400)
- [ ] All database queries use Prisma (no raw SQL; safe from injection)
- [ ] Error responses contain no PII (no candidate email/name)
- [ ] Audit logs contain no PII (applicationId and userId only, not names/emails)
- [ ] Notes field sanitized (HTML escaping) to prevent XSS
- [ ] Hardcoded secrets not present in code (JWT_SECRET in .env)
- [ ] .env file is in .gitignore (not committed to version control)
- [ ] Security linting passes (no security warnings)
- [ ] JWT token structure includes userId (sub) and role
- [ ] All error handling prevents information leakage

---

### Test Requirements

**Unit Tests**
- **authMiddleware**: 
  - Missing Authorization header → 401
  - Invalid Bearer token format → 401
  - Expired JWT → 401
  - Valid JWT → request.userId and request.userRole set
- **roleMiddleware**:
  - recruiter role → allowed
  - hiring_manager role → allowed
  - candidate role → 403 Forbidden
  - no role → 403 Forbidden
- **Input validation**:
  - applicationId="123" → parsed as 123
  - applicationId="abc" → HTTP 400
  - applicationId="-1" → HTTP 400
  - interviewStepId=2 → valid
  - interviewStepId=-1 → HTTP 400

**Integration Tests**
- Complete request flow with valid JWT and recruiter role → 200
- Request without JWT → 401
- Request with candidate role → 403
- Request with invalid applicationId → 400
- Request with invalid interviewStepId → 400
- Error responses contain no PII

**Manual Testing / Regression Scope**
- Generate valid JWT (with recruiter role) and test endpoint
- Test with expired JWT (should return 401)
- Test with wrong role (should return 403)
- Verify audit logs don't contain candidate email/name
- Verify error messages don't expose internal details
- Check .gitignore includes .env (secrets not committed)
- Run security linting: no warnings

---

### Non-Functional Requirements

**Security**
- JWT validation happens before business logic
- Role check happens before business logic
- Input validation rejects invalid integers and prevents injection
- Error messages don't expose sensitive data (database errors, system details)
- Audit logs store only IDs and timestamps, not PII

**Performance**
- JWT validation <5ms (simple verification)
- Role check <1ms (string comparison)
- Input validation <2ms (integer parsing)
- Total security overhead <10ms (negligible vs 200ms SLO)

**Compliance**
- No PII stored in logs (GDPR Article 5: data minimization)
- Audit trail exists (GDPR Article 5: accountability)
- Secrets not committed to version control (PCI-DSS 6.5.10)

---

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| JWT secret leaked | Store in .env, never commit; rotate secret if exposed; use strong random secret |
| Weak JWT signature algorithm | Use HS256 or RS256 (not MD5 or SHA1); verify alg field in token |
| Role escalation (candidate changes role in JWT) | Validate token signature (tampering detected); roles from database, not token (future) |
| SQL injection via input | Use Prisma (parameterized queries by design); never use $queryRaw with string interpolation |
| XSS via notes field | Sanitize user input; escape HTML; consider storing as plain text (not HTML) |
| PII exposure in logs | Audit review: grep logs for candidate names, emails; remove before production |
| Broken audit log access control | Add role check to future GET /audit-logs endpoint (this task focuses on write) |

---

### Definition of Done

- [ ] JWT authentication implemented with Bearer token validation
- [ ] Role-based access control enforces recruiter/hiring_manager only
- [ ] Input validation rejects non-integer and negative inputs
- [ ] All database queries use Prisma (no raw SQL)
- [ ] Error responses contain no PII
- [ ] Audit logs contain no PII (IDs only)
- [ ] Notes field sanitized (HTML escaping)
- [ ] JWT_SECRET stored in .env (not committed)
- [ ] .env added to .gitignore
- [ ] Security linting passes (no warnings)
- [ ] All unit and integration tests passing
- [ ] Manual security testing completed (valid JWT, wrong role, invalid input)
- [ ] Audit logs reviewed (no PII exposure)
- [ ] Security review completed and approved
- [ ] Code merged to main branch

---
