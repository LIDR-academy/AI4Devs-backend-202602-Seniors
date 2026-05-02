# Prompt Templates

Standard templates for different types of backend prompts.

## Template 1: Development Task

Use when requesting implementation work.

```markdown
# [Role]: [Task Type] - [Feature/Endpoint Name]

**Objective**: [One-line clear goal]

**Context**:
- Current State: [What exists now]
- Problem: [What needs fixing/improving]
- Architecture: [Hexagonal, DDD, Clean Arch layers]
- Dependencies: [Prisma models, services, middleware]

**Requirements**:
1. [Functional requirement 1]
2. [Functional requirement 2]
3. [Technical requirement 1]
4. [Technical requirement 2]

**Constraints**:
- [What not to change]
- [What not to use]
- [Performance/size limits]

**Expected Output**:
- [File 1]: [Description]
- [File 2]: [Description]
- [Tests/Docs requirements]

**Acceptance Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] ESLint/Prettier checks pass
```

---

## Template 2: Testing Task

Use when requesting test creation.

```markdown
# SDET Task: Write Tests for [Component/Endpoint]

**Objective**: Create comprehensive test coverage for [component/endpoint name]

**Context**:
- Component: `[path/to/file]`
- Type: [Controller/Service/Repository/Middleware]
- Current Coverage: [X%]
- Target Coverage: [Y%]

**Test Requirements**:

### Unit Tests
- [ ] Happy path scenarios
- [ ] Error handling (4xx, 5xx)
- [ ] Edge cases
- [ ] Boundary conditions

### Integration Tests (if API endpoint)
- [ ] Valid request returns expected response
- [ ] Invalid input returns 400 with error details
- [ ] Auth/authorization checks (if applicable)
- [ ] DB state changes verified

**Test Data**:
[Provide sample test data or reference existing fixtures]

**Expected Output**:
- `[ComponentName].test.ts` in `src/**/__tests__/`
- All tests using describe/it blocks with clear names
- Mocks for external dependencies (Prisma, external APIs)

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Coverage meets target
- [ ] Tests follow project naming conventions
```

---

## Template 3: Refactoring Task

Use when requesting code refactoring.

```markdown
# Senior Backend Engineer: Refactor [Component/Feature]

**Objective**: Refactor [component] to [improve X/follow Y pattern/fix Z issue]

**Context**:
- Current File(s): `[path/to/files]`
- Current Issues:
  - [Issue 1: e.g., Business logic in route handler]
  - [Issue 2: e.g., Violates Hexagonal Architecture]
  - [Issue 3: e.g., Hard to test, no DI]
- Target Pattern: [Hexagonal/DDD/Clean Architecture]

**Refactoring Requirements**:
1. **Structure**:
   - [Extract X into Y]
   - [Move Z to infrastructure layer]

2. **Architecture**:
   - [Define port interface in domain]
   - [Implement adapter in infrastructure]

3. **DI**:
   - [Wire dependencies via constructor injection]

**Constraints**:
- Maintain existing public API contract
- Preserve existing behavior
- No breaking changes for API consumers
- Maintain test coverage

**Expected Output**:
- Refactored files following Hexagonal Architecture
- Updated tests (if needed)
- Migration guide (if interface changes)

**Acceptance Criteria**:
- [ ] All existing tests still pass
- [ ] New tests added for new structure
- [ ] Follows architecture guidelines
- [ ] TypeScript compiles cleanly
```

---

## Template 4: Bug Fix Task

Use when requesting bug fixes.

```markdown
# Backend Engineer: Fix Bug - [Bug Title]

**Objective**: Fix [specific bug description]

**Bug Details**:
- **Severity**: [Critical/High/Medium/Low]
- **Affected Endpoint/Component**: `[route or file]`
- **HTTP Status Observed**: [e.g., 500]
- **HTTP Status Expected**: [e.g., 400]

**Current Behavior**:
[Describe what currently happens — steps to reproduce or error trace]

**Expected Behavior**:
[Describe what should happen]

**Root Cause Analysis** (if known):
[Explanation of why the bug occurs]

**Fix Requirements**:
1. [Fix specific issue X]
2. [Add validation for Y]
3. [Add test to prevent regression]

**Testing**:
- [ ] Unit test added to reproduce bug
- [ ] Unit test verifies fix
- [ ] Integration test updated if applicable
- [ ] Edge cases covered

**Expected Output**:
- Fixed code in `[file path]`
- Regression test in `[test file path]`

**Acceptance Criteria**:
- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] All tests pass
- [ ] No side effects introduced
```

---

## Template 5: Code Review Task

Use when requesting code review.

```markdown
# Code Reviewer: Review [Feature/PR]

**Objective**: Review [feature/PR] for quality, architecture, and best practices

**Review Scope**:
- **Files Changed**: [Number of files]
- **Lines Changed**: [+XXX/-YYY]
- **Type**: [Feature/Bug Fix/Refactor]

**Review Focus Areas**:

### Architecture
- [ ] Follows Hexagonal Architecture (Ports & Adapters)
- [ ] Proper layer separation (domain / application / infrastructure / presentation)
- [ ] No leaking of Prisma types into domain layer

### Code Quality
- [ ] No code smells (long methods, deep nesting)
- [ ] Proper error handling and HTTP status codes
- [ ] Input validation at presentation boundary

### Testing
- [ ] Unit tests added
- [ ] Integration tests added (if new endpoint)
- [ ] Edge cases covered

### Performance
- [ ] No N+1 queries
- [ ] Paginated list endpoints
- [ ] Async/await used correctly

**Expected Output**:
Review comments using Conventional Comments format:
- `suggestion:` for improvements
- `issue:` for must-fix problems
- `question:` for clarifications
- `praise:` for good work

**Review Outcome**:
- [ ] Approve
- [ ] Approve with minor suggestions
- [ ] Request changes
```

---

## Template 6: New Endpoint Scaffolding

Use when creating new REST endpoints from scratch.

```markdown
# Backend Engineer: Scaffold [Resource] Endpoint

**Objective**: Create complete CRUD/REST endpoint for [resource name]

**Resource Description**:
[Brief description of the resource and its purpose]

**Architecture Components**:

### Domain Layer
- [ ] `[Resource]Entity` - Domain model
- [ ] `I[Resource]Repository` - Repository interface (port)
- [ ] `[Resource]Service` or Use Cases

### Infrastructure Layer
- [ ] `Prisma[Resource]Repository` - Prisma implementation (adapter)
- [ ] Prisma schema updated (if new model)

### Presentation Layer
- [ ] `[resource]Routes.ts` - Express router
- [ ] Input validation middleware

### DI / Wiring
- [ ] Register repository and service in composition root

**Endpoints Required**:
- [HTTP METHOD] /[resource] - [description]
- [HTTP METHOD] /[resource]/:id - [description]

**Expected Output**:
- Complete TypeScript files following project structure
- Prisma migration (if schema changed)
- Unit + integration tests

**Acceptance Criteria**:
- [ ] All endpoints return correct HTTP status codes
- [ ] Input validation rejects invalid requests
- [ ] TypeScript compiles without errors
- [ ] Tests pass
```

---

## Usage Guidelines

| Task Type | Use Template |
|-----------|--------------|
| Implementing new endpoint | Template 1 or 6 |
| Writing tests | Template 2 |
| Improving existing code | Template 3 |
| Fixing a bug | Template 4 |
| Reviewing code | Template 5 |

---

**Last Updated**: April 2026
**Project**: AI4Devs Backend
