# LTI Talent Tracking — Spec-Driven Bootstrap Orchestrator (JCMM)

> Self-contained English-language prompt. Paste into a Claude Code session opened at the project root and run it as a single turn. The orchestrator will create every required artifact end-to-end.

---

## 1. Role

You are an **autonomous orchestrator agent** working at the root of an existing dockerized Node.js / Express / TypeScript / Prisma / PostgreSQL + React monorepo (the LTI Talent Tracking System). You do not write production code yourself in the main thread; instead you create a small, modular set of sub-agents, skills, and slash commands under `.claude/`, then delegate atomic units of work to them. You parallelize independent steps, scope context tightly to each delegate, and never reload the full repo when a slice will do.

---

## 2. Operating principles

- **Atomicity** — every sub-agent / skill / command does one thing. Single responsibility, single file.
- **Parallelism** — independent steps must be dispatched in the same turn (e.g. Spec 1 and Spec 2 proposals).
- **Token frugality** — when delegating, pass only the file paths and excerpts the delegate needs. Never paste the whole codebase. Sub-agents read what they need on demand.
- **Idempotency** — re-running any phase converges, never duplicates. Detect existing artifacts before creating.
- **Symlink-readiness (universalization)** — every canonical artifact lives under `.claude/`. Do **not** materialize symlinks for other IDEs in this run; the user has scoped this to Claude Code only. However, name files and structure folders so a future addition (e.g. `.cursor/rules/openspec-analyst.md`) can be a one-line `ln -s ../../.claude/agents/openspec-analyst.md`. Never inline duplicate content into IDE-specific folders.
- **English only** — every generated artifact (`AGENTS.md`, `CLAUDE.md`, OpenSpec specs, `docs/report.md`, `PR.md`, every `.claude/*.md`) is written in English regardless of source-prompt language.
- **DDD + Hexagonal Architecture** — for new code, separate Domain / Application / Infrastructure / Presentation. Apply a design pattern (Repository, Result/Either, Unit of Work, CQRS read model, Factory, Strategy, Observer, Decorator, Saga) **only when it earns its keep**. Name and justify the pattern in one line in the spec; do not stack patterns for the sake of completeness.
- **`.gitignore` is authoritative** — when scanning the repo, exclude every path matched by `.gitignore`.

---

## 3. Inventory to bootstrap under `.claude/`

Before running any phase, create exactly these files. Each file uses YAML frontmatter (`name`, `description`, optionally `model` for agents) followed by a focused body. Keep each file under ~120 lines.

### Sub-agents — `.claude/agents/`
| File | Single responsibility |
|---|---|
| `openspec-analyst.md` | Owns OpenSpec lifecycle: writes `openspec/config.yaml`, drafts proposals, runs `/opsx:propose → /opsx:apply → /opsx:sync → /opsx:archive`, validates spec quality. |
| `fullstack-developer.md` | Implements Express + TypeScript backend code and matching React frontend code following hexagonal layering. Receives a single spec at a time. |
| `sql-developer.md` | Owns Prisma schema, migrations, and any SQL/Prisma queries (notably joins + AVG over `interview.score`). Never touches HTTP layer. |
| `tester.md` | Writes Jest unit + integration tests. **Must author the spec's test cases inside `design.md` before `fullstack-developer` implements.** Uses ts-jest; React tests use React Testing Library. |

### Skills — `.claude/skills/`
| File | Trigger |
|---|---|
| `analyze-codebase.md` | Walks the repo (honoring `.gitignore`) and emits/refreshes `AGENTS.md` at the repo root. |
| `install-openspec.md` | If `openspec/` is absent, follows https://github.com/Fission-AI/OpenSpec/#quick-start for Claude Code, then writes `openspec/config.yaml` adapted to the actual stack (see Phase 1). |
| `ddd-hexagonal-scaffold.md` | Translates one OpenSpec spec into Domain / Application / Infrastructure / Presentation files, names the chosen pattern, justifies it in one line. |
| `pr-summary.md` | Generates `PR.md` per §5 Phase 5 — fact-sheet, usage, folder table, functionality, actions, results, conclusions. |

### Slash commands — `.claude/commands/`
| File | Effect |
|---|---|
| `bootstrap.md` | Runs Phases 1 → 3 in order (install OpenSpec, analyze codebase, write `CLAUDE.md`). |
| `spec-flow.md` | Wraps `/opsx:propose → /opsx:apply → /opsx:sync → /opsx:archive` for a single spec passed as argument. Internally orchestrates `openspec-analyst → tester (design.md cases) → fullstack-developer + sql-developer in parallel → tester (run tests)`. |
| `finalize.md` | Runs `openspec view`, writes `docs/report.md`, then invokes the `pr-summary` skill to write `PR.md`. |

> **Self-check after this section**: list every file you just wrote and confirm count = 4 agents + 4 skills + 3 commands = 11 files under `.claude/`.

---

## 4. Cross-IDE universalization clause

Place every canonical artifact under `.claude/`. Do **not** create `.cursor/`, `.github/copilot-instructions.md`, or any other IDE-specific folder in this run. The naming scheme above is chosen so a future maintainer can attach another IDE with one symbolic link per file, all relative paths, no content duplication. Do not invent a `prompts/shared/` indirection layer — `.claude/` is the canonical store now.

---

## 5. Phase plan

Execute phases strictly in order. Within a phase, dispatch independent steps in parallel.

### Phase 1 — OpenSpec bootstrap

1. Check for `openspec/` directory.
2. If absent, invoke skill `install-openspec`. Follow the Claude Code variant of the OpenSpec quick-start.
3. Write `openspec/config.yaml` based on the schema below, but **adapt every value to the real stack** by reading `package.json`, `backend/package.json`, `frontend/package.json`, `docker-compose.yml`, and any `.nvmrc` first.

```yaml
# openspec/config.yaml
schema: spec-driven

context: |
  # Project Context — LTI Talent Tracking System

  ## Tech Stack
  - Runtime: Node.js <detected version>
  - Package manager: npm
  - Backend: Express + TypeScript, Prisma ORM
  - Frontend: React (Create React App) + TypeScript
  - Database: PostgreSQL 14+ (docker-compose)
  - Testing: Jest + ts-jest (backend), Jest + React Testing Library (frontend)

  ## API Standards
  - RESTful JSON
  - Error responses: { error, code, message }
  - Versioned under /api/v1/ for new endpoints
  - Auth via JWT in Authorization header (when present)

  ## Coding Conventions
  - ES2022+ / TypeScript strict
  - snake_case for DB columns, camelCase for JS/TS variables
  - JSDoc on public exports
  - Minimum 80% coverage for new code

  ## Project Structure (existing)
  - backend/src/{domain,application,infrastructure,presentation,routes,tests}
  - frontend/src
  - docker-compose.yml at repo root

  ## Development Workflow
  - Proposal first, implementation second
  - Specs are the source of truth
  - Tests must pass before merge

testing:
  framework: Jest
  coverage: ">=80%"
  types: [unit, integration]

rules:
  proposal:
    - Include clear problem statement
    - Specify scope and timeline
    - Outline benefits and trade-offs
  design:
    - Document all API endpoints with request/response examples
    - Include database schema changes (Prisma migrations)
    - List new dependencies
    - Outline implementation steps
    - Define test cases BEFORE implementation
  spec:
    - Clear, declarative language
    - Given / When / Then for behaviors
    - Reference existing patterns before inventing new ones
    - Keep version history with dates
  tasks:
    - Atomic, testable units
    - Estimate effort per task
    - Mark dependencies
    - Include QA + documentation tasks
    - Each new feature ships with unit + integration tests
```

### Phase 2 — Codebase analysis → `AGENTS.md`

Invoke skill `analyze-codebase`. The skill must:

- Read `.gitignore` and exclude every match.
- Detect business purpose from `README.md` and Prisma schema.
- Produce a single English `AGENTS.md` at repo root containing: business purpose, top-level folder map (table), backend architecture (DDD layers, key services), frontend architecture (component tree summary), tooling (test, lint, build), how to run locally (docker-compose + dev scripts).
- Keep it scannable: tables and bullet lists, not prose blocks.

### Phase 3 — `CLAUDE.md`

Write `CLAUDE.md` at the repo root whose **only** content is:

```
./AGENTS.md
```

No frontmatter, no extra lines. Verify size after write.

### Phase 4 — Two specs via OpenSpec

Dispatch the two `/spec-flow` invocations **in parallel** (they touch different endpoints and different database read paths). For each spec, the flow inside `/spec-flow` is:

1. `openspec-analyst` runs `/opsx:propose` with the spec body below.
2. `tester` writes test cases into the spec's `design.md` (Given/When/Then).
3. `fullstack-developer` and `sql-developer` run **in parallel** — fullstack writes the controller + use-case + ports; sql-developer writes the Prisma query + any required migration. Both run `/opsx:apply`.
4. `openspec-analyst` runs `/opsx:sync` then `/opsx:archive`.
5. `tester` runs the Jest suite for the new spec; the flow halts on red.

Each spec must explicitly name its design pattern in the proposal under a `## Pattern Choice` heading with a one-sentence justification.

#### Spec 1 — `GET /positions/:id/candidates`

Returns every candidate currently in process for a given `positionID` (i.e. all `application` rows for that position). For each candidate include:

- **Full name** — from `candidate` table.
- **`current_interview_step`** — from `application` table.
- **Average interview score** — `AVG(interview.score)` across the candidate's `interview` rows for that application.

Suggested pattern: **Repository + CQRS read model** (a dedicated query object returns a flat DTO; no domain aggregate is loaded). Justify in one line: read-only aggregation across three tables doesn't justify hydrating an aggregate.

#### Spec 2 — `PUT /candidates/:id/stage`

Updates the candidate's `current_interview_step` for an in-progress application. Request body specifies the target stage; respond with the updated application state.

Suggested pattern: **Repository + Result/Either** for validation outcomes (invalid transition, candidate not found, application not active). Add **Unit of Work** only if the update touches more than the `application` row.

### Phase 5 — Report & PR summary

1. Run `openspec view` and capture stdout.
2. Write `docs/report.md` (English Markdown) summarizing: OpenSpec install state, both specs and their archive status, files created, test outcomes, anything skipped or deferred.
3. Invoke skill `pr-summary` to write `PR.md` at the repo root. `PR.md` contains, in order:
   - **Project fact-sheet** (one short table: name, stack, runtime, DB, ports).
   - **Usage by third parties** (how to clone, install, run docker-compose, start backend & frontend, run tests).
   - **Folder structure** (table: path → purpose).
   - **Functionality & changes** (what the project does + what this change added).
   - **Actions taken** (chronological bullet list of phases 1–5).
   - **Results** (artifacts produced, tests passed/failed counts).
   - **Conclusions** (what to do next).

---

## 6. Acceptance checklist

Before reporting "done", tick every box. If any box is unchecked, fix it and re-run the relevant phase.

- [ ] `.claude/agents/` contains 4 files: `openspec-analyst.md`, `fullstack-developer.md`, `sql-developer.md`, `tester.md`.
- [ ] `.claude/skills/` contains 4 files: `analyze-codebase.md`, `install-openspec.md`, `ddd-hexagonal-scaffold.md`, `pr-summary.md`.
- [ ] `.claude/commands/` contains 3 files: `bootstrap.md`, `spec-flow.md`, `finalize.md`.
- [ ] No IDE-specific folder (`.cursor/`, `.github/copilot-instructions.md`, `.antigravity/`) was created.
- [ ] `openspec/config.yaml` exists, mentions the actually detected Node version, lists Express + Prisma + PostgreSQL + Jest, and has a `testing:` block.
- [ ] `AGENTS.md` exists at repo root, English, excludes `.gitignore`d paths.
- [ ] `CLAUDE.md` exists at repo root, contains exactly one line: `./AGENTS.md`.
- [ ] OpenSpec proposals for both endpoints went through `/opsx:propose → /opsx:apply → /opsx:sync → /opsx:archive`.
- [ ] Each spec names its design pattern in a `## Pattern Choice` section with a one-line justification.
- [ ] `tester` agent wrote test cases into each spec's `design.md` **before** implementation.
- [ ] Jest test suite is green for the two new endpoints.
- [ ] `docs/report.md` exists, English, summarizes `openspec view` output.
- [ ] `PR.md` exists at repo root, English, contains all seven sections listed in Phase 5.
- [ ] Every generated artifact is in English.

---

## 7. Final response format

When all boxes are ticked, reply with **at most 10 lines**:

1. One sentence: "Bootstrap complete."
2. A short bullet list of the artifacts created (paths only, no descriptions).
3. A pointer to `PR.md` and `docs/report.md` for details.

Do not narrate intermediate steps in the final reply — they belong in `docs/report.md`.
