# Analysis Linkage Guide: Connecting Stories to Project Context

This guide shows **how to link user stories to different types of analysis documents**, with concrete examples for each type.

---

## Quick Reference: Analysis Types

| Analysis Type | When You Have It | How to Link | Example |
|---|---|---|---|
| **Discovery / User Research** | User interviews, usability tests, surveys | Quote user pain; cite section & date | *"Per user research (May 2024, 8/12 candidates report upload failures)"* |
| **Business Case / ROI Analysis** | Cost-benefit, pricing strategy, market analysis | Link to metric & financial impact | *"Per business case: +15% application rate = +$X revenue"* |
| **Impact Assessment** | What changes, what breaks, ripple effects | Cite affected domains & constraints | *"Per impact assessment: Resume model changes → 3 API endpoints affected"* |
| **Architecture Decision Record (ADR)** | Why we chose tech X over Y | Link decision to implementation constraint | *"Per ADR-007: Prisma ORM required → use Prisma relations, not raw SQL"* |
| **Domain Model / Data Analysis** | Entity relationships, aggregates, boundaries | Reference model diagram; cite entities | *"Per domain analysis: Candidate aggregate includes 1-to-many Resume relation"* |
| **Tech Debt Log** | Known issues, deprecated code, performance problems | Link debt item to scope/implementation | *"Per tech debt log TD-42: Resume upload has no error recovery"* |
| **OKR / Strategic Goal** | Quarterly objectives, business priorities | Map story to metric & OKR | *"Supports Q3 OKR: Candidate Experience +15% (metric: completion rate)"* |
| **Compliance / Regulatory** | GDPR, SOC2, data privacy rules | Cite regulation & requirement | *"Per GDPR Article 17: Must allow deletion of candidate data"* |

---

## Example 1: Linking to User Research

### Scenario
You discovered via user interviews that candidates lose resumes during upload (pain point).  
You're writing a story to support multiple resume uploads.

### How to Link

**Poor linkage (vague):**
```markdown
## 🔗 Project Analysis Linkage

### Referenced Analysis
- Per user research, candidates have trouble uploading resumes
```
❌ Too vague. Which research? When? How many users? What exactly is the problem?

---

**Good linkage (specific & traceable):**
```markdown
## 🔗 Project Analysis Linkage

### Referenced Analysis Documents

- **User Research: Resume Submission Friction** (file: `docs/discovery/user-research-may-2024.md`)
  - Date: May 2024
  - Participants: 12 candidates (mix of technical, non-technical backgrounds)
  - Section: 3.2 "Upload Failures and Workarounds"
  
  Key Finding:
  > "12 of 12 candidates (100%) reported upload failures or confusion. 5 candidates abandoned the application after >2 failed attempts. Common workaround: email resume to recruiter instead."
  
  Implication for this story: Current single-upload UX is a blocker. Multiple-resume support addresses the workaround pattern.

### Traceability to Business Goals

- **Business Metric: Application Completion Rate**
  - Current: 78% (from analytics)
  - Target: 85% (per Q3 OKR)
  - This story addresses: Removing friction from upload step
  - Expected impact: +5-8% completion rate (per impact assessment)

### Assumptions Inherited from Analysis

- **Assumption:** Candidates need to upload 1-3 resumes (not 10+)
  - Source: User research, "file count" question in interview
  - Impact on this story: Accept limit of 10 files; simple array UI (no pagination)
  - Review trigger: Monitor post-launch; if >10% of candidates hit limit, escalate for pagination

- **Assumption:** Candidates upload only PDF and DOCX
  - Source: User research, "file types you use" question
  - Impact on this story: Validate file type server-side; reject other formats
  - Review trigger: If user research updated with new file type demand

### How to Keep Synced

- When user research is updated: Check if new findings change AC or scope
- Cadence: Review before each sprint planning
- If new friction point discovered (e.g., "candidates want to preview before submitting"): Create new story; don't expand current one
```

---

## Example 2: Linking to Architecture Decision Record (ADR)

### Scenario
Your team decided to use Prisma ORM for consistency (ADR-007).  
You're writing a story about the Resume model, which must follow this ORM choice.

### How to Link

**Poor linkage:**
```markdown
## Implementation Notes

Use Prisma for the Resume model (standard practice).
```
❌ Doesn't explain why, doesn't cite the decision, hides the constraint.

---

**Good linkage:**
```markdown
## Implementation Notes

**Prisma ORM Requirement:**
The Resume model must use Prisma relations, not raw SQL queries or custom ORMs.

- Rationale: Per ADR-007 (Standardize on Prisma ORM), we adopted Prisma across all backend services for consistency, reduced cognitive load, and unified migration tooling.
- Implication for this story:
  - Use Prisma `create()` and `findMany()` for Resume queries
  - Leverage Prisma's type safety and auto-generated types
  - Migrations are managed via `prisma migrate` (not custom SQL)

- Link: See ADR-007 in `docs/adr/ADR-007-orm-strategy.md` for full decision context

## 🔗 Project Analysis Linkage

### Referenced Architecture Decisions

- **ADR-007: Standardize on Prisma ORM** (file: `docs/adr/ADR-007-orm-strategy.md`)
  - Decision: All backend services must use Prisma Client (not raw SQL, not other ORMs)
  - Rationale: Consistency across codebase, type safety, unified migrations
  - Constraints imposed on this story:
    1. Resume model uses Prisma relations (Resume → Candidate)
    2. All queries use Prisma Client API (no raw SQL)
    3. Migrations are Prisma migrations (auto-tracked in version control)

### Related Domain Model

- **Domain Analysis: Candidate Aggregate** (file: `docs/domain/candidate-aggregate.md`)
  - Entity: Candidate (aggregate root)
  - Relations:
    - 1 Candidate → many Education
    - 1 Candidate → many WorkExperience
    - 1 Candidate → many Resume ← **This story**
  - Boundary: All three entities (Education, WorkExperience, Resume) are children of Candidate; queries should load full aggregate when possible

### Assumptions & Constraints

- **Assumption:** Prisma Client is available and initialized
  - Impact: Use `prisma.resume.create()`, etc.; no need to set up DB connection
  - Review: If we migrate away from Prisma, update queries in this story

- **Constraint:** Prisma v5.13+ (from backend/package.json)
  - Impact: Use latest Prisma syntax; no legacy query styles
  - Review: Before upgrading Prisma major version, check for breaking changes in Resume model
```

---

## Example 3: Linking to Impact Assessment

### Scenario
Your impact assessment analyzed the effort and benefit of supporting multiple resume uploads.  
You're writing a story to implement it, and you want to tie the story to the ROI analysis.

### How to Link

**Poor linkage:**
```markdown
## Business Value

This feature improves candidate experience.
```
❌ Vague. What metric improves? By how much? What's the cost-benefit?

---

**Good linkage:**
```markdown
## 📖 Narrative & Business Value

### Business Value

Supporting multiple resume uploads removes a key friction point in the candidate application flow.

**Quantified Impact (from impact assessment):**
- **Effort:** 3 engineering days + 2 QA days
- **Benefit:**
  - Eliminates async email workaround: saves ~3h/week per recruiter × 5 recruiters = 15h/week savings
  - Reduces recruiter follow-up emails: ~2 emails per candidate × 500 applications/quarter = 1000 fewer emails
  - Improves application completion rate: target +8% (from 78% → 86%)
  
- **ROI:** 5 eng days × $X/day = $Y cost vs. $Z savings (recruiting 3h/week, reduced email ops); breakeven in Q2

### 🔗 Project Analysis Linkage

### Referenced Analysis Documents

- **Impact Assessment: Resume Upload Friction** (file: `docs/impact/candidate-experience-analysis-v2.md`)
  - Date: April 2024
  - Sections: 2.1 (Problem), 2.2 (Solution), 2.3 (Financial Impact)
  
  Summary:
  > "Current single-upload flow causes 8% of candidates to abandon, and forces recruiters to request resumes via email (async, error-prone). Supporting 1-3 resume uploads in one operation removes this blocker and saves ~3h/week in recruiter follow-up."
  
  Cost-Benefit Breakdown:
  | Item | Value | Notes |
  |---|---|---|
  | Engineering effort | 5 eng-days | 3 dev + 2 QA (from Jira estimates) |
  | Cost @ $X/day | $Y | Fully-loaded engineer cost |
  | Recruiter time saved/week | 3h × 5 recruiters = 15h | Email + follow-up elimination |
  | Annual cost of recruiter time | $Z | Per HR cost model |
  | Breakeven | [Q2] | Assuming 50% of candidates use feature within 2 weeks |

### Traceability to Business Goals

- **Q3 OKR: Candidate Experience Score +15%**
  - Metric: Application completion rate (currently 78%, target 85%)
  - This story addresses: Reducing upload friction (primary driver, per impact assessment analysis)
  - Expected contribution: +5-8% completion rate
  - Other drivers: (1) Mobile-friendly form, (2) Auto-save form progress — see STORY-XXX, STORY-YYY

- **Annual Recruiting Goal: Scale candidate pipeline by 20%**
  - This story supports: Reducing recruiter burden (via time savings) so team can handle more candidates

### Assumptions & Constraints from Analysis

- **Assumption:** Feature adoption will be 50%+ within 2 weeks
  - Source: Impact assessment, "adoption model" section
  - Impact on this story: Monitor adoption post-launch; if <30%, revisit UX
  - Review trigger: 2 weeks post-launch, check analytics

- **Assumption:** Removal of email workaround is linear (1 feature adoption = 1 fewer email)
  - Source: Impact assessment, "recruiter workflow mapping"
  - Reality check: Some candidates may upload AND email (habit); adjust savings estimate if observed
  - Review trigger: Survey recruiters post-launch on actual workload change

### How to Keep Synced

- When impact assessment is updated: Verify ROI assumptions still hold
- Cadence: Review before sprint; re-assess post-launch (2 weeks, then quarterly)
- If breakeven analysis changes (e.g., new tool cost, staffing changes): Update Business Value section and escalate if ROI no longer positive
```

---

## Example 4: Linking to OKR / Strategic Goal

### Scenario
Your Q3 OKR is "Improve Candidate Experience Score by 15%".  
You're writing stories that contribute to this OKR.  
You want the story to clearly show which OKR it serves and how.

### How to Link

**Poor linkage:**
```markdown
## Business Value

Supports candidate experience improvements.
```
❌ Which OKR? What metric? How does this story move the needle?

---

**Good linkage:**
```markdown
## 📖 Narrative & Business Value

### Business Value

This story directly supports the Q3 OKR: **Improve Candidate Experience Score by 15%** (metric: application completion rate, target 78% → 85%).

**How this story contributes:**
- AC #1-7 remove resume upload friction (primary friction point identified in discovery)
- AC #9 adds progress indicator (improves perceived performance on slow connections)
- AC #10 adds logging (enables post-launch verification of completion rate lift)

---

## 🔗 Project Analysis Linkage

### Referenced Business Goals

- **Q3 OKR: Candidate Experience Score +15%**
  - Metric: Application completion rate
  - Current baseline: 78% (from analytics, March 2024)
  - Target: 85% (+7 percentage points)
  - Measurement method: Google Analytics event "application_submitted" / "application_started"
  
  Strategic drivers (from OKR planning doc):
  1. Reduce upload friction (THIS STORY)
  2. Mobile-responsive form (STORY-089)
  3. Auto-save form progress (STORY-090)
  
  Each story targets one driver; combined impact expected: +7-15%

### Traceability: Which Acceptance Criteria Measure Progress?

- **AC #1-7** (multiple resume upload): Directly remove friction; expected +5-8% completion rate
- **AC #8** (mobile support): Enables mobile-first users; expected +2-3% completion rate
- **AC #9** (progress indicator): Improves perceived performance; expected +1-2% completion rate
- **AC #10** (logging): Enables post-launch verification; no direct metric move, but essential for measurement

### Assumptions Inherited from OKR

- **Assumption:** Upload friction is a primary blocker to completion
  - Source: Discovery research + user interviews
  - Impact on this story: Prioritize upload UX; invest in AC #8-9 (mobile, progress indicator)
  - Review trigger: Post-launch, check analytics for actual impact; if < +3% lift, investigate other blockers (e.g., form length)

- **Assumption:** Feature adoption will be 60%+ within 2 weeks
  - Source: Historical feature adoption patterns + product marketing campaign planned
  - Impact on this story: Focus AC on ease of use; minimize learning curve
  - Review trigger: 2 weeks post-launch, check adoption %; if <40%, escalate to product

### How to Keep Synced

- When Q3 OKR is redefined: Update "Traceability" section and re-assess AC priorities
- When discovery research finds new friction points: Create new stories; don't expand this one
- When other contributing stories change: Update the "Strategic drivers" list and re-assess this story's relative importance
- Cadence: Review OKR alignment every sprint (to catch scope drift); re-assess post-launch (2 weeks, then end of quarter)
```

---

## Example 5: Linking to Domain Model / Data Analysis

### Scenario
You have a domain analysis showing the Candidate aggregate and its relationships.  
You're writing a story that touches the Resume entity.  
You want to ensure the story respects aggregate boundaries and doesn't create circular dependencies.

### How to Link

**Poor linkage:**
```markdown
## Technical Design

Resume table stores resume files. No issues.
```
❌ Doesn't reference the domain model, doesn't check boundaries, misses relationship constraints.

---

**Good linkage:**
```markdown
## 🏗️ Technical Design

### Affected Systems & Domains

- **Domain: Candidate Aggregate**
  - Root entity: Candidate
  - Child entities: Education, WorkExperience, Resume
  - Per domain analysis: All three are children of Candidate; queries should load full aggregate when possible
  
  Implication for this story:
  - Resume create/update/delete operations must cascade within Candidate aggregate
  - No direct queries from other aggregates to Resume (go through Candidate)
  - If another aggregate needs resume data, it queries Candidate for it

---

## 🔗 Project Analysis Linkage

### Referenced Domain Model

- **Domain Analysis: Candidate Aggregate** (file: `docs/domain/candidate-aggregate.md`)
  - Aggregate Root: Candidate
  - Bounded Context: Recruiting
  
  Entities and relationships:
  ```
  Candidate (root)
    ├── Education[] (1-to-many)
    ├── WorkExperience[] (1-to-many)
    └── Resume[] (1-to-many) ← This story
  ```
  
  Invariants:
  - Candidate email must be unique (enforced at DB level)
  - Education, WorkExperience, Resume can be empty (optional)
  - Deleting Candidate cascades to all children (no orphans)

### Implementation Constraint: Aggregate Boundary

Per domain analysis, Resume is a child of Candidate aggregate, not a standalone entity.

Impact on this story:
1. Resume create/update/delete are always in context of Candidate (e.g., POST `/candidates/:id/resumes`, not POST `/resumes`)
2. Loading Candidate also loads resumes (via Prisma relation `include`)
3. No cross-aggregate queries (e.g., "find all resumes with file size > 10MB") — if needed, query is at Candidate level, not Resume level

### Assumptions & Constraints

- **Assumption:** Resume is a value object (not an entity with its own identity outside Candidate)
  - Impact: No Resume-to-Resume relations; no Resume queried independently
  - Review trigger: If a future story needs "Resume versioning" or "Resume sharing between candidates", this assumption breaks — escalate to architecture

- **Note:** Prisma supports cascade deletes via two mechanisms — choose based on context
  - **Schema-level:** Add `onDelete: Cascade` to the `@relation` directive on the child model (e.g., `Resume`); the database engine then cascades deletes automatically when the parent (`Candidate`) is deleted
  - **Client API-level:** Use nested write operations in Prisma Client — `deleteMany: {}` inside an `update` to remove all children, or `delete: true` on a nested relation — to delete children programmatically in the same transaction
  - Implication: No application-level cascade logic is required; pick the mechanism that fits the access pattern (schema cascade for automatic DB-level cleanup; nested delete calls for selective programmatic control)
  - Review: Verify that `onDelete: Cascade` is present on the Resume relation in `schema.prisma`, or that the deletion path uses nested Prisma Client delete operations — not manual multi-step deletes outside a transaction

### How to Keep Synced

- When domain model is updated (e.g., "Resume becomes independent entity"): This story's design assumptions break — escalate
- When new relationships are added to Candidate (e.g., "Candidate → Interview"): Update "Affected Systems" list
- Cadence: Review before sprint; re-assess post-launch if new domain insights emerge
```

---

## Example 6: Linking to Compliance / Regulatory Requirements

### Scenario
You have GDPR compliance requirements (right to deletion, data minimization).  
You're writing a story to allow candidates to delete their resumes.  
You want to ensure the story respects regulatory constraints.

### How to Link

**Poor linkage:**
```markdown
## Technical Design

Users can delete their resumes. No special handling needed.
```
❌ Ignores regulatory implications, doesn't cite compliance rules, misses data retention constraints.

---

**Good linkage:**
```markdown
## 🔗 Project Analysis Linkage

### Referenced Compliance Requirements

- **GDPR: Right to Erasure (Article 17)** (file: `docs/compliance/gdpr-requirements.md`)
  - Requirement: Individuals have the right to request deletion of their personal data
  - Scope: Includes resume content (text, file content)
  - Implication for this story:
    1. Candidates can delete their own resumes via UI
    2. When deleted, file must be removed from filesystem (not just DB)
    3. No audit log of deleted file content (data minimization)
    4. Deletion must complete within 30 days of request (legal requirement)

- **SOC2 Type II: Data Retention & Destruction** (file: `docs/compliance/soc2-controls.md`)
  - Requirement: Deleted customer data must be securely destroyed (not just marked as deleted)
  - Implication: Resume files deleted from DB must also be deleted from filesystem; residual data (temp files, logs) must be purged

### Assumptions & Constraints

- **Constraint:** Resume deletion is permanent and immediate (no soft delete, no archive)
  - Impact: No "undelete" feature; no recovery (by design, for GDPR compliance)
  - Implementation: `DELETE FROM resumes WHERE id = ?` and `fs.unlinkSync(filePath)` in transaction

- **Constraint:** Deletion audit log cannot include file content (data minimization)
  - Impact: Log only metadata ("Resume deleted", timestamp, candidateId) — NOT file content
  - Implementation: Use redacted logging; scrub sensitive fields before persisting logs

### How to Keep Synced

- When GDPR requirements are updated (e.g., new data categories in scope): Verify story still complies
- When compliance audits happen: Cross-check implementation against this story's compliance sections
- Cadence: Review before sprint; update if regulatory landscape changes
```

---

## Quick Checklist: Are Your Analysis Links Good?

Use this before finalizing a story:

- ✅ **Specific?** Does the linkage name the document, section, date, or finding? (Not vague like "per analysis")
- ✅ **Traceable?** Can someone find the source document quickly? (Include file path or link)
- ✅ **Justified?** Does the linkage explain WHY this analysis matters for the story? (Not just "mentioned in ADR-X")
- ✅ **Constraint-aware?** Does the linkage call out constraints or assumptions imposed on the story?
- ✅ **Sync-planned?** Is there a clear plan for how the story stays current if analysis evolves?

If all five are ✅, your analysis linkage is solid.

---

## FAQ

**Q: What if I don't have analysis to link?**  
A: That's a signal to pause and do discovery first. Document "No prior analysis; exploratory story" and create a follow-up task to gather analysis before implementation. Or escalate to stakeholders: "Should we investigate X before building?"

**Q: Can I link to multiple analysis documents?**  
A: Yes! Stories often span multiple concerns (user research, architecture, compliance, OKR). Link to all relevant docs.

**Q: What if analysis is out of date?**  
A: Update the analysis first, then update the story. Stale analysis → stale stories → wasted engineering effort. Be proactive.

**Q: How detailed should linkage be?**  
A: Detailed enough that someone unfamiliar with the analysis can understand the context. Include quotes, section numbers, dates, and implications. See examples above.

