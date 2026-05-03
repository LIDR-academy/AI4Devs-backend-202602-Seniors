---
name: typescript-unit-testing
description: |
  Complete unit testing skill for TypeScript/Express projects using Jest and ts-jest.

  ALWAYS use this skill when user needs to:

  **SETUP** - Initialize or configure unit testing:
  - Set up Jest for a new project
  - Configure test infrastructure (jest.config.js)
  - Install testing dependencies (ts-jest, @types/jest)
  - Create mock helpers or test utilities
  - Set up coverage configuration

  **WRITE** - Create or add unit tests:
  - Write, create, add, or generate unit tests
  - Test a service, controller, repository, validator, or middleware
  - Add tests for new code or features
  - Improve test coverage or add missing tests
  - Mock dependencies or set up test fixtures
  - Working on any file ending in .test.ts

  **REVIEW** - Audit or evaluate unit tests:
  - Review existing tests for quality
  - Check test coverage and gaps
  - Audit testing patterns and conventions
  - Evaluate assertion quality

  **RUN** - Execute or analyze test results:
  - Run unit tests
  - Analyze test results or coverage reports
  - Understand test failures or successes
  - Check which tests are passing/failing

  **DEBUG** - Fix failing or broken tests:
  - Fix failing unit tests
  - Debug test errors or exceptions
  - Resolve mock issues or setup problems
  - Troubleshoot test timeouts or flaky tests
  - Diagnose "undefined" or unexpected results

  **OPTIMIZE** - Improve test performance and maintainability:
  - Speed up slow tests
  - Fix open handles preventing clean exit
  - Improve test organization
  - Reduce test execution time
  - Clean up test code

  Keywords: unit test, test, jest, typescript, express, mock, jest.fn, AAA, test coverage, TDD, .test.ts, testing, write test, add test, create test, fix test, debug test, run test, review test, optimize test, test setup, jest config, ts-jest
---

# Unit Testing Skill — Express / TypeScript / ts-jest

This project uses **plain Express** with **ts-jest**. Do NOT use NestJS testing utilities,
`@golevelup/ts-jest`, `createMock`, or `DeepMocked` — they are not installed.
All mocking is done with native `jest.fn()` and `jest.mock()`.

---

## Stack

| Tool | Version |
|---|---|
| Jest | 29.7.0 |
| ts-jest | 29.1.2 |
| TypeScript | 4.9.5 (strict) |
| Test file pattern | `*.test.ts` co-located with source |
| Config file | `backend/jest.config.js` |

---

## Workflow Selection

| User wants | Workflow |
|---|---|
| Set up Jest / configure coverage | → Setup section below |
| Write new tests | → Writing section below |
| Fix failing tests | → Debugging section below |
| Run tests / check coverage | → `npm test` or `npm run test:coverage` |

---

## Setup

### jest.config.js (target state)

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: { branches: 90, functions: 90, lines: 90, statements: 90 }
  }
};
```

### package.json scripts

```json
"test": "jest",
"test:coverage": "jest --coverage"
```

---

## Standard Test Template

```typescript
import { MyService } from './myService';
import { IMyRepository } from '../../domain/repositories/IMyRepository';

describe('MyService', () => {
  let target: MyService;
  let mockRepository: jest.Mocked<IMyRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
    };
    target = new MyService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return entity when found', async () => {
      // Arrange
      const mockEntity = { id: 1, name: 'Test' };
      mockRepository.findById.mockResolvedValue(mockEntity as any);

      // Act
      const result = await target.findById(1);

      // Assert
      expect(result).toEqual(mockEntity);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await target.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

---

## Mocking Patterns

### Mock a repository interface

```typescript
const mockRepo: jest.Mocked<IMyRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
};
```

### Mock a module (e.g. Prisma, validator)

```typescript
jest.mock('../../application/validator', () => ({
  validateCandidateData: jest.fn(),
}));

import { validateCandidateData } from '../../application/validator';
const mockValidate = validateCandidateData as jest.Mock;
```

### Mock Express req/res in controller tests

```typescript
const mockReq = (body = {}, params = {}) => ({ body, params } as any);
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();
```

---

## Naming Conventions

| Item | Convention |
|---|---|
| System under test | `target` |
| Mocked dependencies | `mock` prefix — `mockRepository`, `mockService` |
| Test files | `*.test.ts` co-located with source |
| Describe blocks | `ClassName` → `methodName` |
| Test names | `should [behavior] when [condition]` |

---

## Coverage Requirements

| Category | Required |
|---|---|
| Happy path | Yes |
| Not found / null returns | Yes |
| Validation errors | Yes |
| Database / external errors | Yes |
| Edge cases (empty arrays, 0, undefined) | Yes |

**Target:** 90% branches, functions, lines, statements.

---

## Running Tests

```bash
# All tests
npm test

# Single file
npx jest src/application/services/candidateService.test.ts

# Single test by name
npx jest -t "should return candidate when found"

# With coverage
npm run test:coverage

# Redirect output to temp file (avoids context bloat)
export UT_SESSION=$(date +%s)-$$
npm test > /tmp/ut-${UT_SESSION}.log 2>&1
tail -50 /tmp/ut-${UT_SESSION}.log
```

---

## Failure Resolution Protocol

Fix ONE failing test at a time — never run the full suite repeatedly while debugging.

1. Run only the failing test: `npx jest -t "test name"`
2. Read the error — check mock setup, missing `mockResolvedValue`, wrong assertion
3. Fix, re-run same test 2-3 times to confirm stable
4. Move to next failing test
5. Run full suite only after all individual tests pass

---

## Anti-Patterns to Avoid

| Don't | Do instead |
|---|---|
| `import { createMock } from '@golevelup/ts-jest'` | Use `jest.fn()` directly |
| `import { Test } from '@nestjs/testing'` | Instantiate class directly with mocked deps |
| Assert only `toBeDefined()` | Assert specific values with `toEqual()` |
| Real Prisma client in unit tests | Mock the repository interface |
| `.spec.ts` extension | Use `.test.ts` — project convention |
| `console.log` in tests | Use assertions only |

---

## What NOT to Test

- Interfaces (no runtime behavior)
- Enums and constants
- Plain data types / DTOs with no logic
- Prisma schema types
