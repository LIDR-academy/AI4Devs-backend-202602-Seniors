---
name: design-patterns
description: Guide for identifying and applying design patterns in this TypeScript/Express/Prisma project. Use when spotting a repeated problem that a known pattern solves, or when reviewing code that reinvents one without naming it.
---

# Design Patterns

## Rule: Identify First, Implement Second

Knowing *when* a pattern fits beats knowing *how* to implement it. Many are already primitives in TypeScript (first-class functions = Strategy, EventEmitter = Observer).

## Patterns with Active Value in This Stack

### Factory — when creation logic is conditional

```typescript
interface StorageProvider {
  upload(file: Buffer, name: string): Promise<string>;
}

class LocalStorageProvider implements StorageProvider { /* ... */ }
class S3StorageProvider implements StorageProvider { /* ... */ }

class StorageProviderFactory {
  static create(env: string): StorageProvider {
    if (env === 'production') return new S3StorageProvider();
    return new LocalStorageProvider();
  }
}
```

**Use when**: the concrete type depends on config or environment (payment provider, storage backend, notification channel).

### Strategy — interchangeable algorithms

```typescript
type SortStrategy = (candidates: Candidate[]) => Candidate[];

const byName: SortStrategy = (cs) => [...cs].sort((a, b) => a.lastName.localeCompare(b.lastName));
const byDate: SortStrategy = (cs) => [...cs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

// No class hierarchy needed — functions are strategies in TypeScript
function getCandidates(sort: SortStrategy): Candidate[] {
  return sort(allCandidates);
}
```

### Observer / Domain Events — decouple side effects

```typescript
// Use Node.js EventEmitter or a simple in-process event bus
import { EventEmitter } from 'events';

const domainBus = new EventEmitter();

domainBus.on('ApplicationCreated', async (event: ApplicationCreated) => {
  await emailService.notifyRecruiter(event.positionId);
});

// In use case:
const event = candidate.apply(positionId);
domainBus.emit('ApplicationCreated', event);
```

### Repository — (covered in ddd-design skill)

Abstracts persistence. Works with full aggregates, returns domain objects — never raw Prisma types.

### Decorator / Middleware — add behavior without modifying class

```typescript
// Express middleware as decorator pattern
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.post('/candidates', requireAuth, candidateController.create);
```

## Patterns to Avoid

### Singleton — anti-pattern in most backend contexts

**Problem**: hidden global state, tests share state between runs, blocks horizontal scaling.

**Instead**: use a composition root or dependency injection container:

```typescript
// ❌ Singleton
class DatabaseConnection {
  private static instance: PrismaClient;
  static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) DatabaseConnection.instance = new PrismaClient();
    return DatabaseConnection.instance;
  }
}

// ✅ Inject the single instance explicitly
const prisma = new PrismaClient();
const candidateRepo = new PrismaCandidateRepository(prisma);
const registerCandidate = new RegisterCandidate(candidateRepo, emailService);
```

## Audit Prompt

```
Review the last 5 commits in this project:
1. Is there code that reinvents a known pattern without naming it?
2. Is there a pattern applied where it adds no value?
3. Where would a Factory, Strategy, or Observer reduce coupling?
```

## Pattern Recognition Cheatsheet

| Smell | Pattern to Consider |
|-------|-------------------|
| Big `if/switch` on type to create objects | Factory |
| Same algorithm with slight variation in multiple places | Strategy |
| Side effects triggered after domain action | Observer / Domain Events |
| Test requires complex DB setup for simple logic | Repository (extract interface) |
| Cross-cutting concerns (auth, logging, timing) | Decorator / Middleware |
| Global state shared across tests | Remove Singleton, inject instead |

## Project Paths

- Composition root / server setup: `backend/src/index.ts`
- Services (likely candidates for Strategy): `backend/src/application/services/`
- File upload (Factory candidate): `backend/src/application/services/fileUploadService.ts`
