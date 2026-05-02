---
name: hexagonal-arch
description: Guide for applying Hexagonal Architecture (Ports & Adapters) in this TypeScript/Express/Prisma project. Use when identifying framework coupling, extracting ports, or planning the infrastructure boundary.
---

# Hexagonal Architecture (Ports & Adapters)

## Core Idea

Business logic lives in a **core** that imports nothing from Express, Prisma, or external libs. It communicates through **ports** (interfaces the core defines) implemented by **adapters** (classes the core never imports directly).

```
HTTP request
    │
    ▼
┌─────────────────────────────────┐
│  Adapter: Express controller    │
│  (presentation layer)           │
│           │                     │
│           ▼                     │
│  ┌─── Core (domain + use case)──┤
│  │  Entities, Value Objects     │
│  │  Use Cases / Services        │──── Port (interface, defined in core)
│  └──────────────────────────────┤           │
│                                 │           ▼
│  Adapter: Prisma repository     │  (implements the port)
│  (infrastructure layer)         │
└─────────────────────────────────┘
```

## Current Project Layers

```
backend/src/
├── domain/models/          ← Core: Entities, Value Objects
├── application/services/   ← Core: Use Cases, orchestration
├── presentation/           ← Adapter: Express controllers
│   └── controllers/
├── routes/                 ← Adapter: Express routing
└── infrastructure/         ← Adapter: Prisma repos, external services (create if missing)
```

## Port vs Adapter

| Concept | Lives in | Example |
|---------|----------|---------|
| Port | `domain/` or `application/` | `CandidateRepository` interface |
| Adapter | `infrastructure/` or `presentation/` | `PrismaCandidateRepository` class |

## Identification Prompt

```
Identify the 3 places in backend/src/ where the domain or application layer
imports directly from Express, Prisma, or any external library.
For each: propose the port (interface) to extract and where the adapter would live.
```

## Refactor Pattern

```typescript
// ❌ Service tightly coupled to Prisma
class CandidateService {
  async findById(id: number) {
    return prisma.candidate.findUnique({ where: { id } }); // Prisma leaks into application
  }
}

// ✅ Service depends on port (interface), Prisma hidden in adapter
// Port — lives in domain/
interface CandidateRepository {
  findById(id: number): Promise<Candidate | null>;
}

// Use case — depends on abstraction
class GetCandidateById {
  constructor(private readonly candidates: CandidateRepository) {}

  async execute(id: number): Promise<Candidate> {
    const candidate = await this.candidates.findById(id);
    if (!candidate) throw new Error(`Candidate ${id} not found`);
    return candidate;
  }
}

// Adapter — lives in infrastructure/, imports Prisma freely
class PrismaCandidateRepository implements CandidateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<Candidate | null> {
    const raw = await this.prisma.candidate.findUnique({ where: { id } });
    return raw ? Candidate.fromPersistence(raw) : null;
  }
}
```

## When to Use

- Domain logic is tangled with Express `req`/`res` or Prisma calls
- You want to test use cases without a database (swap Prisma adapter for in-memory fake)
- Multiple adapters for same port (PostgreSQL + test double)

## When NOT to Use

- CRUD endpoints with no real business logic — layers add ceremony, not value
- Team not yet familiar — misapplied ports create complexity without benefit
- Start with controller → service → repository; refactor to hexagonal when domain grows

## Testing Benefit

```typescript
// Test use case with a fake adapter — no DB, no Express
const fakeRepo: CandidateRepository = {
  findById: async (id) => id === 1 ? fakeCandidateFixture : null,
  save: async () => {}
};
const useCase = new GetCandidateById(fakeRepo);
const result = await useCase.execute(1);
```
