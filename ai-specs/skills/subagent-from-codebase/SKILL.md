---
name: subagent-from-codebase
description: >
  Generate a codebase-specific sub-agent markdown (same depth as a hand-curated specialist):
  stack, real paths, architecture patterns, review criteria, output contract, permissions.
  Use when the user wants a new sub-agent, ai-specs/.agents specialist, or domain-tuned
  Cursor/Claude worker for any role (frontend, backend, QA, PM, DevOps, data, etc.) derived
  from the current repository—not a generic template.
---

## Purpose

Turn **repository reality** into a **sub-agent definition** another model can run without outdated assumptions. The output must match the **information density** of a strong reference (layered expertise bullets, ordered workflows, review checklists, explicit output paths, hard rules)—while staying **agnostic to role**: you derive the role from the user (e.g. frontend React, project manager, SRE).

**"Strong reference" means**: a specialist could land in this repo and immediately know what's real (paths, configs, conventions) vs what's generic advice that applies everywhere. Examples:

- Strong: "API errors map to `shared/error-codes.ts`; never invent new codes"
- Strong: "we use feature-sliced design, see `src/shared/config/` for globals"
- Generic: "use proper error handling"
- Generic: "follow best practices for state management"

## Triggers

- "Generate a sub-agent for …"
- "Create an ai-specs agent like backend-developer but for …"
- "Specialist prompt tuned to this repo for …"
- "Subagent markdown with our patterns for …"

## Non-goals

- Implementing product features (parent agent or human implements).
- Picking a multi-agent orchestration pattern end-to-end (use **agent-architecture** for supervisor/router design); this skill only authors **one** sub-agent file.
- Replacing project `AGENTS.md` / global rules (sub-agent is scoped **specialist**).

## Inputs / outputs

**Inputs (collect if missing):**

- `role_intent`: what the sub-agent is for (one sentence).
- `scope`: directories, bounded context, or "whole repo".
- `artifact_surface`: where the file should live (e.g. `ai-specs/.agents/`, `.cursor/...`, `.claude/agents/`).
- `risk_posture`: default tools (read-only vs implement); plan-only vs coding.
- `naming`: filename stem (e.g. `frontend-developer`, `pm-agent`).

**Outputs:**

- One markdown file: sub-agent body + YAML frontmatter (`description`, `mode: subagent`, `permission` block as required by target runtime).
- Short preamble for the user: path written, 2–3 "do not ignore" notes from repo policy.

## Contract

```sudo
Contracts {
  Inputs {
    role_intent: string
    scope?: string
    artifact_surface?: string
    risk_posture?: "read_mostly" | "implement" | "plan_only"
    naming?: string
  }
  Outputs {
    subagent_markdown_path: string
    inferred_permissions: string
    assumptions?: List[string]
  }
  Constraints {
    MUST: "Ground every major bullet in evidence from this repo (paths, configs, docs)—no generic filler."
    MUST: "Match structural depth to refs/subagent-spec-template.md (expertise sections, approach, review, communication, output format, rules)."
    MUST: "Infer permissions from risk_posture; justify deviations in Rules or a one-line note to the user."
    MUST: "If graphify-out/ exists in scope repo, use GRAPH_REPORT.md + wiki or graphify query before claiming architecture."
    SHOULD: "Cross-check AGENTS.md, CLAUDE.md, package manifests, CI, and testing docs."
    NEVER: "Ship a sub-agent whose expertise bullets could apply unchanged to a different codebase."
  }
}
```

## Workflow

1. **Intake** — Confirm `role_intent`, `scope`, output path, plan-only vs implement, filename. Detect runtime (Cursor → `.cursor/agents/`, Claude Code → `.claude/agents/`, OpenCode → `.opencode/agents/`) and infer `artifact_surface` if not provided. If ambiguous, ask one focused question.
2. **Evidence pass (repo)** — In order:
   - Long-lived instructions: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/`, contribution docs.
   - Stack: lockfiles / manifests (`package.json`, `pnpm-lock.yaml`, `pyproject.toml`, etc.).
   - Architecture: if `graphify-out/GRAPH_REPORT.md` exists → read it; optional `graphify query` for role-relevant concepts.
   - **Patterns over marketing**: sample 2–4 representative files in scope (naming, layers, error handling, tests location).
3. **Synthesis** — Write a short internal note (need not ship): stack table, boundaries (what this sub-agent does **not** own), handoff to parent.
4. **Draft** — Fill [refs/subagent-spec-template.md](refs/subagent-spec-template.md); replace generic headings with **this repo's** vocabulary (e.g. "features / entities / application" vs "Domain / Application" if that matches code).
5. **Quality bar** — Run the checklist at the bottom of the template file; fix gaps.
5.5. **Validate** — Before handoff, verify every major expertise bullet in the draft is grounded in evidence from the evidence pass (paths, configs, or doc titles). If any bullet is generic filler, **force fix before proceeding to handoff**—do not warn and continue. Return to Draft step to replace non-grounded bullets.
6. **Handoff** — Tell user the path; do not paste the full file in chat unless they ask.

## Gotchas

- **Scope ambiguous**: If `role_intent` is unclear or spans multiple bounded contexts, ask one focused question before drafting—don't assume.
- **graphify-out/ missing**: If `GRAPH_REPORT.md` does not exist in scope, skip the graphify query step; rely on direct file evidence pass instead.
- **No files match role domain**: If sampling 2–4 representative files returns nothing relevant to the stated role, note this explicitly in the sub-agent's Rules ("no <domain> artifacts found; do not invent tasks") rather than hallucinating patterns.
- **Artifact surface mismatch**: If the target runtime (Cursor, Claude Code, OpenCode) uses a different agent directory convention, adjust the output path in the preamble—don't blindly follow the user's implied path if it contradicts the runtime's conventions.

## Role-agnostic tailoring rules

| User asks for… | You emphasize in the sub-agent… |
|----------------|----------------------------------|
| Frontend | UI stack, components, state, a11y, build, storybook/e2e as present |
| Backend | API style, DB/ORM, auth, validation, error mapping |
| QA / test | runners, fixtures, contract tests, coverage gates |
| PM / delivery | milestones, issue/PR conventions, non-code artifacts—**still** cite repo paths for templates |
| DevOps | CI files, deploy targets, secrets policy, release tags |
| Data engineer | pipeline orchestrators (Airflow, Dagster), data lake/lakehouse conventions, DBT models, schema registry, observability signals |
| Security reviewer | authz models, secret management, SAST/DAST tooling, CVE triage, audit logs, compliance artifacts (SOC2, ISO 27001) as present |

If the repo has **no** artifact for a concern, say so in **Rules** ("no e2e in repo; do not invent Playwright tasks") instead of hallucinating practice.

## References

- Canonical section outline and quality checklist: [refs/subagent-spec-template.md](refs/subagent-spec-template.md)
- Multi-agent placement and surfaces: **agent-architecture** skill (`refs/platforms-cursor-claude-opencode.md` via that skill)

## Agent self-check

- [ ] Intake complete or explicitly defaulted
- [ ] Evidence from this repo cited inside the sub-agent bullets (paths or doc titles)
- [ ] Template depth satisfied; checklist in ref file passed
- [ ] Output path communicated to user
- [ ] Every expertise bullet is "strong reference" quality (repo-specific paths/configs, not generic advice)
- [ ] Step 5.5 Validate passed: every major bullet grounded in evidence from this repo
