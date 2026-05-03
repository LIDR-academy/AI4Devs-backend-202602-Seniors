---
description: Analyze a user story or Jira ticket and enrich it with full technical detail following product best practices, then write the improved story to ai-specs/changes/
---

# Enrich User Story (`/enrich-us`)

Analyze and fix the requirement given as an argument.

**Input**: The argument after `/enrich-us` is either a Jira ticket key (e.g. `PROJ-123`) or a free-text user story / requirement description.

---

## Steps

### 1. Gather the requirement

- If the argument is free-text, use it directly as the raw requirement.
- If no argument was provided, ask the user to provide the ticket key or requirement text before proceeding.

### 2. Invoke the `agile-product-owner` skill

Invoke the `agile-product-owner` skill to parse and structure the raw requirement into an INVEST-compliant draft:

- **Independent**: the story delivers value on its own.
- **Negotiable**: scope is clear but not over-constrained.
- **Valuable**: business value is explicit.
- **Estimable**: small enough and concrete enough to estimate.
- **Small**: fits in a single sprint.
- **Testable**: acceptance criteria are verifiable.

Use the INVEST-compliant draft produced by the skill as the base for the next steps.

### 3. Load technical context

Read all files under `ai-specs/specs/` to understand the project's architecture, standards, and best practices. Pay special attention to:
- Layered / DDD architecture (Presentation → Application → Domain → Infrastructure)
- Naming conventions, TypeScript patterns, and coding standards
- Testing requirements (Jest, 90% coverage target)
- API design standards (REST, OpenAPI)
- Known technical debt that must not be replicated

### 4. Evaluate completeness

Act as a **product expert with technical knowledge**. Check whether the INVEST draft already contains all of the following. Mark each item ✅ (present) or ❌ (missing):

| # | Completeness criterion |
|---|------------------------|
| 1 | Full functional description — what the feature does and why |
| 2 | Comprehensive list of data fields involved (create / update / delete) |
| 3 | Endpoint structure: HTTP method, URL pattern, request body, response body, status codes |
| 4 | Files to be created or modified, mapped to the layered architecture |
| 5 | Step-by-step definition of done (DoD) |
| 6 | Documentation updates required (OpenAPI spec, README, etc.) |
| 7 | Unit-test requirements (which services / controllers to cover, mocking strategy) |
| 8 | Non-functional requirements: security (input validation, auth), performance, error handling |

### 5. Decide whether enrichment is needed

- If **all 8 criteria are ✅**, the story is already sufficiently detailed. State this clearly and skip to step 7 (output the original story as-is).
- If **any criterion is ❌**, proceed to step 6.

### 6. Produce the enriched story

Write an improved user story that fills every gap identified in step 4. The story must:

- Follow the format: `As a <role>, I want <goal>, so that <benefit>.`
- Include **Acceptance Criteria** as a numbered list of Given/When/Then or clear pass/fail conditions.
- Include an **Endpoints** section with full request/response examples.
- Include a **Files to Modify** section listing each file path and what changes are needed, following the project's layered architecture.
- Include a **Definition of Done** checklist.
- Include a **Testing** section describing which units to test and the mocking strategy.
- Include a **Non-Functional Requirements** section covering security, performance, and error handling.

Keep the language concise, specific, and actionable so a developer can be fully autonomous when completing it.

### 7. Write the output file

- Derive a kebab-case slug from the story title (e.g. `add-candidate-update-endpoint`).
- Write the enriched (or original, if already complete) story to:
  ```
  ai-specs/changes/<slug>.md
  ```
- Confirm the file path to the user once written.

### 8. Summarize findings

Report back with:
- Whether the original story was complete or needed enrichment.
- The list of gaps that were filled (if any).
- The path to the output file.
- Optional: suggest whether to open a PR or update the Jira ticket with the enriched description.
