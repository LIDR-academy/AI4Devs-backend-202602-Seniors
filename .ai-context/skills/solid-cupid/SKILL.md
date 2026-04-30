---
name: solid-cupid
description: Guide for auditing and applying SOLID, DRY, and CUPID principles in this TypeScript project. Use when reviewing domain models, services, or controllers for design violations that make AI-assisted modification harder.
---

# SOLID, DRY & CUPID

## Why AI Makes These More Important

A codebase that violates these principles confuses the agent the same way it confuses a new engineer. Poor separation → unintended side effects in generated diffs. Anemic models → logic scattered → agent duplicates it. God services → blast radius on every edit.

## SOLID

| Principle | Key Test | Common Violation in This Project |
|-----------|----------|----------------------------------|
| **S**RP — one reason to change | "Who asks for this change?" | `candidateService.ts` handles validation + persistence + email |
| **O**CP — open to extend, closed to modify | Adding behavior without touching existing code | `switch` blocks that grow with new types |
| **L**SP — subtypes replace supertypes safely | Substitution doesn't break callers | Subclass that throws on inherited method |
| **I**SP — small, focused interfaces | Interface has methods callers don't use | Fat `CandidateRepository` with 15 methods |
| **D**IP — depend on abstractions | Imports point inward, never outward | Service `import { PrismaClient }` directly |

## CUPID (Dan North, 2022)

Complements SOLID — focus on the experience of working with the code:

| Letter | Meaning | What to Look For |
|--------|---------|------------------|
| **C**omposable | Combines with others, minimal coupling | Functions/classes usable in isolation |
| **U**nix | Does one thing well | Controllers that also validate and log |
| **P**redictable | Same input = same output, observable | Functions with hidden state or side effects |
| **I**diomatic | Reads as natural TypeScript | Patterns from Java/Java-style OOP ported verbatim |
| **D**omain-based | Structure mirrors domain, not tech artifacts | `controllers/` folder instead of `candidate-management/` |

## DRY — Key Distinction

Duplication of **code** vs duplication of **knowledge**. Two identical-looking validation functions for `Candidate` and `Employee` that represent *different business rules* → **keep separate**. Premature unification is worse than duplication.

## Refactor Example (SRP + DIP)

```typescript
// ❌ Violates SRP and DIP
class CandidateService {
  async register(data: unknown) {
    // Validation (one reason to change)
    if (!data || typeof data !== 'object') throw new Error('Invalid');
    
    // Persistence via Prisma directly (another reason to change, wrong direction)
    const saved = await prisma.candidate.create({ data: data as any });
    
    // Email notification (third reason to change)
    await sendgrid.send({ to: saved.email, subject: 'Welcome' });
    
    return saved;
  }
}

// ✅ SRP + DIP: each class has one reason to change, depends on abstractions
class RegisterCandidate {
  constructor(
    private readonly candidates: CandidateRepository,  // abstraction
    private readonly notifications: NotificationService // abstraction
  ) {}

  async execute(input: RegisterCandidateInput): Promise<Candidate> {
    const candidate = Candidate.create(input.firstName, input.lastName, input.email);
    await this.candidates.save(candidate);
    await this.notifications.sendWelcome(candidate.email.value);
    return candidate;
  }
}
```

## Audit Prompt

```
Review these files applying SOLID and CUPID:
<paste 2-3 files>

For each violation:
1. Name the principle violated
2. Quote the exact lines
3. Propose the minimum refactor

Prioritize violations that would cause an AI agent to produce incorrect diffs
when modifying this code (e.g. unclear boundaries, hidden coupling, anemic models).
```

## Project Files Most Likely to Violate

- `backend/src/application/services/candidateService.ts` — SRP, DIP
- `backend/src/presentation/controllers/candidateController.ts` — SRP (validation + HTTP + orchestration)
- `backend/src/domain/models/*.ts` — anemic models (D of CUPID, DDD alignment)
