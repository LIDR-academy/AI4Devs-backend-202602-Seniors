# Tasks for STORY-002: Update Candidate Interview Stage

**Discipline**: Database  
**Total Tasks**: 2  
**Coverage**: AC (schema changes required — new `AuditLog` table, migration, and `Application` relation update)

---

## TASK-STORY-002-DB-001

**Title**: Create AuditLog table migration for stage change tracking

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: Database

**Depends On**: None

**Blocks**: TASK-STORY-002-BACKEND-001, TASK-STORY-002-OBSERVABILITY-001

---

### Purpose & Scope

**Purpose**
Create AuditLog table to track all candidate stage transitions for compliance, analytics, and debugging. This supports the mandatory audit logging requirement per the story's non-functional requirements and security/privacy section.

Fulfills AC: "Audit logging: Every stage update logs timestamp, user ID, application ID, old stage, new stage, to support compliance"

**Scope of Change**
- Create: AuditLog table in Prisma schema with fields: id, action, userId, applicationId, oldStageId, newStageId, timestamp, details (JSONB)
- Create: Database migration to create the table with indexes on applicationId and timestamp
- Modify: Prisma schema to add AuditLog model with relations to Application and Employee tables

**Where**
- Schema: `backend/prisma/schema.prisma` (add AuditLog model)
- Migration: `backend/prisma/migrations/[timestamp]_create_audit_log_table/` (new directory)

**Why**
Per story's security & privacy section: "Audit logging is mandatory: Every transition is logged to support: Compliance audits (who moved candidates when), Analytics on interview stage velocity, Debugging of accidental moves, Future analytics queries."

Per CLAUDE.md architecture: Prisma ORM is used for all database interactions. No custom SQL.

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Define AuditLog schema** in Prisma:
   ```prisma
   model AuditLog {
     id        Int      @id @default(autoincrement())
     action    String   // e.g., 'STAGE_UPDATE'
     userId    Int      // from JWT token
     applicationId Int  @db.Integer
     oldStageId Int?    // nullable for first transition
     newStageId Int     // required
     timestamp DateTime @default(now())
     details   Json?    // optional notes, reason for change
     
     application Application @relation(fields: [applicationId], references: [id])
     @@index([applicationId])
     @@index([timestamp])
   }
   ```

2. **Create migration file**:
   ```bash
   npx prisma migrate dev --name create_audit_log_table
   ```
   This generates SQL in `backend/prisma/migrations/[timestamp]_create_audit_log_table/migration.sql`

3. **Verify schema is valid**:
   ```bash
   npx prisma validate
   ```

4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

**Inputs / Outputs / Contracts**

**Database Schema Change:**
```sql
CREATE TABLE "AuditLog" (
  "id" SERIAL PRIMARY KEY,
  "action" VARCHAR(50) NOT NULL,
  "userId" INTEGER NOT NULL,
  "applicationId" INTEGER NOT NULL,
  "oldStageId" INTEGER,
  "newStageId" INTEGER NOT NULL,
  "timestamp" TIMESTAMP DEFAULT NOW(),
  "details" JSONB,
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
);

CREATE INDEX idx_audit_log_application ON "AuditLog"("applicationId");
CREATE INDEX idx_audit_log_timestamp ON "AuditLog"("timestamp");
```

**Prisma Model Output:**
```typescript
model AuditLog {
  id            Int         @id @default(autoincrement())
  action        String      // 'STAGE_UPDATE'
  userId        Int
  applicationId Int
  oldStageId    Int?
  newStageId    Int
  timestamp     DateTime    @default(now())
  details       Json?
  
  application   Application @relation(fields: [applicationId], references: [id])
  
  @@index([applicationId])
  @@index([timestamp])
}
```

**Dependencies**
- STORY-001 backend must be deployed first (Application table must exist)
- No external services required

---

### Acceptance Criteria

- [ ] AuditLog table created with columns: id, action, userId, applicationId, oldStageId, newStageId, timestamp, details
- [ ] Foreign key constraint on applicationId references Application.id
- [ ] Index on applicationId for fast lookup (audit logs by application)
- [ ] Index on timestamp for time-range queries (audit logs by date)
- [ ] Prisma schema updated with AuditLog model and relations
- [ ] Migration file generated and can be applied successfully
- [ ] `npx prisma validate` passes with no schema errors
- [ ] Prisma client regenerates without errors
- [ ] Migration strategy is forward-only (Prisma `migrate dev` generates `migration.sql`, no automatic down scripts); rollback documented as a manual fix-up migration: generate reversal SQL with `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-empty --script` and apply via a new migration

---

### Test Requirements

**Unit Tests** (N/A for database schema creation)

**Integration Tests**
- Test that AuditLog table exists and has correct columns (query `information_schema.columns`)
- Test that foreign key constraint is enforced (attempt to insert invalid applicationId, expect error)
- Test that indexes exist (`SELECT * FROM pg_indexes WHERE tablename = 'AuditLog'`)
- Test forward migration on a clean database: apply `migration.sql`, verify table and indexes exist (no rollback test — Prisma is forward-only; rollback requires a manual fix-up migration)

**Manual Testing / Regression Scope**
- Verify no existing data is affected (Application, Candidate tables unchanged)
- Verify migration runs successfully on fresh database
- Verify migration is idempotent (running twice doesn't error)

---

### Non-Functional Requirements

**Performance**
- Indexes on applicationId and timestamp ensure audit log queries complete in <100ms
- No performance impact on Application table (FK constraint is standard, minimal overhead)

**Reliability**
- Migration must be reversible (rollback plan included)
- No data loss on rollback
- Transaction safety: table creation is atomic

**Scalability**
- AuditLog table will grow with each stage update (~5-10 rows per candidate per hiring cycle)
- Indexes prevent slow queries as table grows
- JSONB details field allows flexible audit data without schema changes

---

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Migration fails on production | Test migration locally and on staging before production deploy |
| Foreign key constraint breaks existing data | Verify applicationId references are valid before migration |
| Index creation locks table | Use `CONCURRENTLY` option if running on active database (future optimization) |
| Details JSONB field becomes unindexed bottleneck | Add GIN index on details if queries on details become common (future task) |

---

### Definition of Done

- [ ] AuditLog table created in PostgreSQL with correct schema
- [ ] Prisma schema updated and validated
- [ ] Prisma client regenerated
- [ ] Migration file exists and is reversible
- [ ] Integration test verifies table structure (columns, types, constraints)
- [ ] No errors when running `npx prisma validate`
- [ ] Indexes verified with `SELECT * FROM pg_indexes`
- [ ] Code reviewed and approved
- [ ] Merged to main branch

---

## TASK-STORY-002-DB-002

**Title**: Verify Application table indexes for stage update queries

**Parent Story**: STORY-002-update-candidate-stage ([link](/stories/STORY-002-update-candidate-stage.md))

**Discipline**: Database

**Depends On**: None (existing table, no changes needed)

**Blocks**: TASK-STORY-002-BACKEND-001 (performance validation before backend implementation)

---

### Purpose & Scope

**Purpose**
Verify that existing indexes on Application table support efficient stage update queries. The story specifies a <200ms performance SLO for stage updates; indexes on applicationId and currentInterviewStep ensure fast lookups during the update operation.

Fulfills AC: "Performance: Stage update completes in <200ms (simple FK update, no heavy queries)"

**Scope of Change**
- No schema changes required
- Verify: Application table has index on `id` (primary key, automatic)
- Verify: Application table has index on `currentInterviewStep` (for FK constraint)
- Analyze: Query execution plans for update statements to confirm sub-200ms performance

**Where**
- Database: `LTIdb` PostgreSQL instance
- Existing table: `Application` (no modifications)

**Why**
Per story's technical design: "Validation order: Parse applicationId → Authenticate → Authorize → Fetch Application and related Position, InterviewFlow → Validate interviewStepId exists in flow → Update and audit log → Return."

The fetch and update steps must be fast. Prisma generates SQL with FK constraints and indexes; verification ensures they're optimal.

---

### Implementation Guidance

**How: Technical Approach & Implementation Steps**

1. **Query existing indexes on Application table**:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'Application';
   ```
   Verify indexes exist on: `id`, `positionId`, `candidateId`, `currentInterviewStep`

2. **Analyze update query execution plan**:
   ```sql
   EXPLAIN ANALYZE UPDATE "Application" 
   SET "currentInterviewStep" = 2 
   WHERE "id" = 3;
   ```
   Look for: Sequential scan should NOT occur; index should be used. Execution time <50ms.

3. **Test fetch + update query**:
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM "Application" 
   WHERE "id" = 3;
   ```
   Then verify update completes in <150ms total (fetch <50ms + update <100ms).

4. **Document findings**:
   - Index status (all present or missing)
   - Query execution times (actual vs SLO)
   - Recommendations (if any index is missing or slow)

**Inputs / Outputs / Contracts**

**SQL Queries to Execute:**
```sql
-- Verify indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Application';

-- Test fetch performance
EXPLAIN ANALYZE SELECT * FROM "Application" WHERE "id" = 3;

-- Test update performance
EXPLAIN ANALYZE UPDATE "Application" SET "currentInterviewStep" = 2 WHERE "id" = 3;

-- Test with FK lookup (simulating full flow)
EXPLAIN ANALYZE 
SELECT a.*, p.id as position_id, s.id as step_id
FROM "Application" a
JOIN "Position" p ON a."positionId" = p.id
LEFT JOIN "InterviewStep" s ON a."currentInterviewStep" = s.id
WHERE a.id = 3;
```

**Performance Baseline Output:**
```
Execution Plan Summary:
- Application table fetch: ~10-20ms
- Update currentInterviewStep: ~5-10ms
- Total: ~15-30ms (well under 200ms SLO)

Indexes verified: ✓ id (PK), ✓ positionId (FK), ✓ currentInterviewStep (FK)
```

**Dependencies**
- Application table must exist (created in STORY-001)
- PostgreSQL `pg_stat_statements` extension helpful (already available in docker-compose setup)

---

### Acceptance Criteria

- [ ] Verify Application table has index on `id` (primary key)
- [ ] Verify Application table has index on `positionId` (foreign key)
- [ ] Verify Application table has index on `candidateId` (foreign key)
- [ ] Verify Application table has index on `currentInterviewStep` (foreign key)
- [ ] Execute EXPLAIN ANALYZE on fetch query (WHERE id = X); verify <50ms
- [ ] Execute EXPLAIN ANALYZE on update query (SET currentInterviewStep = Y); verify <100ms
- [ ] Total update + fetch time is <200ms per SLO
- [ ] No sequential scans in execution plans (all use indexes)
- [ ] FK constraints present and enforced

---

### Test Requirements

**Integration Tests**
- Query: `SELECT * FROM pg_indexes WHERE tablename = 'Application'` verify all FKs indexed
- Query: `EXPLAIN ANALYZE SELECT * FROM "Application" WHERE "id" = ?` verify index usage
- Query: `EXPLAIN ANALYZE UPDATE "Application" SET "currentInterviewStep" = ? WHERE "id" = ?` verify <100ms
- Load test: Insert 1000 applications, verify update time still <200ms (no performance degradation)

**Manual Testing / Regression Scope**
- Run EXPLAIN ANALYZE queries manually on staging database
- Document baseline performance for future comparison
- Verify no other Application queries were broken by this analysis

---

### Non-Functional Requirements

**Performance**
- Application fetch: <50ms (index on id used)
- Application update: <100ms (index on currentInterviewStep used)
- Total stage update: <200ms SLO

**Reliability**
- Indexes must be present and valid
- FK constraints enforced
- No missing indexes that would cause sequential scans

---

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Indexes are missing (sequential scans occur) | Add missing indexes before backend implementation |
| Update query is slow even with indexes | Consider query optimization (app-side batching, caching) |
| Load test shows degradation at scale | Plan for index optimization or partitioning (future task) |

---

### Definition of Done

- [ ] All expected indexes verified on Application table
- [ ] EXPLAIN ANALYZE queries executed and documented
- [ ] Execution plans show index usage (no sequential scans)
- [ ] Performance baseline documented: fetch <50ms, update <100ms, total <200ms
- [ ] If any index missing: created and tested
- [ ] Load test with 1000+ applications passes
- [ ] Documentation updated with performance baseline
- [ ] Code review complete (verification script added to docs or repo)
- [ ] Result shared with backend team before implementation begins
