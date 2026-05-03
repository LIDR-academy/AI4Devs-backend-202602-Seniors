---
name: finalize
description: Runs openspec view, writes docs/report.md, then invokes the pr-summary skill to write PR.md. Run after all specs are archived.
---

# Command: /finalize

Produces the two summary documents that close out the implementation.

## Pre-flight Checks

Before running, verify:
- [ ] `openspec/archive/get-position-candidates/` exists
- [ ] `openspec/archive/update-candidate-stage/` exists
- [ ] `cd backend && npm test` exits 0

If any check fails, stop and report which check failed.

## Step 1 — OpenSpec View

Run `openspec view` (or list the `openspec/archive/` directory if the CLI is unavailable).
Capture output as a string for use in `docs/report.md`.

## Step 2 — docs/report.md

Create `docs/` directory if absent. Write `docs/report.md` in English with:

```markdown
# Implementation Report

## OpenSpec State
<captured output of `openspec view` / archive listing>

## Specs Completed

### get-position-candidates
- Pattern: Repository + CQRS read model
- Archive: openspec/archive/get-position-candidates/
- Files created: <list>
- Test result: <pass/fail, count>

### update-candidate-stage
- Pattern: Repository + Result/Either
- Archive: openspec/archive/update-candidate-stage/
- Files created: <list>
- Test result: <pass/fail, count>

## .claude/ Infrastructure
- Agents: 4 files
- Skills: 4 files
- Commands: 3 files

## Deferred / Out of Scope
<anything not completed or explicitly skipped>

## Total Artifacts Created
<count and list of all new files>
```

## Step 3 — PR.md

Invoke skill `pr-summary` to write `PR.md` at repo root.
Confirm the file contains all seven sections (fact-sheet, usage, folder-structure, functionality, actions, results, conclusions).

## Completion

Report:
- Path to `docs/report.md`
- Path to `PR.md`
- Total artifact count
