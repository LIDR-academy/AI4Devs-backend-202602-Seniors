---
name: ddd-hexagonal-scaffold
description: Translates one OpenSpec spec into the correct Domain/Application/Infrastructure/Presentation files, names the chosen design pattern, and justifies it in one line. Called from spec-flow command.
---

# Skill: ddd-hexagonal-scaffold

## Input

Receives a spec slug (e.g. `get-position-candidates`) and reads:
- `openspec/specs/<slug>/design.md` — API contract, DB changes, test cases
- `openspec/specs/<slug>/tasks.md` — implementation task list

## Output

Creates exactly the files listed in `tasks.md` under `backend/src/`. Reports each file path after creation.

## Layering Rules

### Domain Layer (`backend/src/domain/`)
- Pure TypeScript — no Prisma, no Express imports.
- Entities: extend or match existing models in `domain/models/`.
- Error types: `domain/errors/<Name>Error.ts` — use `enum` or union type.
- Port interfaces: `domain/ports/I<Name>Repository.ts`.

### Application Layer (`backend/src/application/use-cases/`)
- Import port interfaces, not repository implementations.
- Return `Result<T, E>` for operations with typed failure modes.
- No HTTP knowledge (no `Request`, `Response`).

### Infrastructure Layer (`backend/src/infrastructure/repositories/`)
- Implement port interfaces using PrismaClient.
- Import the shared Prisma singleton.
- Handle Prisma-specific errors (P2025 → NOT_FOUND, etc.).

### Presentation Layer (`backend/src/presentation/controllers/`)
- Import use-case, call it, map result to HTTP response.
- Use `Result.ok` to choose 200/201 vs 400/404/500.
- Validate path params (parseInt, isNaN check).

### Routes (`backend/src/routes/`)
- Create an Express `Router`.
- Mount in `backend/src/index.ts` under `/api/v1/`.

## Pattern Application

Read `## Pattern Choice` from the proposal and apply:

| Pattern | What to create |
|---|---|
| Repository + CQRS read model | Port interface + Prisma impl + flat DTO type + use-case (no aggregate) |
| Repository + Result/Either | Port interface + Prisma impl + Result type + error enum + use-case |
| Repository + Unit of Work | Port interface + Prisma impl with `$transaction` + use-case |

## Post-Scaffold Checklist

- [ ] All files in `tasks.md` are created
- [ ] New route registered in `backend/src/index.ts`
- [ ] TypeScript compiles: `cd backend && npx tsc --noEmit`
- [ ] No `any` types introduced (unless bridging legacy code)
