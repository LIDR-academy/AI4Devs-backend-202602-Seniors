# CLAUDE.md — LTI Backend Project

## Project Overview

LTI is a recruitment platform backend built with **Node.js / TypeScript / Express / Prisma / PostgreSQL**.
The API runs on port **3010**. The frontend (separate repo) runs on port 3000.

---

## Forward-Only Development Rule

**Do not refactor or touch existing legacy code unless strictly necessary to implement the requested feature.**

The codebase has known technical debt (documented in `ai-specs/specs/backend-standards.md`). New features must be built in the target architecture without cleaning up legacy patterns alongside them. If a legacy file must be modified to wire up a new feature, make the minimum viable change only.

---

## Architecture — Target Layer Order

Every new endpoint must follow this chain, top to bottom:

```
api-spec.yaml              ← update contract first
    ↓
src/routes/                ← register route, call controller
    ↓
src/presentation/controllers/   ← parse HTTP, call service, return response
    ↓
src/application/services/       ← orchestrate business logic, call repository
    ↓
src/domain/repositories/        ← interface (ICandidateRepository, etc.)
    ↓
src/infrastructure/             ← Prisma implementation of repository interface
```

Never skip layers. Never call Prisma directly from a controller or service.

---

## Critical: Dead Code Warning — `req.prisma`

`src/index.ts` injects a `PrismaClient` singleton onto `req.prisma` via middleware. This is **dead code** — no existing handler uses it. **Do not build new features using `req.prisma`.** New code must use constructor-injected repositories following the target architecture above.

---

## API Contract Rule

`backend/api-spec.yaml` is the **authoritative API contract** (OpenAPI 3.0). Every new endpoint must be added to this file before or alongside implementation. Never define request/response shapes only in code.

---

## Coding Rules

- All code, comments, error messages, and logs must be in **English**
- No `any` types — use `unknown` or explicit types
- Custom error classes for domain errors (e.g. `NotFoundError`, `ValidationError`)
- Pass errors to Express `next(error)` — never `res.status(500)` inline in controllers
- Use `async/await` throughout — no `.then()` chains
- No `console.log` in new code — use the logger once `src/infrastructure/logger.ts` exists

---

## Standard Response Envelope

All new endpoints must return this shape:

```typescript
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "message": "...", "code": "ERROR_CODE" } }
```

---

## Testing Requirements

- Every new file must have a co-located `.test.ts` file
- Follow AAA pattern (Arrange / Act / Assert) in all tests
- Mock all external dependencies — never hit real database in unit tests
- 90% coverage target for branches, functions, lines, statements
- Use `jest.fn()` for mocks — this project uses plain `ts-jest`, not NestJS or `@golevelup/ts-jest`
- Name the system under test `target` in test files
- Run `npm test` before considering any feature complete

---

## Tech Stack Quick Reference

| Concern | Tool |
|---|---|
| Runtime | Node.js |
| Language | TypeScript 4.9.5 (strict mode) |
| Framework | Express 4.19.2 |
| ORM | Prisma 5.13.0 |
| Database | PostgreSQL (Docker, port 5432) |
| Testing | Jest 29.7.0 + ts-jest |
| Validation | `src/application/validator.ts` |

## Dev Scripts

```bash
npm run dev           # hot-reload dev server
npm test              # run tests
npm run build         # compile TypeScript
npx prisma migrate dev --name <name>   # create migration
npx prisma db seed                     # seed database
```

---

## Known Technical Debt (do not replicate)

Full details in `ai-specs/specs/backend-standards.md`. Summary of patterns to **never copy** in new code:

- `const prisma = new PrismaClient()` at module level inside domain models
- Inline route handlers in `src/routes/` that bypass the controller layer
- Spanish-language comments, error messages, or variable names
- Direct Prisma calls inside service functions (use repository interface instead)
