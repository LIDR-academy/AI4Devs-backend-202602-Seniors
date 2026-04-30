---
name: write-meta-prompt
description: Expert in transforming vague ideas into professional, structured prompts optimized for TypeScript/Express/Prisma Backend Engineering. Use this skill when you need to create clear, actionable prompts for AI agents or team members.
version: 1.0.0
usage: "skill: write-meta-prompt [task description]"
---

# Prompt Writer Skill

## Description
Transforms vague, high-level, or unstructured requests into precise, comprehensive, and actionable prompts for specialized AI agents or engineering teams.

## Usage
```bash
skill: write-meta-prompt [your vague task description]
```

**Example**:
```bash
skill: write-meta-prompt "I need to fix the candidates endpoint, it's slow"
```

## When to Use

Use this skill when you need to:
1. **Clarify Intent**: Transform vague requirements into specific technical goals
2. **Structure Requests**: Organize information into actionable sections
3. **Add Context**: Include necessary TypeScript/Node.js/Prisma technical context
4. **Target Audience**: Tailor prompts for specific roles (Backend Dev, SDET, Reviewer)

## Capabilities

### 1. Intent Clarification
- Identifies core technical goals
- Extracts implicit requirements
- Determines scope (Endpoint, Service, Module, Project)

### 2. Prompt Structuring
- **Role Definition**: Who should execute the task
- **Context**: Necessary background information
- **Task**: Specific action items
- **Constraints**: What NOT to do
- **Output Format**: Expected deliverable format

### 3. Backend-Specific Enhancement
Automatically adds relevant context for:
- **Architecture**: Hexagonal (Ports & Adapters), DDD, Clean Architecture
- **Tech Stack**: TypeScript, Express, Prisma, Jest
- **Testing**: Jest, Supertest, integration vs unit tests
- **Performance**: Query optimization, N+1, connection pooling

## Reference Files

- [prompt-templates.md](references/prompt-templates.md) - Standard prompt templates
- [backend-context.md](references/backend-context.md) - Backend-specific context patterns
- [examples.md](references/examples.md) - Before/after prompt examples

## Output Format

The skill generates a structured prompt ready to use:

```markdown
# [Role Name] Task

**Objective**: [Clear statement of the goal]

**Context**:
[Relevant background information, current state, dependencies]

**Requirements**:
1. [Requirement 1]
2. [Requirement 2]
...

**Constraints**:
- [Constraint 1]
- [Constraint 2]

**Expected Output**:
[Description of desired artifact]
```

## Example Workflow

**User Input (Vague)**:
```
"The candidates list endpoint is slow and messy. Also add tests."
```

**Skill Output (Structured)**:
```markdown
# Task 1: Senior Backend Engineer - Refactor Candidates List Endpoint

**Objective**: Refactor GET /candidates to improve performance and code quality.

**Context**:
- Current implementation: `backend/src/presentation/candidateRoutes.ts`
- Issues: Slow query, poor separation of concerns
- Architecture: Must follow Hexagonal Architecture (Ports & Adapters)

**Requirements**:
1. Extract business logic from route handler into `CandidateService`
2. Optimize Prisma query: avoid N+1, add pagination
3. Define repository interface in domain layer
4. Implement repository in infrastructure layer using Prisma

**Constraints**:
- Maintain existing API contract (same response shape)
- No new external libraries without justification
- Preserve existing error handling behavior

**Expected Output**:
- Refactored TypeScript files following project structure
- Updated Prisma queries with proper relations
- Performance improvements documented

---

# Task 2: Senior SDET - Add Comprehensive Tests

**Objective**: Add test coverage for refactored Candidates endpoint.

**Requirements**:
1. Create `candidateService.test.ts` covering all service methods
2. Create `candidateRepository.test.ts` covering DB interactions
3. Add integration test for GET /candidates

**Expected Output**:
- Test files in `backend/src/**/__tests__/`
- All tests passing with >80% coverage
```

## Best Practices

1. **Be Specific**: Transform "make it better" into "reduce query time by paginating at DB level"
2. **Add Context**: Include relevant architecture patterns and constraints
3. **Target Audience**: Identify who will execute (Dev, SDET, Reviewer)
4. **Break Down**: Complex tasks should be split into multiple focused prompts
5. **Include Examples**: When possible, provide code examples or patterns to follow

## Common Transformations

| Vague Request | Structured Prompt |
|---------------|-------------------|
| "Fix the bug" | "Fix 500 error in POST /candidates when CV file is missing..." |
| "Make it faster" | "Optimize Prisma query in CandidateRepository.findAll() by adding cursor pagination..." |
| "Add tests" | "Create unit tests for CandidateService.addCandidate() covering happy path, validation errors, DB errors..." |
| "Refactor this" | "Refactor candidateRoutes.ts to follow Hexagonal Architecture: extract CandidateService, CandidateRepository interface..." |

## Related Skills

- **solid-cupid**: Audit SOLID/DRY/CUPID violations
- **hexagonal-arch**: Apply Hexagonal Architecture patterns
- **ddd-design**: Apply Domain-Driven Design
- **design-patterns**: Identify and apply design patterns

---

**Last Updated**: April 2026
**Project**: AI4Devs Backend
