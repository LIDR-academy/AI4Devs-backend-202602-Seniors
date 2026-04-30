# Architecture

## Overview

LTI is a Recruitment Management System. The backend follows a **Layered Architecture** that separates HTTP concerns, business logic, validation, and persistence into distinct folders with clear responsibilities.

```
Presentation → Application → Domain ← Infrastructure
```

> **Honest assessment**: The `application/` and `presentation/` layers follow this model correctly. Domain model files (`domain/models/`) currently violate the intended architecture by importing Prisma directly — this is an Active Record pattern embedded where pure domain entities should be. Documentation below reflects the **intended** architecture using the files that correctly implement it.

---

## Layer Diagram

```
┌──────────────────────────────────────────────────┐
│                Presentation Layer                 │
│   src/routes/          → route registration       │
│   src/presentation/controllers/ → HTTP handlers   │
│   Reads req, writes res, maps status codes        │
└─────────────────────┬────────────────────────────┘
                      │ calls
┌─────────────────────▼────────────────────────────┐
│                Application Layer                  │
│   src/application/services/ → orchestration       │
│   src/application/validator.ts → input rules      │
│   Coordinates domain operations, handles errors   │
└─────────────────────┬────────────────────────────┘
                      │ uses
┌─────────────────────▼────────────────────────────┐
│                  Domain Layer                     │
│   src/domain/models/ → business entity shapes     │
│   Pure TypeScript — no framework dependencies     │
└──────────────────────────────────────────────────┘
                      ▲
                      │ implements (target state)
┌──────────────────────────────────────────────────┐
│               Infrastructure Layer                │
│   Prisma ORM, Multer, file system                 │
│   (currently co-located in domain models)         │
└──────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Presentation Layer
**Files**: `backend/src/routes/`, `backend/src/presentation/controllers/`

- Parses HTTP input (path params, request body)
- Validates input *shape* (e.g., `isNaN(id)`) — not business rules
- Calls one service function per handler
- Returns HTTP response with correct status code
- No Prisma, no business logic

**Canonical example**: `src/presentation/controllers/candidateController.ts`

### Application Layer
**Files**: `backend/src/application/services/`, `backend/src/application/validator.ts`

- Validates business rules before any persistence
- Orchestrates multi-step operations (save candidate → save educations → save CV)
- Handles infrastructure-level errors (e.g., Prisma error code `P2002` for duplicate email)
- No HTTP knowledge (no `req`, no `res`)

**Canonical examples**: `src/application/validator.ts`, `src/application/services/candidateService.ts`

### Domain Layer
**Files**: `backend/src/domain/models/`

- Defines the core business entities: `Candidate`, `Position`, `Application`, `Interview`, etc.
- Should be pure TypeScript — no imports from `@prisma/client`, `express`, or `multer`
- Describes what data each concept holds, not how it is stored

### Infrastructure Layer
**Target**: A dedicated `src/infrastructure/` directory with Prisma repository implementations.

Currently the Prisma ORM calls live inside domain model classes (Active Record pattern). The intended direction is to extract them into infrastructure adapters that implement repository interfaces defined in the domain layer.

---

## Dependency Rules

| Layer | May import from | Must NOT import from |
|-------|-----------------|----------------------|
| Presentation | Application, Domain | Prisma, Multer, file system |
| Application | Domain | Presentation, Express |
| Domain | Nothing (pure TS) | `@prisma/client`, Express, Multer |
| Infrastructure | Domain | Presentation, Application |

---

## Tech Stack

| Concern | Technology |
|---------|------------|
| HTTP server | Express 4 |
| Language | TypeScript 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| File upload | Multer |
| Frontend | React (JS + TS mix) |
| Package management | npm |
| Local dev DB | Docker Compose |

---

## File Reference by Layer

| Layer | File |
|-------|------|
| Presentation | `src/routes/candidateRoutes.ts` |
| Presentation | `src/presentation/controllers/candidateController.ts` |
| Application | `src/application/services/candidateService.ts` |
| Application | `src/application/services/fileUploadService.ts` |
| Application | `src/application/validator.ts` |
| Domain | `src/domain/models/Candidate.ts` (entity shape — not the Prisma calls) |
| Infrastructure | Embedded in domain models (Active Record — pending extraction) |
| Entry point | `src/index.ts` |
