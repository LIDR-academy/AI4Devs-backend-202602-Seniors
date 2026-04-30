---
name: ddd-design
description: Guide for applying Domain-Driven Design in this TypeScript/Prisma project. Use when designing or auditing domain models, creating Value Objects, Aggregates, Repositories, or Domain Events.
---

# Domain-Driven Design

## Why It Matters with AI

Ubiquitous language = better prompts. When code, specs, and Claude Code share the same domain terms, the copilot stops inventing names and stays in bounded context.

## Key Building Blocks

### Value Objects — immutable, self-validating, no identity

```typescript
class Email {
  private constructor(public readonly value: string) {}

  static of(raw: string): Email {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw))
      throw new Error(`Invalid email: ${raw}`);
    return new Email(raw.toLowerCase());
  }
}
```

### Entities — identity persists through state changes

```typescript
class Candidate {
  private constructor(
    public readonly id: number,
    private firstName: string,
    private lastName: string,
    private email: Email,
    private applications: Application[] = []
  ) {}

  static create(id: number, firstName: string, lastName: string, email: string): Candidate {
    return new Candidate(id, firstName, lastName, Email.of(email));
  }

  apply(positionId: number): ApplicationCreated {
    if (this.applications.some(a => a.positionId === positionId))
      throw new Error('Already applied to this position');
    const app = Application.create(positionId);
    this.applications.push(app);
    return new ApplicationCreated(this.id, positionId);
  }
}
```

### Aggregate Root — single entry point, enforces invariants

The `Candidate` above IS the aggregate root. Only interact with `Application` through `Candidate`.

### Repository Interface — abstracts persistence, works with full aggregates

```typescript
interface CandidateRepository {
  save(candidate: Candidate): Promise<void>;
  findById(id: number): Promise<Candidate | null>;
  findByEmail(email: Email): Promise<Candidate | null>;
}

// Prisma implementation lives in infrastructure, not domain
class PrismaCandidateRepository implements CandidateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(candidate: Candidate): Promise<void> {
    await this.prisma.candidate.upsert({ /* ... */ });
  }

  async findById(id: number): Promise<Candidate | null> {
    const raw = await this.prisma.candidate.findUnique({ where: { id }, include: { applications: true } });
    if (!raw) return null;
    return Candidate.fromPersistence(raw);
  }
}
```

### Domain Events — facts that happened, decouple side effects

```typescript
class ApplicationCreated {
  readonly occurredAt = new Date();
  constructor(
    public readonly candidateId: number,
    public readonly positionId: number
  ) {}
}
```

## Project Domain Map

| Aggregate Root | Entities inside | Key Invariants |
|---------------|-----------------|----------------|
| `Candidate` | `Education`, `WorkExperience`, `Resume` | Email unique, valid format |
| `Application` | `Interview` | One application per position per candidate |
| `Position` | `InterviewFlow`, `InterviewStep` | Flow must have at least one step |
| `Company` | `Employee` | — |

## Audit Prompt

```
Analyze backend/src/domain/models/ and tell me:
1. Which entities have business logic inside (rich models)?
2. Which are anemic (only data, logic in services)?
3. For anemic ones: what behavior should move into the entity?
4. Where are invariants validated outside the aggregate root?
```

## Anti-Patterns to Avoid

- **Anemic domain model** — entities are just data bags, all logic in `*Service.ts`
- **Fat service** — `candidateService.ts` knows everything; entity knows nothing
- **Repository returning raw Prisma types** — leaks infrastructure into domain

## Project Paths

- Domain models: `backend/src/domain/models/`
- Application services: `backend/src/application/services/`
- Prisma schema: `backend/prisma/schema.prisma`
