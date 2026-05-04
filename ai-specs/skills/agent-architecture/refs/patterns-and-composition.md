# Patterns and composition

Use this ref when the SKILL.md summary is not enough for design or review.

## Supervisor (coordinator)

- **Flow:** User request → coordinator decomposes → assigns to workers → collects → validates → responds.
- **Strengths:** Central visibility, easier debugging, clear responsibility.
- **Risks:** Bottleneck on the coordinator; routing prompt grows with worker count; single point of failure.
- **Mitigations:** Plan validation against a small schema before execution; cache plans for recurring intents; circuit breaker to a simpler path when the coordinator degrades; consider a **router** when classification is stable and execution does not need ongoing synthesis.

## ReAct (reason + act + observe)

- **Flow:** Model reasons → calls a tool → observation returns → repeat until done or cap.
- **Strengths:** Handles unknown depth and external facts; fits tool-rich environments.
- **Risks:** Wandering, redundant tool calls, cost spikes; weak for very long plans without an explicit planner node.
- **Mitigations:** Hard iteration ceiling; summarize observations before feeding back; combine with a **planner + executor** split for long tasks.

## Human-in-the-loop (HITL)

- **Flow:** Agent proposes an action → execution pauses → human approves, rejects, or edits parameters → resume or abort.
- **Placement:** Before dangerous **tool** invocation vs after a **workflow** step when context matters; pick based on where risk sits.
- **Strengths:** Safety, compliance, audit narrative.
- **Risks:** Latency, reviewer fatigue, rubber-stamping.
- **Mitigations:** Narrow gates to high-risk classes only; SLA and timeout with **safe default** (reject or no-op); store request id, payload snapshot, and decision for audit.

## Sequential reasoning / pipeline (often paired with “chain-of-thought” discipline)

- **Flow:** Step outputs are **inputs** to the next step; order is contractual, not advisory.
- **Strengths:** Predictability; matches procedures (“symptom list before recommendation”).
- **Risks:** Rigidity; earlier step errors propagate.
- **Mitigations:** Validate each step output (schema or checklist) before the next step runs.

## Other common names in the wild

- **Pipeline / chain:** Ordered agents or nodes; overlaps with sequential pattern.
- **Swarm / parallel:** Many workers on independent slices; watch cost spikes and merge strategy.
- **Consensus:** Parallel attempts + aggregate (voting, judge model, rubric); higher cost, higher assurance on critical outputs.

## Composition (non-exclusive)

Example: **Supervisor** routes to specialists; each specialist runs an internal **ReAct** loop; **HITL** gates deployment or spend; a **pipeline** handles a regulated sub-flow inside one branch.

## Handoff contract (recommended fields)

Define at least:

1. **Producer** and **consumer** (which agent or node).
2. **Payload** shape (required keys, optional keys, max size hints).
3. **Validation** rule (schema, JSON parse, allowed enum).
4. **On failure:** retry, escalate to human, or fallback agent.

Avoid unconstrained prose as the only handoff between agents in production paths.
