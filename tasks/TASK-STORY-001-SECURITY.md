# Security Tasks for STORY-001: Retrieve Position Candidates

**Discipline**: Security  
**Total Tasks**: 1  
**Coverage**: AC-8 (authorization), input validation, data protection

---

## TASK-STORY-001-SECURITY-001

**Title**: Threat model, authentication/authorization validation, and input sanitization for position candidates endpoint

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: Security

**Depends On**: TASK-STORY-001-API-001 (spec defines attack surface), TASK-STORY-001-BACKEND-001 (implementation exists to review)

**Blocks**: None (can run in parallel, but findings should be addressed before production deployment)

---

### Purpose

Identify and document security threats for the GET /positions/:id/candidates endpoint, verify authorization is properly enforced, validate input sanitization prevents injection attacks, ensure candidate data is not exposed to unauthorized users, and document compliance with security best practices.

Fulfills AC-8 (authorization required, 403 for unauthorized users), story NFR (Security & Privacy section), and OWASP top 10 prevention (A01:2021 Broken Access Control, A03:2021 Injection, A04:2021 Insecure Design).

### Scope of Change

- **Create**: Threat model document analyzing attack vectors
- **Create**: Authorization test plan verifying role-based access
- **Create**: Input validation test plan (boundary conditions, malformed input)
- **Create**: Data exposure risk assessment (what candidate data is accessible)
- **Create**: Security checklist and findings report
- **Verify**: Authorization middleware correctly checks roles (recruiter, hiring_manager)
- **Verify**: Input validation rejects invalid position IDs (non-numeric, negative, too large)
- **Verify**: Error messages don't expose sensitive information

### Where

- **Threat model**: `docs/SECURITY-THREAT-MODEL-STORY-001.md`
- **Authorization test plan**: `backend/__tests__/security/authorization.test.ts`
- **Input validation tests**: `backend/__tests__/security/inputValidation.test.ts`
- **Data exposure assessment**: `docs/SECURITY-DATA-EXPOSURE-ASSESSMENT.md`
- **Security findings**: `docs/SECURITY-FINDINGS-STORY-001.md`
- **Security checklist**: `docs/SECURITY-CHECKLIST-STORY-001.md`

### Why

Per STORY-001 Technical Design, AC-8: "Only authenticated users with 'recruiter' or 'hiring_manager' role can access this endpoint; Unauthorized users receive 403 Forbidden."

Per STORY-001 Security & Privacy: "Authorization: Enforce role-based access (recruiter, hiring_manager only)" and "Do not expose sensitive data leakage (e.g., do not expose password hashes, internal IDs)."

Per OWASP Top 10 2021:
- A01:2021 Broken Access Control: Verify authorization check prevents unauthorized access
- A03:2021 Injection: Verify SQL injection not possible (Prisma parameterization is sufficient)
- A04:2021 Insecure Design: Verify no data exposure in error messages

### How: Technical Approach

**Step 1**: Conduct threat modeling
- **Asset identification**: Candidate personal data (email, phone, address), interview scores, application notes
- **Threat actors**: Unauthorized recruiters, job seekers, competitors, internal bad actors
- **Attack vectors**:
  1. **Unauthorized access**: User without recruiter role tries to access endpoint
  2. **Privilege escalation**: User with candidate role tries to access endpoint
  3. **Data extraction**: User attempts SQL injection (e.g., positionId = "1 OR 1=1")
  4. **Timing attack**: Measure response time to infer if position exists (before 404)
  5. **Information disclosure**: Error messages leak internal information (database IDs, schema)
  6. **Brute force**: Attacker tries many position IDs to enumerate all positions
  7. **Cross-tenant access**: Recruiter from Company A accesses positions/candidates from Company B
- **Impact**: Confidentiality (PII exposure), Integrity (not applicable, read-only), Availability (DoS via slow queries)

**Step 2**: Design authorization test plan
- **Test 1**: User with recruiter role can access endpoint (returns 200)
- **Test 2**: User with hiring_manager role can access endpoint (returns 200)
- **Test 3**: User with candidate role cannot access endpoint (returns 403)
- **Test 4**: User with employee role (non-recruiter) cannot access endpoint (returns 403)
- **Test 5**: User without valid JWT token cannot access endpoint (returns 401)
- **Test 6**: User with expired JWT token cannot access endpoint (returns 401)
- **Test 7**: Request with malformed Authorization header (e.g., "Bearer") returns 401
- **Test 8**: Request with invalid JWT signature returns 401

**Step 3**: Design input validation test plan
- **Test 1**: Valid position ID (integer, 1): Returns 200 or 404 (depends on existence), not error
- **Test 2**: Invalid position ID (string, "abc"): Returns 400 Bad Request
- **Test 3**: Invalid position ID (float, "1.5"): Returns 400 Bad Request
- **Test 4**: Invalid position ID (negative, "-1"): Returns 400 Bad Request (or 404 if allowed, but document decision)
- **Test 5**: Invalid position ID (too large, "99999999999999999999"): Returns 400 Bad Request (or 404, document decision)
- **Test 6**: Invalid position ID (SQL injection, "1; DROP TABLE Position;"): Treated as literal integer, returns 400 or 404 (not error)
- **Test 7**: Invalid position ID (NULL, ""): Returns 400 Bad Request
- **Test 8**: Invalid position ID (special characters, "1<img src=x>"): Returns 400 Bad Request

**Step 4**: Verify error message sanitization
- **Test 1**: 404 error message does not expose database structure (e.g., "Position table not found")
- **Test 2**: 500 error message does not expose stack trace or internal error details
- **Test 3**: 401 error message is generic (e.g., "Unauthorized") without revealing auth mechanism
- **Test 4**: 400 error message is specific about what's wrong (e.g., "Position ID must be a valid integer") but doesn't expose schema

**Step 5**: Design data exposure assessment
- **Candidate data exposed**: fullName (low risk), email (medium risk, PII), phone (medium risk, PII), address (medium risk, PII)
- **Application data exposed**: applicationDate (low risk), applicationNotes (medium risk, potentially sensitive)
- **Interview data exposed**: averageScore (low risk), currentInterviewStep (low risk, non-PII)
- **Not exposed**: candidate passwords (not fetched), resume file content (not in response)
- **Risk mitigation**: All exposed data is already in candidate/application database; endpoint doesn't introduce new data exposure risk
- **Recommendation**: Log access for audit trail (who accessed which candidates, when)

**Step 6**: Verify cross-tenant isolation (if multi-tenant)
- **Question**: Is LTI multi-tenant (multiple companies)? Check schema for company_id fields.
- **If single-tenant**: No risk; all candidates belong to same company
- **If multi-tenant**: Verify candidate data is filtered by company (not just position). Example:
  ```typescript
  // WRONG: Returns candidates from any company
  const position = await prisma.position.findUnique({ where: { id: positionId }, include: { applications: ... } });
  
  // RIGHT: Filter by company
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: { applications: { where: { candidate: { companyId: userCompanyId } } } },
  });
  ```

**Step 7**: Check for timing attacks
- **Test**: Measure response time for existing vs. non-existent position IDs
- **Expected**: Same response time (both return 404 after same query time)
- **Risk**: If timing differs, attacker can enumerate valid position IDs
- **Mitigation**: If timing differs, add constant delay before 404 (defend-in-depth)

**Step 8**: Document security assumptions
- **JWT is trusted**: Assume auth middleware validates JWT signature (implementation detail, not this task's concern)
- **Database connection is secure**: Assume Prisma/PostgreSQL connection is over SSL (not validated here)
- **No SQL injection possible**: Prisma parameterization prevents SQL injection (not testing, but documenting assumption)
- **Candidate data already in database**: Endpoint doesn't introduce new data sensitivity (already accessible via other endpoints)

**Step 9**: Create security findings report
- **Finding 1**: [Critical/High/Medium/Low] — [Issue title]
  - Description: [What the issue is]
  - Impact: [Why it matters]
  - Evidence: [Test case or code reference]
  - Remediation: [How to fix it]
  - Status: [Open/In Progress/Resolved]
- Example findings:
  - Critical: Authorization check missing (should reject non-recruiter users)
  - High: Error messages expose database schema
  - Medium: Input validation missing (accepts string position IDs without type checking)
  - Low: No audit logging of who accessed candidate data

**Step 10**: Create security checklist
- [ ] Authorization middleware checks role (recruiter, hiring_manager)
- [ ] Unauthorized users receive 403 Forbidden (not 404 or 500)
- [ ] Expired JWT tokens are rejected (401)
- [ ] Invalid position ID (non-numeric) returns 400
- [ ] SQL injection not possible (Prisma parameterization or no raw queries)
- [ ] Error messages don't expose sensitive information (stack traces, database schema)
- [ ] Candidate data filtering respects multi-tenant boundaries (if applicable)
- [ ] Response time doesn't differ based on whether position exists (timing attack prevention)
- [ ] Audit logging in place (optional, but recommended for compliance)
- [ ] Rate limiting considered (optional for MVP, but plan for future)

### Inputs / Outputs / Contracts

**Input**:
- API spec (TASK-STORY-001-API-001) defining attack surface
- Backend implementation (TASK-STORY-001-BACKEND-001) to review
- Authorization system documentation (how roles are checked, JWT validated)
- Database schema (candidate, application, position models)
- Threat model template (OWASP or company standard)

**Output**:
- Threat model document: `docs/SECURITY-THREAT-MODEL-STORY-001.md`
  - List of attack vectors
  - Assets at risk (candidate data)
  - Threat actors and motivations
  - Risk rating for each threat (CVSS or simplified H/M/L)
- Authorization test plan and results: `backend/__tests__/security/authorization.test.ts`
- Input validation test plan and results: `backend/__tests__/security/inputValidation.test.ts`
- Data exposure assessment: `docs/SECURITY-DATA-EXPOSURE-ASSESSMENT.md`
- Security findings report: `docs/SECURITY-FINDINGS-STORY-001.md`
- Security checklist: `docs/SECURITY-CHECKLIST-STORY-001.md` (checked off)

**Contracts**:
- All findings must be actionable (specific issue, clear fix)
- Tests must be reproducible (same conditions → same result)
- Recommendations must align with project risk tolerance and compliance requirements

### Dependencies

- Backend implementation must exist (to review and test)
- Authorization system must be in place (JWT validation, role checking)
- Database schema must be available (to understand data sensitivity)
- Testing tools (Jest for unit/integration tests)

### Acceptance Criteria

- [ ] Threat model document created (lists attack vectors, assets, threat actors)
- [ ] Authorization tests written and all pass (recruiter/hiring_manager can access, others cannot)
- [ ] Input validation tests written and all pass (invalid IDs rejected with 400)
- [ ] Error message sanitization verified (no stack traces, schema exposure, internal IDs)
- [ ] Data exposure assessment completed (documents what candidate data is exposed and risk level)
- [ ] Cross-tenant isolation verified (if multi-tenant) or documented as not applicable
- [ ] Timing attack potential documented and mitigated (if applicable)
- [ ] SQL injection not possible (documented or tested)
- [ ] Security findings report created with all issues documented
- [ ] Security checklist completed and peer-reviewed
- [ ] All critical and high findings resolved (or documented as accepted risk)
- [ ] Medium/low findings logged as future work (or resolved immediately)
- [ ] No new security issues introduced by this feature (compared to existing endpoints)

### Test Requirements

**Authorization Tests**:
- Test: Recruiter can access endpoint (200)
- Test: Hiring manager can access endpoint (200)
- Test: Candidate cannot access endpoint (403)
- Test: User without JWT cannot access endpoint (401)
- Test: User with expired JWT cannot access endpoint (401)
- Test: User with invalid JWT signature cannot access endpoint (401)

**Input Validation Tests**:
- Test: Valid position ID returns 200 or 404
- Test: Non-numeric position ID returns 400
- Test: Negative position ID returns 400 or 404 (document decision)
- Test: Position ID = "1; DROP TABLE Position;" treated as string, returns 400 or 404 (not error)
- Test: Position ID = NULL returns 400
- Test: Position ID with XSS payload returns 400

**Data Exposure Tests**:
- Test: Response includes candidate email (expected)
- Test: Response includes candidate phone (expected)
- Test: Response does not include password hashes (not expected in response)
- Test: Response does not include internal user IDs (if not in AC-6)

**Timing Attack Test**:
- Test: Response time for existing position ≈ response time for non-existent position
- Measure: Time from request to 404 response (should be same for both)

**Manual Testing**:
- Attempt unauthorized access (without JWT): Verify 401
- Attempt with wrong role (candidate): Verify 403
- Attempt SQL injection: Verify input treated as literal, returns 400 or 404
- Review error messages: Verify no sensitive information exposed

### Non-Functional Requirements

**Security Quality**:
- Authorization is enforced at API boundary (no data returned to unauthorized users)
- Input validation is performed server-side (not relied upon client-side only)
- Error messages are user-friendly (not exposing internals)
- Assumptions are documented (JWT is trusted, Prisma is secure)

**Compliance**:
- If GDPR-relevant: Candidate email/phone is PII; document data retention and deletion policies
- If HIPAA-relevant: Interview scores may be sensitive; document data protection measures
- If SOC 2-relevant: Audit logging recommended for access to candidate data

**Defense in Depth**:
- Multiple layers of protection (auth middleware + role check + input validation)
- Fail securely (return 403 before querying database, not after)
- No reliance on single security control

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Authorization check implemented incorrectly (logic error allows unauthorized access) | Write comprehensive auth tests; have peer review code; test with different roles |
| Input validation incomplete (some malicious inputs slip through) | Use allowlist approach (only numeric position IDs accepted); reject anything else with 400 |
| Error messages expose sensitive information (stack traces, database schema) | Review all error responses; use generic messages in production; log detailed errors server-side |
| Multi-tenant isolation broken (recruiter from Company A sees candidates from Company B) | Audit schema; verify all queries filter by company (if multi-tenant) |
| Future developers bypass security checks | Document security assumptions; add comments explaining why checks are needed |
| Timing attack allows position enumeration | Test response times; add constant delay if needed; use constant-time comparison for sensitive decisions |

### Definition of Done

- [ ] Threat model document created and peer-reviewed
- [ ] All authorization tests written and passing (recruiter OK, others denied)
- [ ] All input validation tests written and passing (invalid IDs rejected)
- [ ] Error message sanitization verified (no information disclosure)
- [ ] Data exposure assessment completed
- [ ] Cross-tenant isolation verified (or N/A if single-tenant)
- [ ] SQL injection not possible (documented or tested)
- [ ] Timing attacks considered and mitigated (if applicable)
- [ ] Security findings report created
- [ ] All critical and high findings resolved (or documented as accepted risk with sign-off)
- [ ] Medium and low findings logged (or resolved immediately)
- [ ] Security checklist completed and signed off by security reviewer
- [ ] No new security risks introduced (compared to existing endpoints)
- [ ] Recommendations for future hardening documented (rate limiting, audit logging, etc.)
- [ ] Code review includes security perspective (auth, validation, error handling)
- [ ] Task linked to STORY-001

---
