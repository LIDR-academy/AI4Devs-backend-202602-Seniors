# Prompts log

## Prompt - 2026-05-03T01:30:58Z
### Agent: Agent
#### Model: Composer 2

You are a senior **Systems Architecture Expert** with deep experience in backend architecture, API design, clean architecture, domain-driven design, scalable systems, testing strategy, documentation standards, and AI-assisted software development workflows.

You are working inside an existing software project. Your responsibility is to understand the current architecture before suggesting or implementing changes. You must respect the existing project standards and avoid introducing new patterns unless there is a clear technical reason and explicit approval.

## Context

This repository already has an established structure, coding style, architecture, and development conventions. The goal is to add new API endpoints, but before implementing them, you must first analyze the project and generate a Cursor rule that documents how AI agents should work inside this codebase.

The Cursor rule must help future work stay aligned with the project’s existing standards, folder structure, naming conventions, architectural decisions, testing approach, and documentation practices.

Do not assume the project architecture. Infer it from the existing codebase.

## Desired Outcome

Your final outcome is to:

1. Analyze the repository and understand how the project is currently built.
2. Create or update a Cursor rule that documents the project-specific standards.

The rule must be specific to this repository and must not be generic.

## Options and Constraints

Follow these constraints strictly:

- Do not create new architectural patterns if similar patterns already exist.
- Always inspect existing files that solve similar problems before creating new files.
- Prefer consistency with the current project over personal preferences.
- Reuse existing utilities, middleware, validators, DTOs, services, repositories, error types, and test helpers when available.
- Do not rename, move, or refactor unrelated files unless explicitly required.
- Do not add new dependencies unless strictly necessary and justified.
- If the project already has rules, agents, skills, or documentation, align the new rule with them.
- If there are conflicting conventions, document the conflict and choose the convention most consistently used in the codebase.
- If endpoint requirements are incomplete, identify assumptions clearly instead of blocking the work unnecessarily.

## Tasks

### 1. Analyze the Project

Review the repository carefully and identify:

- Main application architecture
- Backend/API framework being used
- Frontend framework being used
- Existing endpoint patterns
- Route/controller organization
- Request and response DTO/model conventions
- Validation strategy
- Error handling strategy
- Authentication and authorization patterns
- Database access patterns
- Repository, service, use-case, and domain layering
- Dependency injection patterns, if any
- Configuration and environment variable conventions
- Logging and observability patterns
- Testing strategy and test folder organization
- Mocking/stubbing approach
- Documentation conventions
- Code formatting and naming conventions
- Existing Cursor rules, agents, skills, hooks, or MCP configuration, if present

### 2. Generate or Update the Cursor Rule

Create or update the following file:

```txt
.cursor/rules/20-project-standards.mdc
```

The rule must be written in English and must include:

- Project overview
- Architecture principles
- Folder and file organization
- API endpoint implementation standards
- Naming conventions
- DTO/request/response conventions
- Validation rules
- Error handling rules
- Authentication and authorization rules
- Database access rules
- Testing expectations
- Documentation expectations
- Security considerations
- Observability/logging expectations
- Instructions for inspecting similar existing files before creating new ones
- Instructions to avoid introducing new patterns without approval
- Instructions for working with the two new endpoints

The rule must be specific to this repository based on the analysis performed.

### 3. Analysis Report

After completing the repository analysis and Cursor rule make a report.

## Output Style

Return your response in the following structure:

```md
# Repository Analysis Summary

[Summarize the relevant architecture, conventions, and standards discovered.]

# Cursor Rule Created or Updated

File:
`.cursor/rules/20-project-standards.mdc`

```mdc
[Full content of the generated or updated Cursor rule]
```

# Files Created or Updated

| File | Action | Purpose |
|---|---|---|
| `.cursor/rules/20-project-standards.mdc` | Created/Updated | Documents repository-specific AI development standards |

# Assumptions and Open Questions

[List assumptions, missing details, or questions that should be clarified before implementation.]

## Quality Criteria

Your response will be considered successful if:

- The project analysis is based on existing repository evidence.
- The Cursor rule is specific and actionable.
- The output is clear enough for another AI agent or developer to continue safely.

---

## Prompt - 2026-05-03T02:12:03Z
### Agent: Agent
#### Model: Composer 2

You are a Backend API Design expert. You specialize in spec-driven development, clean architecture, maintainable backend systems, database-driven APIs, and implementation planning for specialized backend agents.

Your job is not to implement the endpoint. Your job is to generate a precise implementation plan that another specialized backend agent can execute safely.

# Context

This is an existing project with separate `frontend` and `backend` folders.

You must work only inside the `backend` folder.

The frontend is completely out of scope. Do not inspect, edit, create, delete, or propose changes inside the `frontend` folder.

The project already has established backend conventions, architecture, naming patterns, endpoint structure, data access patterns, validation rules, error handling, testing strategy, and documentation style in:

```txt
.cursor/rules/20-project-standards.mdc
```

The endpoint to plan is:

```http
GET /positions/:id/candidates
```

Endpoint purpose:

This endpoint must return all candidates currently in process for a specific position. In practical terms, it should return all applications associated with a given `positionID`.

The response must include basic candidate process information:

- Candidate full name, from the `candidate` table.
- `current_interview_step`, from the `application` table.
- Candidate average score, calculated from the `score` values of all interviews performed by that candidate.

# Desired Outcome

Create a spec-driven development plan for implementing the endpoint `GET /positions/:id/candidates`.

The plan must be detailed enough for a specialized backend implementation agent to implement the endpoint without needing to re-interpret the requirements.

The plan must be saved inside the backend folder using the repository's existing documentation/specification conventions.

First inspect the backend project to determine the correct location for endpoint plans or technical specs. Prefer an existing backend documentation/specification/planning folder if one exists.

If no suitable folder exists, create the plan at:

```txt
backend/docs/specs/get-position-candidates.md
```

Do not implement the endpoint. Do not modify application source code. Only create or update the backend plan/spec document.

# Options and Constraints

## Scope Constraints

- Only inspect and modify files under `backend/`.
- Do not modify `frontend/`.
- Do not modify root-level files unless absolutely required to create the backend plan and only if the repository clearly stores backend plans outside `backend/`. If this is the case, explain why in the plan.
- Do not implement production code.
- Do not create controllers, routes, services, repositories, migrations, DTOs, tests, or API documentation yet.
- Do not run broad refactors.
- Do not introduce new architecture patterns.
- Do not assume table, column, model, or relation names without verifying them in the backend code, schema, migrations, ORM models, or database definitions.

## Architecture Constraints

- Follow the backend architecture already present in the project.
- Reuse existing patterns for endpoints, routing, handlers/controllers, services/use cases, repositories, DTOs, validation, errors, and tests.
- If the project uses clean architecture, layered architecture, modular architecture, or feature-based organization, reflect that in the plan.
- If similar endpoints exist, use them as references and explicitly mention them in the plan.
- Avoid adding new dependencies unless the plan clearly justifies why they are necessary.

## Data and Query Constraints

The plan must account for the following data requirements:

- Filter applications by the provided position ID.
- Join or associate each application with its candidate.
- Return the candidate's full name from the candidate data.
- Return `current_interview_step` from the application data.
- Calculate the average interview score for each candidate based on all interview records associated with that candidate and/or application, depending on the existing schema.
- Define how to handle candidates with no completed interviews or no interview scores.
- Define how to handle nonexistent position IDs.
- Define how to handle positions with no candidates/applications.

## API Contract Constraints

The plan must define a proposed API contract that matches the existing backend style.

Include:

- HTTP method and path.
- Path parameters.
- Expected success response shape.
- Expected empty-state response.
- Expected error responses.
- Authentication and authorization behavior, if the backend already has such patterns.
- Validation behavior for invalid `id` values.
- Status codes based on existing project conventions.

## Testing Constraints

The plan must include a testing strategy based on the existing backend test patterns.

Include test cases for:

- Valid position with multiple candidates.
- Correct candidate full name mapping.
- Correct `current_interview_step` mapping.
- Correct average score calculation.
- Candidate/application with no interviews or no scores.
- Position with no candidates.
- Invalid position ID format.
- Nonexistent position ID.
- Authorization/authentication scenarios, if applicable.

## Implementation Handoff Constraints

The plan must be written for a future backend implementation agent.

It must include enough detail to let that agent implement the endpoint safely, but it must not include actual implementation code unless short pseudocode is useful to clarify the approach.

If pseudocode is included, mark it clearly as pseudocode and do not create source files.

# Output Style

Create a Markdown plan file in the appropriate backend folder.

The plan must be written in English.

Use this structure:

```md
# Spec-Driven Plan: GET /positions/:id/candidates

## 1. Backend Context Analysis

- Backend framework detected:
- Relevant architecture pattern:
- Relevant existing endpoint references:
- Relevant folders/files inspected:
- Existing conventions to follow:

## 2. Endpoint Specification

### Method and Path

### Purpose

### Path Parameters

### Request Body

### Success Response

### Empty Response

### Error Responses

### Authentication and Authorization

## 3. Data Model and Relationship Analysis

- Candidate source:
- Application source:
- Interview source:
- Position/application relationship:
- Candidate/application/interview relationship:
- Score calculation rule:
- Null or missing score behavior:

## 4. Proposed Backend Changes

Describe the files that the implementation agent should create or modify.

For each file, include:

- File path
- Purpose of change
- Expected responsibility
- Existing file or pattern to follow

Do not implement the files.

## 5. Query and Aggregation Strategy

Explain how the endpoint should retrieve:

- Applications for the position
- Candidate full names
- Current interview step
- Average interview score

Mention whether the project should use ORM relations, query builder, repository methods, raw SQL, or existing data access conventions.

## 6. Validation and Error Handling Plan

Include:

- Path parameter validation
- Not found behavior
- Empty result behavior
- Database/query error handling
- Consistency with existing backend error patterns

## 7. Testing Plan

Include unit, integration, e2e, or repository tests according to the existing backend testing strategy.

For each test case, include:

- Scenario
- Setup data
- Expected result
- Expected status code

## 8. Documentation Plan

State whether API docs, OpenAPI/Swagger files, README files, or backend docs should be updated based on existing project conventions.

## 9. Implementation Checklist for Backend Agent

Provide a step-by-step checklist for the future backend implementation agent.

## 10. Assumptions and Open Questions

List only the assumptions that could not be verified from the backend codebase.

Do not ask the user questions unless implementation would be unsafe without the answer. Prefer documenting assumptions and continuing with the plan.
```

After creating the file, return a concise summary in chat with:

1. The path of the created or updated plan file.
2. The backend conventions discovered.
3. The main implementation approach.
4. Any blocking assumptions or risks.

Remember: create the plan only. Do not implement the endpoint.
```

---
## Prompt - 2026-05-03T03:15:00Z
### Agent: backend-api-implementer
#### Model: Claude 4.6 Sonnet

@.cursor/agents/backend-api-implementer.md 

Implement the endpoint described in this approved plan:

@backend/docs/specs/get-position-candidates.md 

Constraints:
- Stay strictly inside backend/.
- Follow @.cursor/rules/20-project-standards.mdc 
- Use the candidate* flow (routes/candidateRoutes.ts → presentation/controllers/candidateController.ts → application/services/candidateService.ts → domain/models/Candidate.ts) as the canonical reference.
- Mirror the GET /candidates/:id error JSON shape ({ error: '...' }), not the POST /candidates shape.
- No new npm dependencies, no schema migrations, no auth middleware.
- Add Jest tests covering the scenarios in section 7 of the plan; mock @prisma/client (no DB harness exists yet).
- Update backend/api-spec.yaml with the new contract in the same YAML style used for /candidates.
- Run `npm run build` and `npm test` from backend/ and report results.

Return the report in the format defined in the agent's "Output Style" section.

---
## Prompt - 2026-05-03T03:51:00Z
### Agent: Agent
#### Model: Claude 4.6 Sonnet

You are a **Senior Backend Test Engineer** specialized in validating backend implementations, test strategy, and test quality across layered architectures.

[Full audit prompt requesting review of GET /positions/:id/candidates implementation tests, covering: implementation plan at backend/docs/specs/get-position-candidates.md, generated code via git status, target folder backend/. Output format: Markdown report at backend/docs/test-audit.md with traceability matrix, layer review, gap analysis, quality findings, recommended test plan, and final score/recommendation.]

---
## Prompt - 2026-05-03T04:04:00Z
### Agent: Agent
#### Model: Claude 4.6 Sonnet

You are a Senior Backend Test Engineer.

Your responsibility is to implement reliable, maintainable, and well-structured tests for the backend application, following the existing project standards and the recommendations already documented in the test audit.

[Full prompt: Implement the recommended test plan from backend/docs/test-audit.md. Organize tests by application layer (routes/, controllers/, services/, domain/, integration/). Validate via npm run build and npm test. Update the audit document with: summary of tests implemented, new folder structure, addressed recommendations, remaining gaps, commands executed, updated final recommendation. In the score table, rename Score → Previous Score, add Last Score column, recalculate average. Constraints: work only in backend/, do not modify frontend, do not introduce new testing framework unless justified, keep production code changes minimal and explained.]

---
## Prompt - 2026-05-03T04:45:00Z
### Agent: Agent
#### Model: Auto

You are a **Senior Backend Engineer** with strong experience in code documentation, maintainability, and pre-merge quality checks.

## Context

The project uses CodeRabbit pre-merge checks, and one of the failing or required checks is **Docstring Coverage**.

The backend already contains generated or recently implemented code under:

- backend/src
- backend/tests

The goal is to improve documentation coverage for the generated backend code without changing the application behavior.

Use the existing project standards as the source of truth:

- .cursor/rules/20-project-standards.mdc

## Desired Outcome

Add or improve docstrings and inline documentation for the generated backend source code and tests so that CodeRabbit’s **Docstring Coverage** check passes or improves significantly.

The documentation must make the code easier to understand while staying concise and useful.

(Additional scope/instructions: work only inside backend/src and backend/tests except brief backend doc audit update; TSDoc style; document tests; preserve behavior; run npm test, npm run build, npm run lint from package.json where available; update test-audit if suitable.)

## Output Style

When finished, provide a concise summary with: files updated, types of docstrings, validation results, remaining gaps.

---
## Prompt - 2026-05-03T05:15:00Z
### Agent: Agent
#### Model: Claude 4.7 Opus

You are a **Backend API Design Expert**.

You specialize in spec-driven development, REST API design, backend implementation planning, database-driven APIs, and maintainable backend systems.

Your responsibility is to create a precise implementation plan for a specialized backend agent.
You must **not** implement the endpoint.

## Context

This is an existing project with separate folders:

```txt
frontend/
backend/
```

You must work only inside:

```txt
backend/
```

The frontend is completely out of scope.

The project already has backend conventions, architecture decisions, naming patterns, endpoint structure, data access rules, validation patterns, error handling, testing strategy, and documentation style defined in:

```txt
.cursor/rules/20-project-standards.mdc
```

Use that rule as the primary source of truth.

The new endpoint to plan is:

```http
PUT /candidates/:id/stage
```

## Endpoint Intent

This endpoint updates the interview process stage for a moved candidate.

It should allow the backend to modify the current phase of the interview process in which a specific candidate is located.

Important: before defining the final contract, inspect the backend data model and existing relationships.
If the interview stage is stored on an application/process entity instead of directly on the candidate, the plan must explicitly describe how the endpoint should identify the correct application or process to update.

## Desired Outcome

Create a **spec-driven implementation plan** for `PUT /candidates/:id/stage` saved inside the backend documentation/specification structure used by the repository (preferred existing folder; fallback `backend/docs/specs/put-candidates-stage.md`).

(Additional scope/instructions: inspect backend framework, existing candidate/update endpoints, validation style, error response style, service layering, ORM patterns, candidate/application/interview models; define safe API contract addressing `:id` ambiguity; describe files to create/modify with patterns to follow; cover validation, error handling, DB update strategy, transactions, tests by layer, OpenAPI doc updates; testing scenarios for success, invalid id, not found, invalid stage, multiple applications, DB failure, auth; output structure with sections 1–10 as defined in the prompt; do not implement code, only the plan.)

## Output Style

The plan must be written in English, specific to this repository, concise but complete, actionable for a backend implementation agent, grounded in verified backend code and schema, free of generic architecture advice.

After creating the file, return a concise chat summary with: path of the created plan file, backend conventions discovered, recommended implementation approach, blocking assumptions or risks if any.

---
## Prompt - 2026-05-03T05:34:00Z
### Agent: backend-api-implementer
#### Model: Claude 4.7 Opus

@.cursor/agents/backend-api-implementer.md

Implement the endpoint described in this approved plan:

backend/docs/specs/put-candidates-stage.md

Constraints:
- Stay strictly inside backend/.
- Follow .cursor/rules/20-project-standards.mdc.
- No new npm dependencies, no schema migrations, no auth middleware.
- Update backend/api-spec.yaml with the new contract in the same YAML style used for /candidates.
- Run `npm run build` and `npm test` from backend/ and report results.

Return the report in the format defined in the agent's "Output Style" section.

---
## Prompt - 2026-05-03T05:36:00Z
### Agent: backend-api-implementer
#### Model: Claude 4.7 Opus

Implement the endpoint described in this approved spec-driven plan:

**Plan path:** `backend/docs/specs/put-candidates-stage.md`

You MUST read that plan first; it is the binding contract for this implementation. Sections 3, 4, 5, 6, and 7 of the plan are normative; sections 1, 2, 8, 9, and 10 are supporting context.

(Endpoint summary: `PUT /candidates/:id/stage`; `:id` = `Candidate.id`; body `{ applicationId, currentInterviewStep }` both required positive integers; 200 returns updated `Application` row; validation order parse `:id` (400) → load Candidate (404) → load Application + position.interviewFlowId (404) → enforce `application.candidateId === :id` (409, fallback 400) → load InterviewStep (404) → enforce step↔flow consistency (400) → `prisma.application.update` catching `P2025` to remap to 404. Error JSON `{ error }` matching `getCandidateById`. JSON 500 from controller.)

(Constraints: stay inside `backend/`; do NOT modify `frontend/` or `.cursor/`; follow `.cursor/rules/20-project-standards.mdc`; no new npm deps; no schema migrations; no auth middleware; reuse existing layered structure and test layout under `backend/tests/{services,controllers,integration,helpers}`; keep `/candidates` mount untouched; update `backend/api-spec.yaml` mirroring the `/positions/{id}/candidates` block.)

(Files to create: `backend/src/application/services/candidateStageService.ts`; `backend/tests/services/candidateStageService.test.ts`; `backend/tests/controllers/candidateController.test.ts`; `backend/tests/integration/candidateRoutes.integration.test.ts`. Files to modify: `backend/src/routes/candidateRoutes.ts`; `backend/src/presentation/controllers/candidateController.ts`; `backend/src/application/validator.ts`; `backend/tests/helpers/factories.ts`; `backend/api-spec.yaml`. Optional: `backend/src/domain/models/Application.ts`. Do NOT touch `backend/src/index.ts`.)

(Testing scenarios per layer per plan §7: service rows 1, 2, 6, 12, 13, 14, 15, 16, 21; controller rows 3, 4, 5, 7, 8, 9, 10, 11 + full-equality 200 + 500 mapping; integration rows 1, 3, 6, 12, 14, 15, 17, 18, 19, 20. Use `jest.mock('@prisma/client')` factory + `jest.requireMock` pattern from `tests/services/positionCandidateService.test.ts`.)

Validation: from `backend/` run `npm run build` (must succeed), `npm test` (all suites green incl. existing position* tests), optional `npx eslint`.

Return the final report in the exact format defined under "Output Style" in `.cursor/agents/backend-api-implementer.md` (Summary / Plan Used / Endpoint Shape / Files Changed / API Contract / Tests / Validation / Notes), mentioning whether 409 or 400 was used for the candidate↔application mismatch case.

---
## Prompt - 2026-05-03T06:50:00Z
### Agent: Agent
#### Model: Composer 2

Conduct a Senior Backend Test Engineer audit of PUT /candidates/:id/stage per backend/docs/specs/put-candidates-stage.md and git-derived scope; inspect backend-only tests and implementation; produce backend/docs/QA-put-candidates-stage.md using the mandated Markdown sections (Executive Summary through Final Recommendation); audit only (no prod refactors unless testability blocker); frontend out of scope.

---
## Prompt - 2026-05-03T07:20:00Z
### Agent: Agent
#### Model: Composer 2

Please rename backend/docs/test-audit.md to QA-get-position-candidates.md to align the names of the files that store the results of the test audits.

---
## Prompt - 2026-05-03T18:12:00Z
### Agent: Agent
#### Model: Composer 2

Senior Backend Test Engineer brief: implement recommended test plan from `backend/docs/QA-put-candidates-stage.md`; run tests/build; update audit with scores (Previous / Last) and post-implementation sections. Constraints: backend/ only, no prod behavior change.

---
## Prompt - 2026-05-03T20:15:00Z
### Agent: Agent
#### Model: Composer 2

You are a **Senior Backend Engineer** with strong experience in TypeScript documentation, maintainability, test readability, and pre-merge quality checks.

Context: CodeRabbit pre-merge includes Docstring Coverage; follow `.cursor/rules/20-project-standards.mdc`. Goal: add or improve useful docstrings only in backend source and test files that are **modified or added** per `git status` under `backend/src` and `backend/tests`. Do not document unmodified files or paths outside that candidate list; preserve behavior; prefer TSDoc; document tests where it helps; run backend `npm test` / `npm run build` / lint scripts if present. Deliver summary listing candidate files, files updated, doc types, validation results, intentionally ignored paths, and remaining gaps.

Remember: scope is only git-derived modified/added files under `backend/src` and `backend/tests`, not the entire backend.

---
## Prompt - 2026-05-03T21:05:00Z
### Agent: Agent
#### Model: Composer 2

Verify each finding against the current code and only fix it if needed.

In @.cursor/rules/20-project-standards.mdc at line 37, Update the "Testing
expectations" section to remove the stale claim that "there are no `*.test.*`
files" and "No examples exist yet" and instead reference the new backend/tests/
directory as containing example tests and point maintainers to the repository's
Jest configuration (jest.config.js) for the expected test structure; modify the
prose in .cursor/rules/20-project-standards.mdc under the "Testing expectations"
header to mention backend/tests/ and jest.config.js as the canonical examples.

---
## Prompt - 2026-05-03T21:12:00Z
### Agent: Agent
#### Model: Composer 2

Verify each finding against the current code and only fix it if needed.

In `@backend/api-spec.yaml` around lines 155 - 215, The 200 response schema for
GET /candidates/{id} is incomplete; update the response schema under the '200'
response to include the full Candidate object fields returned by the handler:
add educations (array of objects with institution, title, startDate, endDate),
workExperiences (array of objects with company, position, description,
startDate, endDate), resumes (array of objects with filePath, fileType), and
applications (array of objects including nested position and interviews
structures as returned by the handler). Ensure each new array item is documented
with the correct property names and types (string/date as appropriate) so the
schema for GET /candidates/{id} accurately reflects the handler's returned Candidate object.

