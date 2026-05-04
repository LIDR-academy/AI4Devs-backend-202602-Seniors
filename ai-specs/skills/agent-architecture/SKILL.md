---
name: agent-architecture
description: >
  Design multi-step AI agents using supervisor, ReAct, human-in-the-loop, and sequential-reasoning patterns
  with predictable handoffs, cost awareness, and production safeguards. Maps designs to Cursor, Claude Code,
  and OpenCode (skills, agents, rules, MCP, permissions). Use when defining new agents or subagents,
  orchestration across tools, regulated approval gates, or choosing between single-agent vs multi-agent setups.
---

# Agent architecture (Cursor · Claude Code · OpenCode)

## When to use

- Choosing how to split work: one agent vs coordinator + specialists vs pipeline
- Making behavior predictable: explicit steps, schemas at boundaries, iteration caps
- Adding human approval for high-risk or regulated steps
- Shipping the same *logic* to more than one runtime (IDE agent, CLI batch, OpenCode `opencode run`)

## When not to use

- Picking a model or provider only (no orchestration concern)
- Library/framework API questions (use find-docs / context7 skills)
- Full product PRD or issue breakdown (use **process-interviewer**, **to-issues**, **brainstorming**)

## Edge cases (routing triggers)

- **Subagent watchdog timeout**: a subagent exceeds its timeout without responding
- **Parallel worker race condition**: multiple workers write to shared state simultaneously
- **Coordinator degradation fallback**: supervisor loses connectivity or enters degraded mode
- **HITL SLA breach**: human approval exceeds expected SLA (e.g., 30s timeout)
- **Fan-out overflow**: supervisor receives >8 concurrent task requests

## Contracts

```sudo
Contracts {
  Inputs {
    task_domain: string
    risk_level?: "low" | "medium" | "high"
    surfaces?: List["cursor" | "claude" | "opencode"]
    existing_assets?: string
    # e.g. "already has .cursor/rules and MCP", "Ralph opencode backend"
  }
  Outputs {
    pattern_choice: string           # e.g. "supervisor", "single-agent", "sequential"
    rationale: string                # why this pattern given domain + risk
    artifact_plan: List[{ surface: string, path_or_key: string, purpose: string }]
    errors?: List[{ step: string, reason: string, fallback: string }]
    # Mode B only (multi-agent):
    handoff_contract?: { producer: string, consumer: string, payload_shape: string, validation: string, on_failure: string }
    hitl_checkpoints?: List[string]  # human approval points, e.g. ["before_delete", "before_spend"]
  }
  Constraints {
    MUST prefer the smallest pattern that fits: start single-agent + tools before multi-agent
    MUST document handoffs as structured contracts when more than one agent or step owns state
    MUST name iteration limits for any ReAct-style loop and timeouts for tool-heavy flows
    MUST, for high-risk flows, list human gates with approve / reject / modify semantics
    MUST map the chosen design to concrete paths per target surface (see refs/platforms-cursor-claude-opencode.md)
    SHOULD cap flat supervisor fan-out around ~8 specialists before splitting hierarchy or router
    NEVER assume identical feature flags across Cursor, Claude Code, and OpenCode — verify in refs or current docs
  }
}
```

## Workflow

1. **Classify Mode** — determine whether single-agent (Mode A) or multi-agent (Mode B) is appropriate:
   - Mode A if: narrow task, low risk, no compliance gate, no specialist decomposition needed
   - Mode B if: many specialists needed, audit trail required, regulated checkpoints, complex handoffs
   - **Done** when: mode choice is recorded in `pattern_choice`
2. Pick a **primary pattern** using the table below; note **combinations** (supervisor + ReAct workers + HITL on exit).
   - **Done** when: `pattern_choice` is set with rationale
3. Fill **handoff contract** (what each step produces, validation, failure behavior) — see refs/patterns-and-composition.md.
   - **Done** when: `handoff_contract` is documented (Mode B) or marked N/A (Mode A)
4. Add **production** items: timeouts, circuit breaker / fallback, observability per agent, cost notes.
   - **Done** when: production checklist items are checked off
5. Emit **artifact plan**: for each surface, list files or `opencode.json` keys to create or extend.
   - **Done** when: `artifact_plan` list is non-empty

**Gotchas:**
- Supervisor fan-out cap ~8 specialists before hierarchical splitting
- ReAct iteration limits: set `max_iterations` (typically 5-10) with a safe stop path
- HITL SLA timeouts: define max wait time (e.g., 30s) before escalation or fallback
- Subagent watchdog: set per-agent timeout (e.g., 120s) to detect hung workers
- Parallel worker race conditions: use structured handoffs, not shared state
- Coordinator degradation: supervisor should have degraded-mode fallback (fewer tools, simpler prompt)

## Pattern picker (summary)

| Pattern | Role | Good fit |
|--------|------|----------|
| Supervisor | Central coordinator delegates, validates, synthesizes | Many specialists, audit trail, clear ownership |
| ReAct | Think → act (tool) → observe → repeat | Tool use, progressive discovery, unknown depth |
| Human-in-the-loop | Pause for approve / reject / modify | Deletes, spend, external side effects, compliance |
| Sequential (CoT / pipeline) | Strict order; step *n+1* needs validated output of *n* | Diagnostics, policy-like procedures |
| Router (variant) | Classify then dispatch to one specialist | Diverse intents, single winner per request |
| Hierarchical | Supervisors of supervisors | Large fan-out (10+ workers), layered domains |

**Combinations:** Patterns compose — e.g. supervisor routes to ReAct workers; HITL gates deployment; sequential pipeline inside one branch. The workflow handles this via `pattern_choice` + `handoff_contract`.

Detail, composition, and failure modes: [refs/patterns-and-composition.md](refs/patterns-and-composition.md).

## Surfaces cheat sheet

| Idea | Cursor | Claude Code | OpenCode |
|------|--------|--------------|----------|
| Reusable workflow | `.cursor/skills/.../SKILL.md` | `.claude/skills/.../SKILL.md` | `.opencode/skills/.../SKILL.md` |
| Specialized agent | Rules + skills + task conventions | `.claude/agents/*.md`, subagents | `agent` in `opencode.json` or `.opencode/agents/` |
| Long-lived instructions | `.cursor/rules/*.mdc`, `AGENTS.md` | `CLAUDE.md`, `.claude/CLAUDE.md` | `instructions` in config (can glob `.cursor/rules`) |
| External tools | `.cursor/mcp.json` | MCP in project / plugins | `mcp` in `opencode.json` |
| Permission gates | Document in skill / rules | Document + product flows | `permission` in `opencode.json` (`ask` / deny) |

Full paths, merge order, and Ralph CLI note: [refs/platforms-cursor-claude-opencode.md](refs/platforms-cursor-claude-opencode.md).

## Production checklist (minimum)

- [ ] Single-agent + MCP tried first if the task is narrow
- [ ] Handoff payload is structured (fields or schema), not only free prose
- [ ] ReAct-like loops have `max_iterations` (or equivalent) and a safe stop path
- [ ] Tool calls that mutate production, spend money, or mass-notify users have HITL or `permission: ask`
- [ ] Supervisor has a degraded mode (fewer tools, simpler prompt, or fallback agent) if coordination fails
- [ ] Per-agent or per-step metrics possible (not only end-to-end success rate)

## References

- [Patterns and composition](refs/patterns-and-composition.md)
- [Cursor, Claude Code, OpenCode mapping](refs/platforms-cursor-claude-opencode.md)
- [Outcome metrics (Mode B)](refs/outcome-metrics.md)
- [Evaluation protocol](refs/evaluation-protocol.md)

## Mode A — Single-agent + tools

When: narrow task, low risk, no compliance gate, no specialist decomposition needed.

1. Classify task (read-heavy / write-heavy / creative / regulated)
2. Check if MCP tools exist for the domain
3. Emit single-agent artifact plan with surface path

## Mode B — Multi-agent orchestration

When: specialists needed, audit trail required, regulated checkpoints, complex handoffs.

Add `handoff_contract` and `hitl_checkpoints` to outputs. See [refs/patterns-and-composition.md](refs/patterns-and-composition.md) for handoff contract fields and example.

**Production items:** per-agent timeouts (max 120s), circuit breaker (trip after 3 failures), degraded fallback mode, per-agent metrics (success rate, latency p50/p95).


