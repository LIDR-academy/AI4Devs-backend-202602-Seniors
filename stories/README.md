# User Stories

This directory contains enriched user stories for the LTI Talent Tracking System. Each story is written using the enriched-user-stories skill and serves as a single source of truth for feature development.

## Story Naming Convention

Stories are named: `STORY-XXX-[title-slug].md`

Examples:
- `STORY-001-candidate-authentication.md`
- `STORY-042-multiple-resume-uploads.md`
- `STORY-045-resume-error-recovery.md`

## Story Structure

Each enriched user story includes:

1. **Narrative & Business Value** - User story + business impact (quantified)
2. **Acceptance Criteria** - 5-10 specific, testable criteria (with checkboxes)
3. **Technical Design** - Architecture, data model, API contracts, NFRs, security, rollout plan
4. **Project Analysis Linkage** - References to discovery research, ADRs, impact assessments, OKRs
5. **Definition of Ready** - Checklist confirming story is ready for development
6. **Definition of Done** - Completion criteria for sign-off

## How to Write a Story

### Step 1: Gather Analysis
Before writing, collect:
- **Discovery Research**: User research findings, interviews, pain points
- **Business Case**: Impact assessment, metrics, ROI
- **Architecture Decisions**: Relevant ADRs from `backend/docs/adr/` or CLAUDE.md
- **OKRs**: Business objectives and key results (if applicable)
- **Tech Debt**: References from tech debt log (if bug fix)

### Step 2: Invoke the Skill

In Claude Code, request:
```
Create an enriched user story for: [feature/bug/OKR]
Analysis available: [what you have]
Analysis missing: [what's TBD]
Output: /stories/STORY-XXX-[title].md
```

### Step 3: Validate the Story

Run the validator:
```bash
cd .claude/skills/enriched-user-stories
python3 scripts/validate_story.py /path/to/STORY-XXX.md
```

The validator checks:
- ✓ All required sections present
- ✓ Acceptance criteria are specific (not vague)
- ✓ Analysis linkage is explicit (file paths, not "per analysis")
- ✓ Definition of Ready is complete
- ✓ No vague language (etc., tbd, should work, etc.)

### Step 4: Review & Refine

Before pulling into a sprint:
- [ ] Product owner confirms narrative matches user research
- [ ] Engineering lead reviews technical design & identifies dependencies
- [ ] QA confirms acceptance criteria are testable
- [ ] Security team reviews if applicable (especially for file uploads, GDPR, auth)
- [ ] All items in Definition of Ready checked

## Example Stories

### Full Context Example: STORY-042 (Multiple Resume Uploads)
**Scenario**: All analysis available (discovery research, business case, architecture)
- **Discovery**: May 2024 research showing 12/12 candidates failed upload
- **Impact**: Saves recruiters 3h/week, improves application completion
- **Technical**: Prisma schema, Express endpoints, S3 storage, rollout plan
- **Result**: 556-line production-ready story, 85.7% quality score

### Partial Analysis Example: STORY-043 (Resume Error Recovery)
**Scenario**: Bug fix with tech debt log + ADR, no user research yet
- **Tech Debt**: TD-42 "File Upload Subsystem" with specific error handling gaps
- **Architecture**: ADR-007 "Prisma ORM" constraint (only Prisma queries)
- **Missing**: User research, impact assessment (flagged in DoR as TBD)
- **Result**: 497-line story, 100% quality score, honest gap-flagging

### OKR-Driven Example: STORY-044 (Progress Indicator)
**Scenario**: OKR-driven feature with discovery research, missing impact assessment
- **OKR**: Q3 "Improve Candidate Experience +15%" (78% → 85% completion)
- **Discovery**: Mobile UX friction, upload ambiguity as top pain point
- **Missing**: Impact assessment for this feature (flagged in DoR)
- **Traceability**: Which ACs move the metric vs. enable it
- **Result**: 832-line story, 100% quality score, explicit metric linkage

## Story Lifecycle

1. **Draft** - Story created, waiting for Definition of Ready review
2. **Ready** - All DoR items checked, dependencies identified, ready for grooming
3. **In Progress** - Claimed by team, work has started
4. **Done** - All DoD criteria met, tested, documented, merged, deployed

## Linking Stories to Code

Stories reference codebase locations:
```
Candidate Model: backend/src/domain/models/Candidate.ts
Resume Service: backend/src/application/services/resumeUploadService.ts
Prisma Schema: backend/prisma/schema.prisma
Migrations: backend/prisma/migrations/
```

When updating code referenced in a story, check if the story needs updating (especially file paths or line numbers in analysis linkage).

## Skill Reference

For detailed instructions on writing enriched stories:
- **Skill Guide**: `.claude/skills/enriched-user-stories/SKILL.md` (350+ lines)
- **Story Template**: `.claude/skills/enriched-user-stories/references/story-template.md`
- **Linkage Guide**: `.claude/skills/enriched-user-stories/references/analysis-linkage-guide.md`
- **Skill README**: `.claude/skills/enriched-user-stories/README.md`

---

**Last Updated**: May 1, 2026  
**Skill Status**: Production-Ready (93.7% quality)  
**Stories Location**: This directory
