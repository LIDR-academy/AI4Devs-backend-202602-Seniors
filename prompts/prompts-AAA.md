# 1) Document data model using skill

```markdown
/document-data-model Document the backend data model in a new markdown file named docs/data-model.md, containing embedded ERD diagrams using Mermaid.
```

---

# 2) Produce the implementation plans for the two new endpoints

````markdown
# Role
Backend developer familiar with the existing codebase architecture, patterns, and conventions.

# Objective
Produce a detailed implementation plan for adding two new backend endpoints to the Applicant Tracking System.

# Context
This is an Applicant Tracking System codebase with the following database structure:
- `candidates` table: stores candidate information including full name
- `applications` table: stores applications linking candidates to positions, includes `current_interview_step` field and `positionId`
- `interviews` table: stores interview records with `score` values

The agent must inspect the codebase to understand:
- Existing routing patterns and endpoint structure
- Database models and ORM usage
- Controller/service layer patterns
- Authentication/authorization approach
- Error handling conventions
- Testing patterns

# Requirements

## Mandatory Endpoints

### PUT /candidates/:id/stage
- Updates the candidate's current stage in the interview process
- Action: modifies the `current_interview_step` field for a specific candidate across all their applications and positions
- Input: `candidateId` from route parameter

### GET /positions/:id/candidates
- Retrieves all candidates currently in process for a given position (all applications for a given `positionId`)
- Response must include:
  - Candidate's full name (from the `candidates` table)
  - `current_interview_step`: the current stage in the process (from the `applications` table)
  - Candidate's average score: mean of the `score` values across all interviews (from the `interviews` table) completed by that candidate

# Resources

Use the data model documentation and any relevant code files to understand the existing structure and provide a consistent implementation plan. Key resources include:
- `docs/data-model.md` for database schema and relationships
- `backend/api-spec.yaml` for API specifications and conventions
- `backend/src/routes` for existing endpoint definitions

# Output format
Produce **two markdown files** for the implementation plans, one for each endpoint. 

The plans must be split by endpoint, hence we will require two different markdown files, one for each endpoint. Each file should be named according to the endpoint it describes (e.g., `update_candidate_stage.plan.md` and `get_position_candidates.plan.md`).

Each plan file MUST include:

1. **Codebase analysis summary**: Key architectural patterns discovered, relevant files identified
2. **Implementation approach**: Step-by-step plan for each endpoint including:
   - Files to create or modify
   - Database queries required
   - Integration points with existing code
3. **Code snippets**: Example implementations following existing codebase conventions
4. **Testing considerations**: How to test the new endpoints based on existing patterns

The plan must be actionable for immediate implementation for any coding agent. It should be detailed enough to guide the development process without ambiguity.
````

---

# 3) Request review of the implementation plans

```markdown
/requesting-code-review Review the implementation plans that have been defined in @docs/get_position_candidates.plan.md  and @docs/update_candidate_stage.plan.md. Adjust them as needed so both plans can be handed over to an AI agent and succeed with the implementation. Use the perspective from the agent @backend-developer following the standards defined in @ai-specs/specs/base-standards.mdc @ai-specs/specs/backend-standards.mdc
```

---

# 4) Backend Developer Reviews "Get Position Candidates" implementation plan

```markdown
@backend-developer Review implementation plan: @docs/get_position_candidates.plan.md 
```

---

# 5) Develop "Get Posiition Candidates"

```markdown
/develop-backend @docs/get_position_candidates.plan.md 
```

---

# 6) Backend Developer Reviews "Update Candidate Stage" implementation plan

```markdown
@backend-developer Review implementation plan: @docs/update_candidate_stage.plan.md
```

---

# 7) Develop "Update Candidate Stage"

```markdown
/develop-backend @docs/update_candidate_stage.plan.md
```

---

# 8) Agent steering fix while implementing tests for "Update Candidate Stage"

The Agent got stuck trying to mock `Prisma` clients with `jest` in the new tests. 

opencode config:

```json
"unsloth/Qwen3.6-27B-GGUF:Q4_K_M": {
    "name": "Qwen3.6-27B Q4_K_M (Local)",
    "limit": {
        "context": 49152,
        "output": 8192
    }
}
```

````markdown
# Steering command
We are half way on the implementation plan for @docs/update_candidate_stage.plan.md. 

We are having problems with the PrismaClient in the new tests. Stop trying to fix them and follow the next steps.

# Test configuration

Consider applying the following similar test setup:

```typescript
// Prisma mock — must be declared BEFORE any module that imports @prisma/client.
//
// We spread jest.requireActual('@prisma/client') into the return value so that
// the real Prisma namespace (including the real PrismaClientInitializationError
// class) is preserved.  This is essential: Candidate.save() uses
// `instanceof Prisma.PrismaClientInitializationError`, and that check only
// passes when both sides reference the same class object from the real package.
// ---------------------------------------------------------------------------
const mockCandidateCreate = jest.fn();
const mockEducationCreate = jest.fn();
const mockWorkExperienceCreate = jest.fn();
const mockResumeCreate = jest.fn();

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');

  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    candidate: {
      create: mockCandidateCreate,
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    education: {
      create: mockEducationCreate,
      update: jest.fn(),
    },
    workExperience: {
      create: mockWorkExperienceCreate,
      update: jest.fn(),
    },
    resume: {
      create: mockResumeCreate,
    },
  }));

  return {
    ...actual,
    PrismaClient: mockPrismaClient,
  };
});

// ---------------------------------------------------------------------------
// Imports (after all jest.mock calls)
// ---------------------------------------------------------------------------
import request from 'supertest';
import express from 'express';
import { addCandidate } from '../application/services/candidateService';

// All the TESTS go here
```
# `supertest` dev dependencies
Consider adding "@types/supertest": "^7.2.0", and "supertest": "^7.2.2" to backend `devDependencies`.
````
---

# 10) Code Review Skill

```markdown
/requesting-code-review Review the latest commits and perform a code review analysis. Propose improvements focusing on clean architecture and backend clean code standards.
```

Produced @docs/code_review_backend_canidates.result.md

---

# 11) Fix code reviewer findings

```markdown
Proceed fixing the findings from @docs/code_review_backend_candidates.result.md.
```