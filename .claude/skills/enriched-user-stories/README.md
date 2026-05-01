# Enriched User Stories Skill

**Purpose**: Generate production-ready user stories with explicit linkage to project analysis (discovery research, business cases, ADRs, impact assessments, OKRs).

**Status**: Production-Ready (Iteration 1 - 93.7% quality score)

## Quick Start

### When to Use This Skill

Use this skill whenever you need to:
- Write a feature user story (with business context, discovery research, OKR alignment)
- Document a bug fix story (with tech debt log reference, architectural constraints, honest gap flagging)
- Create an OKR-driven story (with metric traceability and business goal linkage)
- Refactor a vague story draft into a production-ready format

### Basic Usage

Invoke the skill with a prompt like:

```
Create an enriched user story for: [feature/bug/refactor]
Context: [what analysis do we have? what's missing?]
Output: /stories/STORY-XXX-[title-slug].md
```

### Expected Output

Each story includes:
1. **Narrative & Business Value** - Clear user story + business impact quantified
2. **Acceptance Criteria** - 5-10 specific, testable items (not vague)
3. **Technical Design** - Affected systems, data model, API contracts, NFRs, security, rollout plan
4. **Project Analysis Linkage** - Explicit references to discovery, ADRs, impact assessments, OKRs (with file paths/section numbers)
5. **Definition of Ready** - Checklist + honest gap-flagging
6. **Definition of Done** - Completion criteria

## Skill Contents

- **SKILL.md** - Complete skill instructions (350+ lines)
- **references/story-template.md** - Copy/paste story template with all sections
- **references/analysis-linkage-guide.md** - 6 examples of good vs. bad analysis linkage
- **scripts/validate_story.py** - Validator checking story against Definition of Ready
- **evals/evals.json** - 4 test scenarios used during evaluation

## Evaluation Results

| Scenario | Story | Score | Key Result |
|----------|-------|-------|------------|
| Full context + discovery research | STORY-042 | 85.7% | Comprehensive 556-line story with 3 business goals traceability |
| Bug fix + partial analysis (TD, ADR) | STORY-043 | **100%** | Perfect gap-awareness, honest blockers |
| OKR-driven + mobile UX friction | STORY-044 | **100%** | Perfect metric traceability (78%→85% completion) |
| Refactor vague draft | STORY-045 | 88.9% | Domain-driven with GDPR Article 17 compliance |
| **AVERAGE** | — | **93.7%** | **Production-Ready** |

## Key Features

✅ **Analysis Linkage** - Mandatory linkage to discovery, ADRs, impact assessments, OKRs (not vague "per analysis")

✅ **Testable Acceptance Criteria** - All ACs include HTTP codes, error messages, exact behaviors (not "should work")

✅ **Honest Gap-Flagging** - Definition of Ready explicitly flags missing analysis (user research TBD, impact assessment TBD) instead of pretending

✅ **Production-Ready** - Technical design includes NFRs, security, observability, rollout plans, and runbooks

✅ **Domain-Driven Design** - Respects aggregate boundaries, domain models, and architectural constraints (e.g., ADR-007 Prisma-only queries)

✅ **Traceability** - Stories trace ACs to business goals, OKRs, and analysis documents

## Running the Validator

To check if a story meets Definition of Ready:

```bash
cd .claude/skills/enriched-user-stories
python3 scripts/validate_story.py /path/to/STORY-XXX.md
```

Output shows:
- Required sections present/missing
- Acceptance criteria quality (testability, vague language detection)
- Analysis linkage specificity (file paths vs. vague references)
- Overall pass/fail + suggestions for improvement

## Integration with LTI Project

### Story Location
Place generated stories in:
```
/stories/STORY-XXX-[title-slug].md
```

### Linking Stories
Stories reference codebase artifacts:
- Domain models: `backend/src/domain/models/`
- Services: `backend/src/application/services/`
- Prisma schema: `backend/prisma/schema.prisma`
- Architecture decisions: Per CLAUDE.md

### Example Story Sections Referencing LTI
- STORY-042 references Prisma schema for Resume model
- STORY-043 cites tech debt log (TD-42) and ADR-007 (Prisma constraint)
- STORY-045 documents domain boundary (Candidate aggregate root, Resume child)

## Recommendations for Future Iterations

1. **Fix Vague Language Constraint**: Strengthen SKILL.md rule to eliminate "can be" phrases without explicit bounds (affects 2/4 stories)
2. **Use Perfect-Score Templates**: Reference STORY-043 & STORY-044 as examples of gap-awareness and traceability
3. **Optional Enhancements**:
   - Add explicit "Out of Scope" section pattern (STORY-045 exemplifies this well)
   - Include metric tables for NFRs (STORY-045 demonstrates well)
   - Add traceability matrix template (STORY-044 demonstrates well)

## Files in This Skill

```
.claude/skills/enriched-user-stories/
├── SKILL.md                              # Main skill instructions
├── README.md                             # This file
├── references/
│   ├── story-template.md                 # Fillable story template
│   └── analysis-linkage-guide.md         # 6 good/bad linkage examples
├── scripts/
│   └── validate_story.py                 # Story validator
├── evals/
│   └── evals.json                        # 4 test scenarios
└── assets/                               # (empty, for future use)
```

## Contact & Questions

This skill was created May 1, 2026 for the LTI Talent Tracking System project.
For updates or feedback, refer to the skill-creator notes in session history.

---

**Last Updated**: May 1, 2026  
**Skill Version**: 1.0  
**Quality Score**: 93.7% (Iteration 1)  
**Status**: Ready for Production Use
