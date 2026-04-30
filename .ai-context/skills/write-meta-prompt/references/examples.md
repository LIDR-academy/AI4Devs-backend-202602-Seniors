# Prompt Examples: Before and After

Real-world transformations for this TypeScript/Express/Prisma project.

## Example 1: New Endpoint

### Before (Vague)
```
"I need an endpoint to search candidates"
```

### After (Structured)
```markdown
# Backend Engineer: Add Candidate Search Endpoint

**Objective**: Implement GET /candidates/search with name and position filters

**Context**:
- Module: `backend/src/presentation/candidateRoutes.ts`
- Architecture: Hexagonal Architecture
- DB: Prisma with Candidate model (see schema.prisma)
- Existing: GET /candidates already exists

**Requirements**:

### Presentation Layer
1. Add `GET /candidates/search?name=&positionId=` route
2. Validate query params (name: string optional, positionId: number optional)
3. Return `{ data: Candidate[] }` with 200

### Application Layer
4. Create `searchCandidates(filters: SearchFilters)` in `CandidateService`

### Infrastructure Layer
5. Add `search(filters: SearchFilters): Promise<Candidate[]>` to `ICandidateRepository`
6. Implement in `PrismaCandidateRepository` using Prisma `where` with `contains`

**Constraints**:
- No full-table scan: add DB index if filtering by positionId
- Max 50 results per call (no pagination needed for search)
- Case-insensitive name search

**Expected Output**:
- Updated `candidateRoutes.ts`
- Updated `CandidateService.ts`
- Updated `ICandidateRepository.ts` and `PrismaCandidateRepository.ts`
- Unit tests for service, integration test for endpoint

**Acceptance Criteria**:
- [ ] Returns filtered candidates correctly
- [ ] Returns empty array (not 404) when no matches
- [ ] Validates and rejects invalid positionId (NaN)
- [ ] All tests pass
```

---

## Example 2: Bug Fix

### Before (Vague)
```
"POST /candidates crashes when no CV is attached"
```

### After (Structured)
```markdown
# Backend Engineer: Fix 500 on POST /candidates Without CV

**Objective**: Return 400 instead of crashing when CV file is missing

**Bug Details**:
- **Severity**: High
- **Affected Endpoint**: `POST /candidates`
- **Error**: `TypeError: Cannot read properties of undefined (reading 'path')` at `candidateRoutes.ts:42`
- **Trigger**: Request with `Content-Type: multipart/form-data` but no `cv` file field

**Current Behavior**:
1. Client POSTs without CV file
2. `req.file` is `undefined`
3. Route handler accesses `req.file.path` → crashes with 500

**Expected Behavior**:
1. Client POSTs without CV file
2. Server validates presence of CV
3. Returns `{ error: "CV file is required" }` with status 400

**Fix Requirements**:
1. Add null-check for `req.file` before accessing `.path`
2. Return 400 with descriptive error message if missing
3. Add regression test for this case

**Expected Output**:
- Fixed `candidateRoutes.ts` with guard
- Test: `it('should return 400 when CV file is missing')`

**Acceptance Criteria**:
- [ ] No crash on missing CV
- [ ] Returns 400 with `{ error: "CV file is required" }`
- [ ] Regression test added and passing
- [ ] Existing tests still pass
```

---

## Example 3: Refactoring

### Before (Vague)
```
"The candidate routes file is doing too much, clean it up"
```

### After (Structured)
```markdown
# Senior Backend Engineer: Refactor Candidates to Hexagonal Architecture

**Objective**: Extract business logic from candidateRoutes.ts into proper layers

**Context**:
- Current File: `backend/src/presentation/candidateRoutes.ts` (~300 lines)
- Current Issues:
  - Prisma calls directly in route handlers
  - No service layer
  - No repository abstraction
  - Hard to unit test (depends on live DB)
- Target: Hexagonal Architecture

**Refactoring Steps**:

### 1. Domain Layer (NEW)
Create `backend/src/domain/candidate/`:
- `Candidate.ts` — domain entity (plain TypeScript, no Prisma)
- `ICandidateRepository.ts` — repository interface

### 2. Infrastructure Layer (NEW)
Create `backend/src/infrastructure/candidate/`:
- `PrismaCandidateRepository.ts` — implements ICandidateRepository using Prisma
- Maps Prisma model → domain Candidate

### 3. Application Layer (NEW)
Create `backend/src/application/CandidateService.ts`:
- Constructor-injected ICandidateRepository
- Methods: `getAll()`, `getById()`, `create()`, `update()`

### 4. Presentation Layer (REFACTOR)
Slim down `candidateRoutes.ts`:
- Inject CandidateService
- Route handlers only: parse input → call service → format response
- Remove all Prisma imports

### 5. Wiring
Update entry point to wire:
```typescript
const repo = new PrismaCandidateRepository(prisma);
const service = new CandidateService(repo);
const router = candidateRoutes(service);
```

**Constraints**:
- Maintain exact same API contract (no response shape changes)
- No new dependencies
- Maintain test coverage (update existing tests)

**Acceptance Criteria**:
- [ ] Domain layer has zero framework imports
- [ ] Route handlers under 15 lines each
- [ ] All existing tests pass (updated for new structure)
- [ ] TypeScript compiles cleanly
```

---

## Example 4: Performance

### Before (Vague)
```
"The positions list with candidates is really slow"
```

### After (Structured)
```markdown
# Backend Engineer: Fix N+1 in GET /positions with Candidates

**Objective**: Eliminate N+1 query loading candidates per position

**Context**:
- Endpoint: `GET /positions`
- Current: Fetches all positions, then 1 query per position to get candidates
- Observed: 50 positions = 51 queries, ~2s response time
- Target: 1 query, <200ms

**Performance Analysis**:
- `PrismaPositionRepository.findAll()` fetches positions only
- Route handler loops and calls `candidateRepository.findByPositionId()` per position
- Result: N+1 queries

**Fix Requirements**:
1. Use Prisma `include: { candidates: true }` in single query
2. Map result to domain type `Position & { candidates: Candidate[] }`
3. Update `IPositionRepository` interface to support eager loading option
4. Remove per-position candidate fetch from route handler

**Expected Output**:
- Updated `PrismaPositionRepository.ts` with `include`
- Updated `IPositionRepository.ts` interface
- Updated route handler (remove loop)
- Integration test verifying single query (use Prisma mock or query count)

**Acceptance Criteria**:
- [ ] Response time <200ms with 50 positions
- [ ] Single DB query (verify with Prisma query log)
- [ ] All tests pass
- [ ] Response shape unchanged
```

---

## Pattern Recognition Guide

| User Says | Task Type | Use Template |
|-----------|-----------|--------------|
| "Create/Add new..." | Feature/Endpoint | Development Task |
| "Fix/Bug/Crash/Error..." | Bug Fix | Bug Fix Task |
| "Test/Add tests..." | Testing | Testing Task |
| "Optimize/Slow/N+1..." | Performance | Performance Task |
| "Refactor/Clean up/Messy..." | Refactoring | Refactoring Task |
| "Review..." | Code Review | Review Task |

### Extract Key Information

Look for:
1. **What**: Endpoint, service, or model name
2. **Where**: File path or layer
3. **Why**: Problem or goal
4. **How**: Architecture pattern to use
5. **Who**: Target role (Dev/SDET/Reviewer)

---

**Last Updated**: April 2026
**Project**: AI4Devs Backend
