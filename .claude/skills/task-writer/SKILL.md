---
name: task-writer
description: |
  Decompose enriched user stories into precise, implementation-ready engineering tasks across all delivery disciplines.
  
  Given an enriched user story (from the enriched-user-stories skill) with acceptance criteria, technical design, and project analysis linkage, generate a complete set of discipline-specific tasks (Backend, Frontend, Database, API, QA, DevOps, Security, Observability, Documentation) that collectively cover the story's full scope with zero functional or technical gaps.
  
  Each task includes: purpose, scope of change, exact file/component locations, implementation guidance, dependencies, acceptance criteria, test requirements, risks, and explicit traceability back to the parent story and project analysis.
  
  Use this skill whenever you need to break an enriched user story into actionable engineering work, assign tasks to specific teams, validate that a story's decomposition is technically complete and correctly ordered, or transition from story planning to sprint execution.
---

# Task Writer Skill

## Quick Start

### When to Use

Invoke this skill:
1. **After writing an enriched user story** (using enriched-user-stories skill)
2. **Before sprint planning** (to prepare tasks for team assignment)
3. **To validate story completeness** (coverage matrix proves all ACs are covered)
4. **To assign work across disciplines** (each task clearly identifies which team owns it)

### Basic Invocation

```
Create enriched tasks for this user story:
Input: [/path/to/STORY-XXX.md or paste story text]
Project context: [optional: CLAUDE.md path or brief architecture summary]
Validation level: [basic | deep] (default: basic)
Output format: [separate files per discipline | single file with sections]
```

### Examples

**Example 1: Simple story (file input)**
```
Create enriched tasks for this user story:
Input: /stories/STORY-042-multiple-resume-uploads.md
Project context: /CLAUDE.md
Validation level: deep
Output format: separate files per discipline
```

**Example 2: Complex story (inline text)**
```
Create enriched tasks for this user story:
Input: 
  # STORY-045: Resume Upload with GDPR Compliance
  
  As a candidate, I want to upload and manage my resumes...
  [full story text]

Validation level: basic
Output format: separate files per discipline
```

---

## Inputs & Outputs

### Accepted Inputs

**Option A: File Path**
- Path to enriched story file: `/path/to/STORY-XXX.md` or `/stories/STORY-XXX.md`
- Skill reads file directly and parses all sections

**Option B: Inline Story Text**
- Full story pasted in prompt (markdown format)
- Skill parses from text

**Project Context (optional)**
- CLAUDE.md path (architecture, tech stack, common patterns)
- If provided, skill uses architectural constraints (e.g., ADRs, patterns) to inform task design
- If omitted, skill infers context from story's technical design and analysis linkage sections

### Outputs

**Per-Discipline Task Files** — only generate a file for disciplines the story explicitly impacts

| File | Discipline | Required? |
|------|-----------|-----------|
| `/tasks/TASK-STORY-XXX-BACKEND.md` | Backend tasks | Only if story impacts backend logic/services |
| `/tasks/TASK-STORY-XXX-FRONTEND.md` | Frontend tasks | Only if story impacts UI/components |
| `/tasks/TASK-STORY-XXX-DATABASE.md` | Database tasks | Only if story changes schema/migrations/indexes |
| `/tasks/TASK-STORY-XXX-API.md` | API / Contract tasks | Only if story adds/modifies API endpoints or contracts |
| `/tasks/TASK-STORY-XXX-QA.md` | QA / Testing tasks | Only if story requires new test strategy or test suite |
| `/tasks/TASK-STORY-XXX-DEVOPS.md` | DevOps / Infrastructure tasks | Only if story changes deployment, CI/CD, feature flags, or infra |
| `/tasks/TASK-STORY-XXX-SECURITY.md` | Security tasks | Only if story touches auth, data protection, or compliance |
| `/tasks/TASK-STORY-XXX-OBSERVABILITY.md` | Observability tasks | Only if story requires new logging, metrics, or alerting |
| `/tasks/TASK-STORY-XXX-DOCUMENTATION.md` | Documentation tasks | Only if story requires new or updated public docs/runbooks |

**Discipline selection rule:** Before generating any file, check the story's "Affected Systems & Domains" and "Technical Design" sections. Only create a discipline file when at least one AC or NFR requires work in that discipline. Do not generate empty or placeholder files for unimpacted disciplines.

**Coverage & Validation Report** — always required
- `/tasks/TASK-STORY-XXX-COVERAGE.md` (Coverage matrix, task dependency graph, validation results)

**All files saved to** `/tasks/` using the pattern `/tasks/TASK-STORY-XXX-[DISCIPLINE].md`

**Repository guidelines for all generated `tasks/TASK-*.md` files:**
- Each file must be **discipline-specific** (one discipline per file; no mixed-discipline files)
- **Only in-scope disciplines get a file** — omitting a discipline file means the story has no work in that area (not an oversight)
- Each task must include **15+ required sections** (Purpose, Scope, Where, Why, How, Inputs/Outputs, Dependencies, Acceptance Criteria, Unit Tests, Integration Tests, E2E Tests, Manual Testing, NFRs, Risks & Mitigations, Definition of Done)
- The Coverage file must prove **100% acceptance criteria coverage** (every AC mapped to at least one task in the coverage matrix)

---

## Task Decomposition Strategy

### Derive Tasks From Three Dimensions

**Dimension 1: Per Acceptance Criterion**
- Each acceptance criterion (AC) typically triggers one or more tasks across disciplines
- Example AC: "Resume upload returns HTTP 201 with file metadata"
  → Database task (store metadata), Backend task (endpoint + validation), 
  → Frontend task (handle 201 response), QA task (test 201 behavior)

**Dimension 2: Per Impacted Layer**
- Technical Design identifies affected systems/layers (Backend services, Frontend components, Database schema, APIs, DevOps config)
- Each impacted layer gets at least one task to implement its changes
- Example: "Implement resume upload service"
  → Backend service task, Database schema task, API contract task

**Dimension 3: Per Impacted Discipline**
- Non-functional requirements (NFRs) and risks spawn security, observability, DevOps, documentation tasks
- Example: "File upload must respect 10MB limit and timeout after 30s"
  → Backend validation task, Security task (prevent DoS), Observability task (add metrics)

### Granularity Rules

**Task is TOO SMALL if:**
- It spans fewer than 15 minutes of work
- It cannot be meaningfully reviewed or tested independently
- It requires constant context-switching to a dependent task

**Task is TOO LARGE if:**
- It spans more than 3-5 days of work for a skilled engineer
- It requires coordination across more than 2 disciplines
- A junior engineer cannot understand full scope after reading once

**Sweet Spot:** 1-3 days of work, single discipline, independently testable

### Ordering & Dependencies

**Strict Order (DB → Backend → Frontend → QA):**
1. **Database**: Schema changes must complete before Backend queries them
2. **Backend**: Business logic + endpoints must exist before Frontend consumes them
3. **Frontend**: Components must integrate with real (or stubbed) Backend APIs
4. **QA**: Tests only run against complete Backend + Frontend + Database

**Parallel Tracks (no blocking dependencies):**
- Documentation tasks (if spec is complete)
- DevOps config (if requirements are clear)
- Security threat analysis (if arch is finalized)
- Observability instrumentation (low-blocker, can happen during or after implementation)

---

## Task Categories Reference

| Category | Purpose | Typical Triggers |
|----------|---------|------------------|
| **Database** | Schema, migrations, indexes, data backfill, rollback plans | Technical Design lists new/modified tables; AC requires data storage; NFR specifies indexing/performance |
| **Backend** | Domain models, services, business logic, validations, error handling, transactional boundaries | Technical Design describes business rules; AC tests service behavior; Domain layer requires new logic |
| **API / Contract** | Endpoint definitions, request/response payloads, versioning, OpenAPI/GraphQL specs, error responses | AC tests HTTP behavior; Technical Design specifies endpoints; External integrations require contracts |
| **Frontend** | UI components, state management, routing, API integration, form validation, error/empty/loading states, accessibility, i18n | AC describes user-facing behavior; Technical Design specifies screens/flows; UX friction in discovery |
| **QA / Testing** | Test strategy, test cases (unit/integration/E2E), test data, automation, regression scope, performance testing | AC must be testable; Technical Design identifies critical paths; NFRs require perf/load testing |
| **DevOps / Infrastructure** | CI/CD pipelines, environment config, feature flags, secrets management, deployment runbooks, rollback procedures | Technical Design lists dependencies; NFRs specify availability/uptime; Risk assessment identifies rollout concerns |
| **Security** | Authentication, authorization, data protection, input validation, threat modeling, compliance (GDPR, HIPAA, etc.) | Technical Design touches auth/data; AC involves PII; Risk assessment flags security gaps; Compliance requirements exist |
| **Observability** | Logging, metrics, tracing, alerts, dashboards, performance monitoring, health checks | Technical Design identifies critical paths; NFRs specify SLOs; Ops team needs visibility into new feature |
| **Documentation** | Technical design docs, runbooks, troubleshooting guides, user-facing docs, API reference, deployment instructions | Skill transitions to Ops; New workflows require runbooks; API changes need reference updates |

---

## Mandatory Task Structure

**Every enriched task MUST include all sections below.** Use this template for consistency.

### Task Header
```
## TASK-[STORY-ID]-[DISCIPLINE]-[SEQUENCE]

**Title**: [Concise, action-oriented title]

**Parent Story**: STORY-XXX-[title] ([link])

**Discipline**: [Backend | Frontend | Database | API | QA | DevOps | Security | Observability | Documentation]

**Depends On**: [List of TASK-IDs, or "None"]

**Blocks**: [List of TASK-IDs, or "None"]
```

### Purpose & Scope

**Purpose**
- Explain why this task exists
- Which acceptance criteria / technical requirements it fulfills
- Format: "This task implements [feature]. Fulfills AC: [AC text]. Rationale: [why needed per analysis]"

**Scope of Change**
- Exactly what must change (create, modify, delete)
- Format: "Create: [X], Modify: [Y], Delete: [Z]"

**Where: Impacted Files, Components, Tables, Endpoints**
- Specific locations in codebase and database
- Format: Full paths (backend/src/..., frontend/src/..., backend/prisma/...)

**Why: Rationale & Project Analysis Linkage**
- Connect change to enriched story and project analysis
- Reference discovery research, ADRs, business case, tech debt, OKRs (with document names/section anchors)

### Implementation Guidance

**How: Technical Approach & Implementation Steps**
- High-level steps (1-5 steps, each achievable in < 1 day)
- Technology choices, patterns, architectural constraints to respect

**Inputs / Outputs / Contracts**
- Request/response payloads, data shapes, API signatures, event schemas
- Database schema changes, TypeScript types

**Dependencies**
- Other tasks, services, teams required first
- Format: "TASK-XXX-[other task], Service X must be deployed, Team Y must review"

### Acceptance Criteria

**Task-Level Acceptance Criteria**
- Specific, testable, not vague
- Format: Checklist of [ ] items

### Test Requirements

**Unit Tests**
- Test individual functions in isolation
- Format: Function name, input → expected output, edge cases

**Integration Tests**
- Test service interactions with database, external APIs
- Format: Scenario, setup, action, assertion

**End-to-End Tests**
- Test full flow from Frontend → Backend → Database
- Format: User action, expected HTTP response, expected DB state

**Manual Testing / Regression Scope**
- Tests requiring human judgment or cross-browser testing
- Regression tests that must pass to ensure no side effects

### Non-Functional Requirements

**Performance, Security, Accessibility, Scalability, Reliability, Observability**
- Quantified where possible (e.g., "complete in < 30s for 10MB file")

### Risks & Mitigations

- Identified risk, how to mitigate it

### Definition of Done

Checklist of [ ] items that must all be checked when task is complete

---

## Discipline-Specific Enrichment Rules

### Database Tasks

Must explicitly answer:
1. **Schema Change**: Should schema change? Why? Which tables/columns? Data types, nullability, defaults, constraints?
2. **Migration Strategy**: Forward DDL, data backfill, rollback plan, zero-downtime strategy, performance impact
3. **Indexing Strategy**: Which columns to index? Index type? Rationale?
4. **Data Validation & Constraints**: NOT NULL, UNIQUE, FK, CHECK constraints; domain constraints (e.g., fileSize > 0)

### Backend Tasks

Must explicitly answer:
1. **Affected Services & Modules**: Which services created/modified? Domain models? Integration points?
2. **Endpoints** (if applicable): HTTP method, path, query params, request body schema, response schemas (all status codes)
3. **Business Rules & Validation**: Domain constraints, validation logic location (service or controller?), error handling
4. **Error Handling**: What errors can occur? How mapped to HTTP codes? What error message to client?
5. **Transactional Boundaries**: What must be atomic? How to maintain consistency if multi-step?
6. **Integration Points**: External services (S3, email, etc.), dependencies on other domain models/services

### Frontend Tasks

Must explicitly answer:
1. **Affected Screens & Components**: Which screens impacted? New components? Existing components modified?
2. **User-Facing Behavior per AC**: For each AC, describe UX interaction, UI state transitions, expected feedback
3. **State & Data Flow**: Component state variables, API call flow, state management approach (local vs Redux/Context)
4. **Validation, Error States, Empty States, Loading States**: Client-side validation, error message presentation, empty state, loading state
5. **Accessibility (WCAG)**: Semantic HTML, keyboard navigation, screen reader announcements, color contrast
6. **Responsiveness & Layout**: Mobile, tablet, desktop layouts; touch-friendly sizing; progress bar scaling
7. **Internationalization (i18n)**: Translatable string keys (no hardcoded strings)
8. **Analytics & Events**: What events should be tracked? Event payloads?

### API / Contract Tasks

Must explicitly answer:
1. **Endpoint Definitions**: HTTP method, path, query params, headers, request schema, response schema (all status codes)
2. **Versioning & Backwards Compatibility**: New endpoint (v1) or update to existing? Deprecation plan?
3. **OpenAPI / GraphQL Schema Update**: Update spec file with endpoint definitions
4. **Error Response Format**: Consistent error schema across all endpoints; error codes

### QA / Testing Tasks

Must explicitly answer:
1. **Test Strategy**: Test types (unit, integration, E2E, manual, performance); scope per AC; environments
2. **Test Cases Mapped to ACs**: For each AC, list test cases (happy path + error paths)
3. **Test Data & Fixtures**: What test data needed? How provisioned? Factory functions?
4. **Automation Coverage**: Which tests automated (Jest, Cypress)? Which manual? CI/CD integration?
5. **Regression Scope**: What existing functionality might be affected? Which tests must pass to ensure no regression?

### DevOps / Infrastructure Tasks

Must explicitly answer:
1. **CI/CD Pipeline Changes**: Any new build steps, tests, linting? Deployment steps? Rollback procedure?
2. **Environment Configuration**: Environment variables, secrets, feature flags; differences between local, staging, prod
3. **Infrastructure Provisioning**: Database changes, S3 bucket creation/permissions, VPC, security groups, IAM roles
4. **Deployment Strategy**: Blue-green, canary, rolling update? Rollout timeline? Monitoring plan?
5. **Feature Flags** (if applicable): Flag name, default value, ramp-up plan (% of users over time)

### Security Tasks

Must explicitly answer:
1. **Threat Model**: What security risks? What attacks might be attempted? How mitigated?
2. **Authentication & Authorization**: Who is allowed (authn)? Can user A access user B's data (authz)? Token expiry?
3. **Data Protection**: Encryption at rest, in transit; data retention & deletion; GDPR/HIPAA compliance
4. **Input Validation & Sanitization**: File validation, filename sanitization, error message sanitization
5. **Compliance** (if applicable): GDPR, HIPAA, SOC 2; data residency; data sharing restrictions

### Observability Tasks

Must explicitly answer:
1. **Logging Strategy**: What events should be logged? Log level? Log format (JSON with structured fields)?
2. **Metrics & Dashboards**: Key metrics (latency, error rate, throughput)? Prometheus counters/histograms? Grafana dashboard?
3. **Alerting**: When should on-call engineers be paged? Alert thresholds?
4. **Tracing** (if applicable): Distributed trace ID, spans across Frontend → Backend → S3/DB
5. **Health Checks & Readiness**: How to know service is healthy? Readiness check for orchestration?

### Documentation Tasks

Must explicitly answer:
1. **Technical Documentation**: Architecture diagram, API reference, database schema, code structure
2. **Operational Runbook**: Deployment steps, troubleshooting guide, rollback procedure, monitoring
3. **User-Facing Documentation** (if applicable): How to use feature, supported formats, limits, FAQ

---

## Traceability & Coverage Rules

### Coverage Matrix Template

Every AC must map to at least one task. Use this matrix to prove full coverage:

```
| AC # | Acceptance Criterion | Task ID(s) | Discipline(s) |
|------|----------------------|-----------|---|
| 1 | [AC text] | TASK-XXX-BACKEND-001, TASK-XXX-DB-001 | Backend, Database |
| 2 | [AC text] | TASK-XXX-FRONTEND-001, TASK-XXX-QA-001 | Frontend, QA |
| ... | ... | ... | ... |
```

### Traceability Rules

1. **Every task traces to parent story**: Task includes "Parent Story: STORY-XXX-[title]"
2. **Every task traces to ACs**: Task includes "Fulfills AC: [list AC numbers]"
3. **Every task traces to analysis**: Task includes "Why: Rationale & Project Analysis Linkage" with explicit references to discovery research, ADRs, business case, OKRs
4. **Every task has dependencies**: Task includes "Depends On: [TASK IDs]"
5. **Every task is independently testable**: Task includes "Test Requirements" with unit/integration/E2E tests

### Full Coverage Validation Checklist

- [ ] Every AC mapped to at least 1 task in coverage matrix
- [ ] No AC is unmapped
- [ ] Every task traces back to story and analysis
- [ ] Only disciplines impacted by the story have task files (no empty or out-of-scope discipline files)
- [ ] COVERAGE.md is present (always required regardless of discipline scope)
- [ ] Database tasks complete before Backend tasks (when both are in scope)
- [ ] Backend tasks complete before Frontend tasks (when both are in scope)
- [ ] Frontend tasks complete before QA tasks (or run in parallel) (when both are in scope)
- [ ] Security, Observability, DevOps, Documentation tasks have explicit dependencies (run during or after implementation, not blocking)
- [ ] Total task count matches story scope (no "gold plating" or out-of-scope tasks)

---

## Validation Rules

### Basic Validation (Default)

Check that every task includes:
- [ ] Task ID & Title
- [ ] Parent Story reference
- [ ] Discipline
- [ ] Depends On / Blocks
- [ ] Purpose section
- [ ] Scope of Change section
- [ ] Where section
- [ ] Why section (with project analysis references)
- [ ] How section
- [ ] Inputs/Outputs/Contracts section
- [ ] Dependencies section
- [ ] Acceptance Criteria (at least 3-5 items)
- [ ] Test Requirements section
- [ ] NFRs section
- [ ] Risks & Mitigations section
- [ ] Definition of Done section

### Deep Validation

In addition to basic:
- [ ] Acceptance criteria are specific (not vague: "should work", "properly", "as needed")
- [ ] Project analysis references are explicit (document/section anchors, not "per analysis")
- [ ] Task dependencies form correct ordering (DB → Backend → Frontend → QA)
- [ ] No circular dependencies
- [ ] Coverage matrix shows every AC mapped to at least one task
- [ ] No task is out of scope (task must fulfill at least one AC)
- [ ] Discipline-specific enrichment rules are followed (e.g., Database task includes migration strategy)
- [ ] Test requirements are testable (not just "test it")
- [ ] Risks have mitigations (not just listing problems)
- [ ] Definition of Done is complete and actionable

---

## Worked Example: Story → Enriched Tasks

### Input Story

```
# STORY-042: Multiple Resume Uploads

## Narrative & Business Value
As a candidate, I want to upload multiple resume versions so that I can tailor my application 
for different roles without creating multiple candidate profiles.

Business Impact: May 2024 research showed 12/12 candidates failed at upload step. Enabling 
multiple uploads increases application completion by 15% (78% → 85%).

## Acceptance Criteria
- [ ] Candidates can upload resume file and receive HTTP 201 with file metadata
- [ ] Uploading > 10MB file is rejected with HTTP 400 "File exceeds 10MB limit"
- [ ] Duplicate file (same checksum) is rejected with HTTP 409 "File already uploaded"
- [ ] Only .pdf, .docx, .txt files accepted; others rejected with HTTP 400
- [ ] Candidate detail page displays list of uploaded resumes with delete button
- [ ] Deleting resume also removes file from S3 (cascading delete)
- [ ] File upload timeout after 30 seconds returns HTTP 408
- [ ] All uploaded files encrypted in S3, private (no public access)

## Technical Design
- Affected Systems: Backend (Resume service), Database (Resume table), Frontend (upload component), Storage (AWS S3)
- Data Model: Resume table with (id, candidateId FK, filePath, fileHash UNIQUE, checksum, uploadedAt, uploadStatus)
- API: POST /resumes (multipart/form-data { file, candidateId }) → HTTP 201 { id, fileHash, uploadedAt }

## Non-Functional Requirements
- Performance: Upload < 30s for 10MB file
- Security: S3 bucket private, authenticate via JWT, GDPR Article 17 (right-to-erasure)
```

### Output Task Set (Summary)

**Generated Files:**
1. `TASK-STORY-042-DATABASE.md` (Schema, migration, indexes)
2. `TASK-STORY-042-BACKEND.md` (Endpoint, validation, service layer)
3. `TASK-STORY-042-API.md` (OpenAPI spec update)
4. `TASK-STORY-042-FRONTEND.md` (Upload component, list component, state management)
5. `TASK-STORY-042-QA.md` (Test strategy, test cases, automation)
6. `TASK-STORY-042-DEVOPS.md` (CI/CD, S3 provisioning, feature flags)
7. `TASK-STORY-042-SECURITY.md` (Threat model, authn/authz, data protection)
8. `TASK-STORY-042-OBSERVABILITY.md` (Logging, metrics, alerts, tracing)
9. `TASK-STORY-042-DOCUMENTATION.md` (Technical docs, runbook, user guide)
10. `TASK-STORY-042-COVERAGE.md` (Coverage matrix, dependency graph, validation results)

**Sample Task (from TASK-STORY-042-DATABASE.md):**

```
## TASK-STORY-042-DB-001

**Title**: Create Resume table and migration

**Parent Story**: STORY-042-multiple-resume-uploads

**Discipline**: Database

**Depends On**: None

**Blocks**: TASK-STORY-042-BACKEND-001, TASK-STORY-042-API-001

---

**Purpose**
Create Resume table to store resume metadata (file location, hash, checksum, upload status).
Fulfills AC: "Candidates can upload resume file and receive HTTP 201 with file metadata"

**Scope of Change**
- Create: Resume table in Prisma schema
- Create: Database migration file
- Modify: Candidate model to add relation to Resume

**Where**
- Schema: backend/prisma/schema.prisma
- Migration: backend/prisma/migrations/[timestamp]_create_resume_table/

**Why**
Per discovery research (May 2024, 12/12 candidates blocked by upload), resume upload is critical blocker.
Per ADR-007 (Prisma ORM constraint), all data access via Prisma.

[... full task structure continues with How, Inputs/Outputs, Dependencies, ACs, Tests, NFRs, Risks, DoD ...]
```

---

## Output Format Specification

### File Naming Convention

```
/tasks/TASK-STORY-[XXX]-[DISCIPLINE].md

Example:
- /tasks/TASK-STORY-042-DATABASE.md
- /tasks/TASK-STORY-042-BACKEND.md
- /tasks/TASK-STORY-042-FRONTEND.md
- /tasks/TASK-STORY-042-API.md
- /tasks/TASK-STORY-042-QA.md
- /tasks/TASK-STORY-042-DEVOPS.md
- /tasks/TASK-STORY-042-SECURITY.md
- /tasks/TASK-STORY-042-OBSERVABILITY.md
- /tasks/TASK-STORY-042-DOCUMENTATION.md
- /tasks/TASK-STORY-042-COVERAGE.md (coverage matrix, dependency graph, validation report)
```

All task files live under the `/tasks/` directory at the repository root. Each file is discipline-specific (one file per discipline), must include 15+ required sections per task, and the coverage file must demonstrate 100% acceptance criteria coverage.

### File Structure (per discipline file)

```markdown
# Tasks for STORY-XXX: [Story Title]

**Discipline**: [Discipline Name]  
**Total Tasks**: [Count]  
**Coverage**: [AC #s covered by this discipline]

## TASK-STORY-XXX-[DISCIPLINE]-001

[Full task structure per mandatory template]

## TASK-STORY-XXX-[DISCIPLINE]-002

[Full task structure]

... more tasks ...
```

### Coverage File Structure

```markdown
# Coverage & Validation Report: STORY-XXX

## Coverage Matrix

| AC # | Acceptance Criterion | Task ID(s) | Discipline(s) |
|------|----------------------|-----------|---|
| 1 | ... | ... | ... |
| ... | ... | ... | ... |

**Coverage**: [X out of X ACs covered (100%)]

## Task Dependency Graph

[ASCII diagram or dependency list]

Example:
```
TASK-DB-001 → TASK-BACKEND-001 → TASK-FRONTEND-001 → TASK-QA-001
                      ↓
                TASK-API-001

TASK-SECURITY-001 (parallel, no dependencies)
TASK-DEVOPS-001 (parallel, no dependencies)
```

## Validation Results

**Validation Level**: basic | deep

**Basic Validation**: [✓ Pass | ✗ Fail]
- [ ] All required sections present in every task
- [ ] Task IDs follow STORY-XXX-DISCIPLINE-SEQ naming
- [ ] Dependencies correctly specify other task IDs
- [ ] Coverage matrix includes all ACs

**Deep Validation** (if requested): [✓ Pass | ✗ Fail]
- [ ] Acceptance criteria are specific (no vague language)
- [ ] Project analysis references are explicit (with anchors)
- [ ] Task dependencies form correct ordering
- [ ] No circular dependencies
- [ ] Every AC covered
- [ ] No out-of-scope tasks
- [ ] Discipline-specific enrichment rules followed
- [ ] Test requirements are testable
- [ ] Risks have mitigations
- [ ] Definition of Done is actionable

**Issues Found** (if any): [List specific issues and recommendations]
```

---

## Tone & Style

- **Professional, direct, technical, concrete**
- Explain WHY (rationale, not just WHAT)
- Use imperative form ("Create X", "Validate Y", "Return HTTP 201")
- Specific technical details (file paths, HTTP codes, error messages, data types)
- No vague language ("should work", "as needed", "properly", "standard implementation")
- Explicit traceability (document names, section numbers, not "per analysis")
- Actionable guidance (engineers know exactly what to change, where, why, how)
