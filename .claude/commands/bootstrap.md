---
name: bootstrap
description: Runs Phases 1-3 in order — installs OpenSpec, analyzes the codebase to generate AGENTS.md, and writes CLAUDE.md. Safe to re-run (idempotent).
---

# Command: /bootstrap

Runs the three setup phases in strict order.

## Phase 1 — OpenSpec Installation

Invoke skill `install-openspec`:
1. Check if `openspec/` exists. If not, create the directory structure.
2. Detect stack versions from `backend/package.json` and `frontend/package.json`.
3. Write `openspec/config.yaml` with real version values.
4. Verify YAML is valid and contains `schema: spec-driven`.

## Phase 2 — Codebase Analysis

Invoke skill `analyze-codebase`:
1. Read `.gitignore` and build exclusion list.
2. Detect business purpose from `README.md` and `backend/prisma/schema.prisma`.
3. Collect folder structure, endpoints, layers, components, tooling.
4. Write `AGENTS.md` at repo root (overwrite if exists).
5. Verify `AGENTS.md` is in English and contains all required sections.

## Phase 3 — CLAUDE.md

Write `CLAUDE.md` at repo root with exactly this content (one line, no extras):

```
./AGENTS.md
```

Verify: `wc -c CLAUDE.md` should equal 11 bytes (10 chars + newline).

## Completion Check

After all three phases:
- [ ] `openspec/config.yaml` exists
- [ ] `AGENTS.md` exists at repo root
- [ ] `CLAUDE.md` exists at repo root, contains exactly `./AGENTS.md`

Report the three file paths and their sizes. Do not proceed to Phase 4 unless all three are confirmed.
