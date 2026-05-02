---
name: enriched-user-stories
description: |
  Write enriched user stories that serve as a single source of truth for cross-functional teams.
  Use this skill whenever the user needs to create, draft, or refine a user story—especially when the story must connect to project analysis, architecture decisions, discovery findings, or business goals.
  This includes: converting analysis into actionable stories, writing stories that teams can implement autonomously, connecting functional requirements to technical constraints, and ensuring stories link to their upstream context.
  Works for all story types (features, technical debt, bug fixes, refactors) across product, engineering, and infrastructure domains.
compatibility: |
  - User provides: story intent, project context, or reference to analysis documents
  - Output: markdown story file ready for sprint planning
---

## Overview

An enriched user story is the **single source of truth** for a piece of work. It contains:
- **What** the team will build (narrative, acceptance criteria)
- **Why** it matters (business value, project context)
- **How** it fits the system (technical implications, dependencies, architecture alignment)
- **Where it came from** (traceability to analysis, decisions, business goals)

This skill guides you through authoring stories that enable teams to implement autonomously—with no further clarification needed—and that remain correct and useful as the project evolves.

---

## Your Workflow

### Phase 1: Gather Context

Before drafting, collect:

1. **Story Intent** — What problem are you solving? What are you building?
   - Example: "Candidates should be able to upload multiple resume files, not just one."

2. **Project Analysis** — What discovery, architecture decision, or business context backs this story?
   - Look for: discovery findings, impact assessments, architecture decision records (ADRs), business case documentation, OKRs, or previous analysis.
   - If you don't have analysis, the skill will help you identify what's missing and prompt you to add it later.

3. **Technical Context** — Which systems does this touch? What are the constraints?
   - Example: "Affects the Candidate domain model (currently Resume is a single row), Prisma schema, file upload service, API contract."

4. **Audience** — Who will implement this? (affects the technical depth)
   - Are they familiar with the codebase? Do they need architecture context?

### Phase 2: Draft the Story

The skill will guide you through these sections (in order):

**A. Metadata**
- ID: Auto-generated or provided (e.g., `STORY-042`)
- Title: Clear, outcome-focused (e.g., "Support multiple resume uploads per candidate")
- Status: `Draft` (will be updated in sprint planning)

**B. Functional / Product Components**
- **Narrative** (user story format or problem statement)
  - *As a [user], I want [capability] so that [business value]*
  - OR: *Problem:* [context] *Solution:* [what we're building]
- **Business Value** — Why does this matter? What does the user or business gain?
- **Acceptance Criteria** — Testable, specific conditions for "done"
- **Out of Scope** — What's explicitly NOT in this story?

**C. Technical Components**
- **Affected Systems & Domains** — Which parts of the codebase change?
- **Data Model Changes** — Schema updates, new relations, migrations
- **API Contract Changes** — New endpoints, modified payloads, breaking changes
- **Non-Functional Requirements** — Performance, scalability, security, accessibility
- **Dependencies** — Other stories or external work this depends on
- **Implementation Notes** — Architecture patterns, key decisions, tech debt context
- **Security & Privacy** — Any sensitive data handling, compliance implications
- **Observability** — Metrics, logging, monitoring to add
- **Rollout & Rollback** — Feature flags? Staged rollout? Safe rollback plan?

**D. Project Analysis Linkage** ⭐ **CRITICAL**
- **References to Analysis** — Which discovery docs, impact assessments, ADRs, or OKRs justify this story?
- **Traceability** — Which user needs, pain points, or business goals from the analysis does this address?
- **Assumptions & Constraints Inherited** — What analysis assumptions does this story depend on?
- **Future Sync Plan** — If analysis evolves, how do we keep this story aligned?

**E. Quality Gates**
- Definition of Ready (DoR) checklist
- Definition of Done (DoD) checklist

### Phase 3: Verify & Save

The skill will:
1. **Generate a markdown file** at `/stories/[ID]-[title-slug].md` in your source project
2. **Provide a verification checklist** (Definition of Ready)
3. **Flag any missing linkage** to analysis and prompt you to add it
4. **Highlight risks** — dependencies, scope creep, unclear acceptance criteria

You review, refine, and save the story. The skill's checklist helps you avoid common pitfalls (vague acceptance criteria, orphaned technical decisions, missing analysis links, etc.).

---

## Key Principles

### 1. Analysis Linkage is Mandatory

Every story must answer: **"Where did this come from?"**

Examples:
- *Linked to discovery finding: "Candidates report CVs are lost during upload"*
- *Linked to ADR: "We adopt Prisma for ORM consistency per ADR-007"*
- *Linked to business goal: "Improves candidate experience per Q3 OKR: retention +15%"*
- *Linked to impact assessment: "Reduces manual data entry by 3h/week per analysis"*

If a story has no analysis backing, the skill will ask: "What analysis justifies this?" If none exists, that's a signal to pause and do discovery first.

### 2. Acceptance Criteria Must Be Testable

Not: *"Candidates can upload resumes"* ✗

Yes: 
- Candidate can select multiple files (PDF, DOCX) from browser dialog
- System stores each file with upload timestamp and file type
- API returns 201 on success, 400 on invalid file type, 413 if >10MB
- GET /candidates/:id includes array of resume objects with filePath, fileType, uploadDate
- UI shows all uploaded files with download links

### 3. Context is Everything

An engineer new to the codebase should read this story and understand:
- What they're building and why
- Which systems they'll touch
- What architecture patterns they should follow
- What analysis informed this choice (so they don't question it later)

Avoid: *"Same as spec"*, *"See Confluence"*, *"Standard implementation"* — these are vague and break the "single source of truth" principle.

### 4. Technical & Product Components Are Siblings, Not Sequenced

Don't write functional requirements first, then bolt on technical stuff. They should be **co-written**, because:
- Technical constraints shape what's feasible
- Product decisions have technical implications
- Teams make decisions faster when both are visible upfront

Example: "We want to support S3 uploads (technical constraint) to scale beyond local disk (product driver)."

---

## Structure of the Markdown File

When the skill generates your story, it will follow this structure:

```markdown
# [STORY-ID] [Title]

**Status:** Draft  
**Created:** [date]  
**Last Updated:** [date]

## 📖 Narrative & Business Value

### User Story (or Problem Statement)

[Narrative here]

### Business Value

[Why this matters]

### Out of Scope

[What's explicitly NOT in this story]

## ✅ Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
...

## 🏗️ Technical Design

### Affected Systems & Domains

[Which parts of the codebase change]

### Data Model Changes

[Schema, migrations, new relations]

### API Contract Changes

[Endpoints, payloads, breaking changes]

### Implementation Notes

[Architecture patterns, key decisions]

### Non-Functional Requirements

[Performance, security, accessibility, etc.]

### Dependencies

[Other stories, external work]

### Observability

[Metrics, logging, monitoring]

### Security & Privacy

[Sensitive data handling, compliance]

### Rollout & Rollback Plan

[Feature flags, staged rollout, safe rollback]

## 🔗 Project Analysis Linkage

### Referenced Analysis Documents

- [Document Title](link) — [why it's relevant]
- ...

### Traceability to Business Goals

- [OKR or business goal] — addressed by [which acceptance criteria]
- ...

### Assumptions & Constraints Inherited from Analysis

- [Assumption] — impacts [which part of the story]
- ...

### How to Keep This Story Synced as Analysis Evolves

[Plan for staying current]

## 📋 Definition of Ready (DoR)

- [ ] Narrative is clear; engineers understand "why"
- [ ] Acceptance criteria are testable and specific
- [ ] Technical scope is bounded and well-understood
- [ ] Dependencies are identified and scheduled
- [ ] Analysis linkage is present and traceable
- [ ] Non-functional requirements are explicit (or justified as N/A)
- [ ] Rollout plan is documented (or justified as "standard deployment")
- [ ] No open questions remain for the implementation team

## ✨ Definition of Done (DoD)

- [ ] All acceptance criteria pass
- [ ] Code is reviewed and merged
- [ ] Integration tests pass
- [ ] Observability (logging, metrics) is in place
- [ ] Documentation updated (if applicable)
- [ ] Story is linked to merged PR(s)
- [ ] Analysis-linked assumptions are verified in implementation

---
```

---

## How Analysis Linkage Works

### Types of Analysis You Can Link To

| Analysis Type | Example | How to Reference |
|---|---|---|
| **Discovery / User Research** | "Users report resume uploads fail after 5MB" | `Referenced in: User Interview, May 2024, participant notes` |
| **Business Case** | "Improve candidate experience to increase application rate by 15%" | `Referenced in: Q3 OKR: Candidate Experience` |
| **Impact Assessment** | "Reducing manual data entry saves 3h/week per recruiter" | `Referenced in: Impact Assessment v2, section 3.2` |
| **Architecture Decision** | "Use Prisma for ORM consistency across backend" | `Referenced in: ADR-007: ORM Strategy` |
| **Domain Analysis** | "Candidate entity includes education, work experience, resumes (1-to-many)" | `Referenced in: Domain Model Diagram, Candidate aggregate` |
| **Technical Debt Log** | "Resume upload service has no error recovery" | `Referenced in: Tech Debt Log, item TD-42` |

### How to Write Analysis Linkage in Your Story

**DON'T:** Just say *"Per analysis"* ✗

**DO:** Be specific and traceable:

```markdown
## 🔗 Project Analysis Linkage

### Referenced Analysis Documents

- **Discovery Findings** (file: `docs/discovery/user-research-may-2024.md`)
  - Section: "Resume Upload Failures"
  - Finding: 12% of candidates report upload failures >5MB; primary blocker to completion
  
- **Impact Assessment** (file: `docs/impact/candidate-experience-v2.md`)
  - Section: 3.2 "Resume Management Friction"
  - Impact: Reducing manual re-uploads saves 3h/week per recruiter; removes async email loop

- **Architecture Decision Record** (file: `docs/adr/ADR-007-orm-strategy.md`)
  - Decision: Adopt Prisma ORM for consistency
  - Implication: Resume model must use Prisma relations, not custom SQL

### Traceability to Business Goals

- **Q3 OKR: Candidate Experience +15%** 
  - This story addresses: reducing friction in resume submission (one of three key drivers)
  - Acceptance criteria #3 and #4 directly measure progress
  
### Assumptions Inherited from Analysis

- Assumption: Resume uploads are only PDFs and DOCX (per user research)
  - Impact: File type validation in fileUploadService accepts only these types
  - Review: If research reveals users need image support, update AC and revalidate
  
- Assumption: Candidates rarely upload >10 files
  - Impact: No pagination UI; simple array display acceptable
  - Review: Monitor analytics post-launch; if violated, escalate to design for pagination

### Keeping This Story Synced

- If user research discovers new resume types needed: update AC #2 and file type validation
- If tech debt log updates (e.g., "Resume upload service refactored"): update Implementation Notes
- If Q3 OKR is redefined: update Business Value section and Traceability
- Sync cadence: Review when analysis docs are updated; check before each sprint planning
```

This style of linkage ensures:
- **Traceability**: Anyone can read the story and find the source analysis
- **Justification**: Every requirement can be traced back to a decision or finding
- **Synchronization**: When analysis evolves, you know exactly what to update
- **Autonomy**: Engineers implement without needing to hunt for context

---

## Common Pitfalls & How to Avoid Them

### 1. Missing Analysis Linkage
**Pitfall:** Story says "Upload multiple resumes" but doesn't explain why or where it came from.
**Fix:** Always include "Referenced Analysis" section. If no analysis exists, pause and do discovery—or explicitly note "No prior analysis; this is exploratory."

### 2. Vague Acceptance Criteria
**Pitfall:** *"System should handle multiple resume uploads"* — too vague to test.
**Fix:** Make them specific and measurable:
- *"User can select 1–10 files from browser dialog"*
- *"System rejects files >10MB with 413 error"*
- *"GET /candidates/:id returns array of resume objects"*

### 3. Technical Decisions Without Context
**Pitfall:** *"Use async processing for file upload"* — why? Cost? Performance? Regulatory?
**Fix:** Explain the driver: *"Async processing per analysis finding: large uploads (>5MB) block UI. Queue-based upload improves perceived performance by ~2s."*

### 4. Forgetting Non-Functional Requirements
**Pitfall:** Acceptance criteria focus only on happy path; no mention of performance, security, accessibility.
**Fix:** Add NFR section explicitly (even if "N/A"):
- Performance: *"Resume upload completes in <5s for 10MB file on 4G"*
- Security: *"Virus scan all uploads via ClamAV before storage"*
- Accessibility: *"Upload button has ARIA label; progress indicator is screen-reader friendly"*

### 5. Scope Creep
**Pitfall:** Story includes multiple unrelated features (e.g., "Upload resumes AND rename files AND delete old versions").
**Fix:** Use "Out of Scope" section to be explicit:
```markdown
## Out of Scope

- Renaming uploaded files (future story)
- Automatic version history (future story)
- Integration with external resume parsers (future story)
```

### 6. Broken Rollout Plan
**Pitfall:** No mention of how to safely roll out or rollback.
**Fix:** Always include:
```markdown
## Rollout & Rollback Plan

- Feature flag: `FEATURE_MULTIPLE_RESUMES` (default: off)
- Rollout: Gradual, 10% → 50% → 100% over 3 days
- Rollback: Disable flag; no data migration needed
- Monitoring: Alert if resume upload error rate exceeds 1%
```

---

## Tips for Success

1. **Co-write with your team.** Don't draft in isolation. Involve a backend engineer, frontend engineer, and product person. Stories are better when multiple perspectives shape them.

2. **Link early.** Don't write the story first and add analysis links later. Use analysis to **drive** story scope and acceptance criteria.

3. **Use the DoR checklist before sprint planning.** Don't pull a story into a sprint if it fails the checklist. That's when you refine.

4. **Keep stories in version control.** Store stories in `/stories/[ID]-[title].md` so they evolve with the codebase. Link PRs and commits to story IDs.

5. **Revisit analysis when it changes.** If a discovery doc is updated, or an ADR is revised, find affected stories and update them. This keeps the system coherent.

---

## Next Steps

Provide:
1. **Story intent** (what problem, what we're building)
2. **Project context** (team, architecture, analysis available)
3. **Target implementation team** (their familiarity with codebase)

The skill will guide you through each section, generate the markdown file, and provide a checklist to verify readiness before sprint.
