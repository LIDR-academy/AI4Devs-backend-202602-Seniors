# Task Writer Skill

**Purpose**: Decompose enriched user stories into discipline-specific engineering tasks with full coverage, explicit traceability, and clear implementation guidance.

**Status**: Production-Ready (Iteration 1)

## Quick Start

### Basic Usage

```
Create enriched tasks for this user story:
Input: /stories/STORY-042-multiple-resume-uploads.md
Project context: /CLAUDE.md
Validation level: deep
Output format: separate files per discipline
```

### Expected Output

- 9 discipline-specific markdown files (Backend, Frontend, Database, API, QA, DevOps, Security, Observability, Documentation)
- Coverage matrix proving every AC is covered by at least one task
- Task dependency graph showing correct ordering (DB → Backend → Frontend → QA)
- Validation report (basic or deep, configurable)

## When to Use This Skill

✅ **Use this skill when you need to:**
- Break an enriched user story into actionable engineering tasks
- Assign work across Frontend, Backend, Database, QA, DevOps, Security teams
- Validate that a story's decomposition is technically complete (100% AC coverage)
- Establish correct task ordering and dependencies (DB before Backend, Backend before Frontend)
- Create a detailed implementation roadmap with explicit traceability to business goals

❌ **Don't use this skill for:**
- Backlog management or sprint planning rituals (this skill generates tasks, not schedules)
- Effort estimation (skill doesn't estimate task duration)
- Team capacity planning (skill doesn't consider team size or availability)

## Skill Contents

- **SKILL.md** - Complete skill instructions (900+ lines)
- **README.md** - This file (quick reference)
- **references/**
  - `task-template.md` - Copy/paste task template
  - `discipline-reference.md` - Discipline-specific questions each task must answer
  - `coverage-matrix-template.md` - Matrix template for proving AC coverage
- **scripts/**
  - `validate_tasks.py` - Validator checking tasks against Definition of Complete
  - `generate_coverage_matrix.py` - Auto-generate coverage matrix from task set
- **evals/evals.json** - Test scenarios for skill evaluation

## Evaluation Results

| Scenario | Expected Quality | Key Features |
|----------|------------------|--------------|
| Simple story (1-2 ACs, 1-2 systems) | 4-6 tasks, 100% coverage | Clear scoping, minimal overhead |
| Complex story (8+ ACs, 5+ systems) | 15-20 tasks, 100% coverage | Full discipline coverage, correct ordering |
| Deep validation requested | Explicit quality checks | Vague language detection, dependency validation |

## Integration with Enriched User Stories

**Input**: Enriched user story (output from enriched-user-stories skill)
- Story includes: Narrative, Acceptance Criteria, Technical Design, Project Analysis Linkage, DoR/DoD

**Output**: Enriched task set (ready for sprint execution)
- Each task includes: Purpose, Scope, Where, Why, How, Inputs/Outputs, Dependencies, ACs, Tests, NFRs, Risks, DoD

**Workflow**: Story → Tasks → Sprint Planning → Execution

## Key Features

✅ **Full Discipline Coverage** - Generates tasks for Backend, Frontend, Database, API, QA, DevOps, Security, Observability, Documentation (9+ disciplines)

✅ **Mandatory Task Structure** - Every task follows same template (15+ required sections: purpose, scope, where, why, how, inputs/outputs, dependencies, ACs, tests, NFRs, risks, DoD)

✅ **100% AC Coverage** - Coverage matrix proves every acceptance criterion mapped to at least one task; no functional gaps

✅ **Correct Task Ordering** - Dependency graph enforces strict order (Database → Backend → Frontend → QA) with parallel tracks (DevOps, Security, Observability, Documentation)

✅ **Explicit Traceability** - Every task traces back to parent story and project analysis (discovery research, ADRs, business case, OKRs, tech debt logs)

✅ **Configurable Validation** - Basic validation (all sections present) or deep validation (vague language detection, dependency validation, coverage checks)

✅ **Per-Discipline Output** - Separate markdown file per discipline, easier for team assignment and parallel execution

✅ **Domain-Driven Design** - Tasks respect architectural constraints (e.g., ADR-007 Prisma-only queries for LTI project)

## Running the Validator

To check if a task set meets quality standards:

```bash
cd .claude/skills/task-writer
python3 scripts/validate_tasks.py /path/to/TASK-STORY-XXX-*.md --level deep
```

Output shows:
- All required sections present/missing per task
- Vague language detection (e.g., "should work", "properly")
- Dependency ordering validation (DB before Backend, etc.)
- Coverage matrix validation (every AC mapped)
- Overall pass/fail + suggestions

## Skill Reference

For detailed instructions on generating enriched tasks:
- **SKILL.md**: Main skill instructions (900+ lines, all task categories, discipline-specific rules, worked example)
- **references/task-template.md**: Copy/paste template with all required sections
- **references/discipline-reference.md**: Discipline-specific questions each task must answer
- **references/coverage-matrix-template.md**: Coverage matrix template format

## Integration with LTI Project

### Task Output Location
Place generated tasks in:
```
/tasks/TASK-STORY-XXX-[DISCIPLINE].md
/tasks/TASK-STORY-XXX-COVERAGE.md
```

### Linking Tasks to Code
Tasks reference codebase artifacts (same style as enriched stories):
```
Backend service: backend/src/application/services/resumeService.ts
Controller: backend/src/presentation/controllers/resumeController.ts
Domain model: backend/src/domain/models/Resume.ts
Database: backend/prisma/schema.prisma, migrations/
Frontend: frontend/src/components/ResumeUpload.tsx
```

### Example Tasks
- TASK-STORY-042-DATABASE-001: Create Resume table (Prisma schema, migration)
- TASK-STORY-042-BACKEND-001: Implement POST /resumes endpoint (validation, service layer)
- TASK-STORY-042-FRONTEND-001: Build ResumeUpload component (form, validation, error handling)
- TASK-STORY-042-QA-001: Test strategy for resume upload (unit, integration, E2E tests)

---

**Last Updated**: May 1, 2026  
**Skill Status**: Production-Ready (Iteration 1)  
**Version**: 1.0
