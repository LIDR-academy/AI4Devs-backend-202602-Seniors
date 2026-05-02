# Tasks for STORY-001: Retrieve Position Candidates in Active Interview Process

**Discipline**: Database  
**Total Tasks**: 2  
**Coverage**: AC-1 (validation), AC-4 (average score data integrity), AC-5 (data integrity)

---

## TASK-STORY-001-DB-001

**Title**: Verify database schema and create migration documentation

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: Database

**Depends On**: None

**Blocks**: TASK-STORY-001-BACKEND-001

---

### Purpose

Verify that the existing PostgreSQL schema with Prisma ORM supports the GET /positions/:id/candidates endpoint without requiring schema changes. Document any indexes needed for query performance. 

Fulfills AC-1 (endpoint must validate position exists), AC-4 (average score calculation requires Interview.score to be nullable), AC-5 (application metadata must be available).

### Scope of Change

- **Create**: None (schema already exists per project setup)
- **Verify**: Existing relations (Position → Application → Candidate, Application → Interview, Interview.score nullability)
- **Validate**: Index coverage for query performance
- **Document**: Schema assumptions, index recommendations, data integrity constraints

### Where

- Schema: `backend/prisma/schema.prisma`
- Models involved: `Position`, `Application`, `Candidate`, `Interview`, `InterviewStep`
- Indexes to verify: `Application.positionId`, `Interview.applicationId`

### Why

Per CLAUDE.md (Layered Architecture), database constraints inform Backend implementation. Query must efficiently fetch:
1. Position by ID (primary key index exists)
2. All Applications for position (needs index on Application.positionId)
3. All Candidate records linked to Applications (FK relationship)
4. All Interview records for each Application (needs index on Interview.applicationId)
5. All scores for average calculation (Interview.score must support NULL for incomplete interviews)

### How: Technical Approach

**Step 1**: Inspect `backend/prisma/schema.prisma` and verify:
- Position model has `@id` on `id` field (primary key)
- Application model has `positionId` field with FK to Position
- Application model has `currentInterviewStep` field (InterviewStep FK)
- Candidate model is correctly related via Application
- Interview model has `applicationId` FK and nullable `score` field
- InterviewStep model includes `name` and `orderIndex` fields

**Step 2**: Check existing Prisma migrations in `backend/prisma/migrations/` to confirm:
- All tables created with correct schema
- No pending migrations needed for this story
- All FK constraints in place

**Step 3**: Review query performance by checking:
- `Application.positionId` has database index (may be implicit in Prisma schema)
- `Interview.applicationId` has database index
- Consider adding explicit indexes if missing (note in recommendations)

**Step 4**: Document schema assumptions:
- Interview.score is nullable (Int? in Prisma)
- All relations are correctly defined
- No soft-delete flags on Application/Interview (hard delete assumed)

### Inputs / Outputs / Contracts

**Input**: 
- `backend/prisma/schema.prisma` (current schema)
- Database connection info from `.env`

**Output**:
- Documentation file: `docs/TASK-STORY-001-DB-SCHEMA-VERIFICATION.md` with:
  - Schema review checklist (✓ for each model/relation verified)
  - Index recommendations (e.g., "Recommend: CREATE INDEX ON Application(positionId)")
  - Data integrity assumptions (Interview.score nullability, FK cascade behavior)
  - Query performance estimate (expected response time for 100 candidates)

**No Schema Changes Required**: This task is verification-only; no DDL statements needed.

### Dependencies

- Database must be running and accessible
- Prisma schema file must exist (confirmed)
- No external dependencies

### Acceptance Criteria

- [ ] Schema.prisma reviewed and all required models/relations present
- [ ] Position → Application → Candidate relation chain verified
- [ ] Application → InterviewStep relation verified
- [ ] Interview → Application relation verified with score nullable
- [ ] Index coverage assessed (recommend indexes if missing)
- [ ] No schema migration required for this story
- [ ] Documentation file created with verification results
- [ ] Performance estimate documented (query complexity, expected <500ms for 100 candidates)

### Test Requirements

**Manual Verification**:
- Connect to PostgreSQL using `psql` and verify table schema:
  ```sql
  \d "Position"
  \d "Application"
  \d "Candidate"
  \d "Interview"
  ```
  Expected: All tables present with correct columns, FKs, NOT NULL constraints

- Check indexes:
  ```sql
  \d+ "Application"
  ```
  Expected: `positionId` indexed (either implicit via FK or explicit)

- Verify nullable score:
  ```sql
  SELECT column_name, is_nullable FROM information_schema.columns 
  WHERE table_name = 'Interview' AND column_name = 'score';
  ```
  Expected: `YES` (column is nullable)

**No automated tests**: This is a schema verification task; testing is manual inspection.

### Non-Functional Requirements

**Data Integrity**:
- Foreign key constraints must be in place (enforced by PostgreSQL)
- Cascade delete behavior: If Position is deleted, all Applications cascade deleted, then all Interviews cascade deleted
- No orphaned Interview records without Application

**Query Performance** (NFR from story):
- Schema must support <500ms query for positions with 100 candidates
- Indexes on `Application.positionId` and `Interview.applicationId` critical
- No N+1 queries expected (Prisma `include` will use JOINs)

**Scalability**:
- Schema supports future pagination (no artificial limits)
- Interview.score data type supports score range (typical 1-5, nullable)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Interview.score is NOT nullable (incomplete interviews have 0 instead of NULL) | Verify in schema; if 0 is used, update AC-4 logic and Backend task to exclude 0 scores |
| Missing indexes on `Application.positionId` or `Interview.applicationId` | Add explicit indexes to Prisma schema or via migration |
| Application soft-delete (isActive flag) not accounted for in schema | Verify no soft-delete flag; query only active applications |
| Schema has changed since initial project setup | This task verifies current state; flag any divergence for tech debt follow-up |

### Definition of Done

- [ ] Schema file reviewed end-to-end
- [ ] All required models and relations present
- [ ] Index coverage assessed and recommendations documented
- [ ] Manual verification queries executed against running database
- [ ] Documentation file created and reviewed
- [ ] No schema changes required (or migration created if changes needed)
- [ ] Backend team can proceed with confidence on schema assumptions
- [ ] Task linked to STORY-001

---

## TASK-STORY-001-DB-002

**Title**: Create performance baseline and index recommendations for position candidates query

**Parent Story**: STORY-001-get-position-candidates

**Discipline**: Database

**Depends On**: TASK-STORY-001-DB-001

**Blocks**: TASK-STORY-001-BACKEND-001 (for performance validation)

---

### Purpose

Establish baseline query performance for the endpoint to ensure it meets the <500ms SLO for up to 100 candidates. Recommend indexes to optimize the query if baseline is slow.

Fulfills AC-1 (endpoint validation), AC-4 (score calculation query performance).

### Scope of Change

- **Create**: Performance test script (SQL or Prisma query) to measure response time
- **Create**: Index recommendations if baseline is >500ms
- **Verify**: Index existence in current schema

### Where

- Test script: `backend/scripts/test-position-candidates-query.sql` or `backend/scripts/test-position-candidates-query.ts`
- Documentation: `docs/TASK-STORY-001-DB-PERFORMANCE.md`
- Schema file (if indexes needed): `backend/prisma/schema.prisma`

### Why

Per STORY-001 NFR: "Query must complete in <500ms for positions with up to 100 active candidates". Database query performance is critical to endpoint response time. Baseline establishes whether indexes are needed. Optimization at DB layer is cheaper than application layer caching.

### How: Technical Approach

**Step 1**: Create test data scenario
- Use existing seed data or add test candidates (if seed has <100)
- Create application with 100+ candidates at various interview stages
- Ensure Interview records with varied scores (some null, some not)

**Step 2**: Measure baseline query performance
- Execute Prisma query that mirrors Backend service logic:
  ```typescript
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      applications: {
        include: {
          candidate: true,
          interviewStep: true,
          interviews: { where: { score: { not: null } } },
        },
      },
    },
  });
  ```
- Measure execution time (use EXPLAIN ANALYZE in psql)
- Record: Query plan, scan type (sequential vs index), number of rows scanned

**Step 3**: Analyze results
- If <500ms: No indexes needed; document findings
- If 500ms-2s: Add recommended indexes (e.g., on Application.positionId)
- If >2s: Investigate deeper (missing indexes, inefficient query plan)

**Step 4**: Recommend indexes (if needed)
- Typical recommendations:
  - CREATE INDEX idx_application_position_id ON Application(positionId)
  - CREATE INDEX idx_interview_application_id ON Interview(applicationId)
  - CREATE INDEX idx_interview_application_score ON Interview(applicationId, score) (covering index for aggregate)

**Step 5**: Validate recommended indexes
- Add indexes to test environment
- Re-measure query time
- Confirm <500ms achieved

### Inputs / Outputs / Contracts

**Input**:
- PostgreSQL database with seed data
- Prisma schema and migrations
- EXPLAIN ANALYZE tool (via psql)

**Output**:
- Baseline performance report: `docs/TASK-STORY-001-DB-PERFORMANCE.md` with:
  - Query execution time (before indexes)
  - Query plan (EXPLAIN output)
  - Number of candidates tested
  - Index recommendations (if any)
  - Post-index performance (if indexes added)
  - Conclusion: "✓ Meets <500ms SLO" or "⚠ Recommend indexes: ..."

- SQL script: `backend/scripts/test-position-candidates-query.sql` (reusable for regression testing)

- Schema changes (if indexes needed): Update `backend/prisma/schema.prisma` with `@@index` directives

### Dependencies

- TASK-STORY-001-DB-001 must complete first (schema verified)
- Database must have 100+ test candidates (use seed data or create fixtures)
- psql or database client tool available

### Acceptance Criteria

- [ ] Baseline query performance measured for 100-candidate scenario
- [ ] Query execution time documented (EXPLAIN ANALYZE output included)
- [ ] Performance vs. <500ms SLO assessed
- [ ] Index recommendations provided (if baseline >500ms)
- [ ] If indexes added: Post-index performance confirms <500ms
- [ ] Test script created for regression testing
- [ ] Performance report documented with findings and recommendations
- [ ] Schema updated (if indexes needed) with Prisma `@@index` directives

### Test Requirements

**Manual Performance Testing**:
- Run baseline query against database with 100+ candidates:
  ```sql
  EXPLAIN ANALYZE
  SELECT p.*, a.*, c.*, s.*, i.*
  FROM "Position" p
  LEFT JOIN "Application" a ON p.id = a."positionId"
  LEFT JOIN "Candidate" c ON a."candidateId" = c.id
  LEFT JOIN "InterviewStep" s ON a."currentInterviewStep" = s.id
  LEFT JOIN "Interview" i ON a.id = i."applicationId" AND i.score IS NOT NULL
  WHERE p.id = 1;
  ```

- Measure: Total execution time, Planning time, Execution time
- Expected (baseline): <500ms for 100 candidates (may vary by hardware)

**Regression Test** (after indexes):
- Re-run same query with indexes in place
- Confirm faster or no degradation

### Non-Functional Requirements

**Performance (Critical)**: 
- Response time <500ms for 100-candidate position (5ms per candidate average)
- Query plan should use index scans, not sequential scans on large tables
- No N+1 pattern (one query with JOINs, not 100+ separate queries)

**Scalability**:
- Query should remain <1s for 1000 candidates (may need pagination in future)
- Indexes should not bloat database beyond acceptable size (<1MB per index)

**Data Consistency**:
- Snapshot isolation (if using MVCC): Concurrent writes should not affect query consistency
- Indexes must be kept in sync with table updates (PostgreSQL handles automatically)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Baseline query is slow (>500ms) without indexes | Add recommended indexes; validate post-index performance |
| Test environment hardware differs from production | Document test environment specs; extrapolate to production expectations |
| Index recommendations add significant storage overhead | Measure index size; balance with query speed improvement |
| Query plan changes with data distribution shifts | Monitor post-deployment; add alerts if performance degrades |

### Definition of Done

- [ ] Baseline query performance measured and documented
- [ ] EXPLAIN ANALYZE output captured and analyzed
- [ ] Performance meets <500ms SLO (or mitigations identified)
- [ ] Index recommendations provided (if baseline slow)
- [ ] Indexes added to schema (if recommended)
- [ ] Post-index performance validated (<500ms confirmed)
- [ ] Test script created for regression testing
- [ ] Performance report finalized and peer-reviewed
- [ ] Backend team has confidence in DB performance for endpoint
- [ ] Task linked to STORY-001

---
