---
name: spec-flow
description: Wraps the full OpenSpec pipeline for a single spec. Argument is the spec slug (e.g. get-position-candidates). Orchestrates openspec-analyst → tester (design) → fullstack-developer ∥ sql-developer → tester (run).
---

# Command: /spec-flow <slug>

Executes the complete spec-driven implementation cycle for one feature.

## Arguments

- `<slug>` — kebab-case identifier matching the spec subdirectory name (e.g. `get-position-candidates`, `update-candidate-stage`).

## Steps (execute in order; parallelise where marked ∥)

### Step 1 — Propose (openspec-analyst)

- Create `openspec/specs/<slug>/proposal.md` from the spec body provided in Phase 4.
- Ensure `## Pattern Choice` section is present with one-line justification.
- Mark status: `proposed`.

### Step 2 — Test Case Design (tester)

- Read `proposal.md`.
- Add `## Test Cases` section to (the to-be-created) `design.md`.
- Write minimum 4 Given/When/Then scenarios (happy path, not-found, validation error, edge case).
- **Implementation does NOT start until this step is confirmed complete.**

### Step 3 — Apply + Implement (∥ fullstack-developer + sql-developer)

Dispatch both agents in the **same turn**:

**fullstack-developer**:
- Read `proposal.md` and `design.md`.
- Invoke skill `ddd-hexagonal-scaffold` to create backend files.
- Register routes in `backend/src/index.ts`.
- Confirm `npx tsc --noEmit` passes.

**sql-developer**:
- Read `proposal.md` and `design.md`.
- Implement the Prisma repository in `backend/src/infrastructure/repositories/`.
- Run `npx prisma generate` if schema changed.

Both agents run `/opsx:apply` on the spec to promote status to `in-progress`.

### Step 4 — Sync (openspec-analyst)

- Run `/opsx:sync` to update `proposal.md` status to `implemented`.
- Confirm all task items in `tasks.md` are marked done.

### Step 5 — Test Run (tester)

- Write/complete test file in `backend/src/tests/<slug>.test.ts`.
- Run `cd backend && npm test -- --testPathPattern=<slug>`.
- **If any test fails: halt here, report failures verbatim. Do NOT archive.**

### Step 6 — Archive (openspec-analyst)

- Run `/opsx:archive` to move `openspec/specs/<slug>/` → `openspec/archive/<slug>/`.
- Confirm directory moved successfully.

## Halt Conditions

- Step 5 red → stop, report test failures, await fix.
- TypeScript compilation error after Step 3 → stop, report errors.
