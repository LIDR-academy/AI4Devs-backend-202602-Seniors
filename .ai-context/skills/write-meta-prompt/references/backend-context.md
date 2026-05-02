# Backend-Specific Context Patterns

Context to include in prompts based on task type.

## Architecture Context

### Hexagonal Architecture (Ports & Adapters)
When working with any layer:
```markdown
**Architecture Context**:
- Pattern: Hexagonal Architecture
- Layers:
  - Domain: Pure TypeScript, no framework deps (entities, repository interfaces, services)
  - Application: Use cases / orchestration
  - Infrastructure: Prisma repositories, external adapters
  - Presentation: Express routes, middleware, DTOs
- Rule: Domain layer must NOT import from infrastructure or presentation
```

### DDD Concepts
When working with domain models:
```markdown
**DDD Context**:
- Entity: Has identity (id field), mutable state
- Value Object: No identity, immutable, compared by value
- Repository: Interface in domain, Prisma impl in infrastructure
- Aggregate: Transactional boundary, consistent on save
```

### Layer Dependencies
```markdown
**Dependency Rule**:
- ✅ Presentation → Application/Domain
- ✅ Infrastructure → Domain (implements interfaces)
- ❌ Domain → Infrastructure (forbidden)
- ❌ Domain → Presentation (forbidden)
```

---

## Technology Stack Context

### TypeScript
When working with types:
```markdown
**TypeScript Context**:
- Strict mode enabled
- No `any` unless absolutely necessary
- Prefer `unknown` over `any` for external input
- Use discriminated unions for error types
- Repository interfaces return domain types, not Prisma types
```

### Express
When working with routes:
```markdown
**Express Context**:
- Routes in `src/presentation/[resource]Routes.ts`
- Validation at route handler (before service call)
- Error handling via Express error middleware
- Return consistent JSON: `{ data: ... }` or `{ error: ... }`
- HTTP status codes: 200/201 success, 400 validation, 404 not found, 500 server error
```

### Prisma
When working with DB:
```markdown
**Prisma Context**:
- Schema: `backend/prisma/schema.prisma`
- Client in infrastructure layer only — never in domain
- Use `prisma.$transaction` for multi-table writes
- Map Prisma models to domain entities in repository impl
- Avoid N+1: use `include` or `select` with relations
- Pagination: use cursor-based or offset with `take`/`skip`
```

---

## Testing Context

### Unit Testing
When requesting unit tests:
```markdown
**Testing Context**:
- Framework: Jest + ts-jest
- Location: `src/**/__tests__/[component].test.ts`
- Mocking: `jest.mock()` or manual mocks for Prisma
- Naming: `describe('[Component]') > it('should [behavior] when [condition]')`
- Setup: `beforeEach` to reset mocks
- Target: >80% coverage for services, >75% for repositories
```

### Integration Testing
When requesting API tests:
```markdown
**Integration Testing Context**:
- Framework: Jest + Supertest
- Use test DB (separate from dev DB)
- Seed data in `beforeEach`, clean in `afterEach`
- Test full HTTP request/response cycle
- Verify DB state changes after mutations
```

---

## Performance Context

### Query Optimization
When optimizing DB access:
```markdown
**Performance Context**:
- Avoid N+1: fetch relations in single query with `include`
- Pagination: required for list endpoints (default page size: 10)
- Indexes: add for frequent filter/sort fields in schema
- Select: use `select` to fetch only needed fields
```

### Async
When working with async code:
```markdown
**Async Context**:
- Always `await` Prisma calls
- Use `Promise.all` for independent parallel queries
- Avoid blocking the event loop (no sync file I/O in hot paths)
```

---

## Quality Standards Context

### Error Handling
Always include:
```markdown
**Error Handling Requirements**:
- Validate input at presentation layer (before hitting service)
- Service throws typed errors (custom error classes)
- Express error middleware catches and formats response
- Never expose Prisma error details to client
- Log errors server-side before responding
```

### Code Style
Always include:
```markdown
**Code Style Requirements**:
- Follow project ESLint + Prettier config
- No magic strings/numbers (use constants or enums)
- Keep route handlers thin — delegate to services
- One responsibility per function
```

---

## Context Selection Guide

| Task Type | Include Context |
|-----------|-----------------|
| New Endpoint | Hexagonal, Express, Prisma, Error Handling |
| New Domain Model | DDD, TypeScript |
| New Repository | Hexagonal, Prisma, TypeScript |
| Testing | Unit/Integration Testing, Coverage targets |
| Bug Fix | Relevant tech stack, Error Handling |
| Refactoring | Architecture, Code Style, Performance |

| Layer | Include Context |
|-------|-----------------|
| `presentation/` | Express, Validation, Error Handling |
| `application/` | TypeScript, Hexagonal |
| `infrastructure/` | Prisma, Performance |
| `domain/` | DDD, TypeScript (no framework deps) |

---

**Last Updated**: April 2026
**Project**: AI4Devs Backend
