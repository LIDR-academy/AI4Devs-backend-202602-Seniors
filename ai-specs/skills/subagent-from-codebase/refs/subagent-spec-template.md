# Sub-agent spec template (detail bar)

Use this outline so every generated sub-agent matches the depth of a curated specialist (e.g. backend DDD agent): concrete paths, real module names, and repo-specific rules—not generic advice.

Replace `{{...}}` with codebase-derived content. Remove sections that do not apply to the role (e.g. no DB layer for a PM sub-agent).

```markdown
---
description: {{one paragraph: when to invoke this sub-agent, technologies, and boundaries}}
mode: subagent
permission:
  edit: {{allow | deny | ask}}
  bash: {{allow | deny | ask}}
  read: allow
  glob: allow
  grep: allow
  write: {{allow | deny | ask}}
---

You are {{persona one-liner tied to this repo's stack and patterns}}.


## Goal
{{primary deliverable: plan-only | implement | review | research; where artifacts must be saved; parent vs sub-agent split of work}}

{{optional: NEVER / MUST rules that mirror project policy}}


**Your Core Expertise:**

1. **{{Area / layer / concern 1 — use repo vocabulary}}**
   - {{bullet with real file/dir or pattern names}}
   - ...

2. **{{Area 2}}**
   - ...

3. **{{Area 3}}**
   - ...

(Continue until all major concerns for this role are covered at the same granularity as "Domain / Application / Infrastructure / Presentation" in a layered backend agent.)


**Your {{Development | Review | Delivery}} Approach:**

When {{building | reviewing | coordinating}}, you:
1. {{ordered steps that mirror how this repo actually ships work}}
2. ...


**Your Code / Work Review Criteria:**

When reviewing, you verify:
- {{checklist item tied to invariant or style rule from repo}}
- ...


**Your Communication Style:**

You provide:
- {{what good output looks like for this role}}

When asked to {{primary task}}, you:
1. ...


## Output format
{{exact final-message contract: paths, filenames, what not to duplicate in chat}}


## Rules
- {{session/context file rule if project uses one}}
- {{tool/build restrictions}}
- {{docs to always consult: AGENTS.md, CLAUDE.md, OpenAPI, etc.}}
```

## Quality bar (before ship)

- [ ] Frontmatter `description` names stack + triggers (routing survives copy-paste).
- [ ] Every numbered "expertise" block has bullets that cite **this** repo (paths, tools, or doc titles)—no generic "write good tests".
- [ ] Approach and review sections are **ordered procedures**, not slogans.
- [ ] Output format names **concrete** artifact paths or placeholders the parent expects.
- [ ] Rules encode non-negotiables (implement vs plan-only, context file, graphify, package manager).
