## Context

The LTI backend currently exposes only two endpoints: `POST /candidates` and `GET /candidates/:id`. There is no way to query candidates grouped by position. The frontend needs this to render a recruitment pipeline view for a given job opening.

The existing codebase has known technical debt (Prisma instantiated directly inside domain models, no repository layer, no infrastructure directory). New code must follow the **target architecture** without touching legacy files.

## Goals / Non-Goals

**Goals:**

- Introduce `GET /positions/:id/candidates` returning candidate name, current interview step, and average score per application.
- Establish the first working instance of the full target architecture stack: repository interface → infrastructure Prisma implementation → service → controller → route.
- Keep `backend/api-spec.yaml` as the authoritative API contract.
- Achieve ≥ 90% unit-test coverage on all new files.

**Non-Goals:**

- Refactoring existing domain models or services.
- Pagination or filtering (out of scope for this story).
- Authentication / authorisation.
- Any change to the existing candidate endpoints.

## Decisions

### 1. Repository interface lives in `src/domain/repositories/`

**Decision**: Create `IPositionRepository` in `src/domain/repositories/IPositionRepository.ts`.

**Rationale**: The target architecture separates domain contracts from infrastructure. The service depends only on the interface; the Prisma implementation is injected at runtime (or mocked in tests). This satisfies DIP and makes unit testing trivial.

**Alternative considered**: Calling Prisma directly from the service (current legacy pattern). Rejected because it contradicts the target architecture and makes unit tests require a live database.

---

### 2. Single Prisma query with `include` (no N+1)

**Decision**: The repository fetches all applications for the position in one query, including `candidate` and `interviews` via Prisma `include`.

```typescript
prisma.application.findMany({
  where: { positionId: id },
  include: {
    candidate: { select: { id: true, firstName: true, lastName: true } },
    interviews: { select: { score: true } },
  },
});
```

**Rationale**: Avoids N+1 queries. At recruitment scale (tens to low hundreds of candidates per position) a single JOIN is sufficient and simpler.

**Alternative considered**: Two separate queries (fetch applications, then fetch each candidate). Rejected due to N+1 performance and added complexity.

---

### 3. Average score computed in the service layer, not in SQL

**Decision**: The service receives raw `Interview[]` rows from the repository and computes `averageScore` in TypeScript.

**Rationale**: Business logic (what counts as a valid score, how to handle nulls) belongs in the application layer, not the data layer. This makes the computation easy to unit-test without a database.

**Formula**: Mean of non-null `score` values. Returns `null` if no scored interviews exist.

---

### 4. Position existence check is separate from the applications query

**Decision**: The repository exposes two methods:
- `existsById(id: number): Promise<boolean>` — lightweight `findUnique` on `Position`.
- `findCandidatesByPositionId(id: number): Promise<ApplicationWithCandidate[]>` — the enriched query.

**Rationale**: Separating existence check from data fetch lets the service return a clean `NotFoundError` for missing positions versus an empty array for positions with no applicants — two semantically different states.

---

### 5. `NotFoundError` custom error class

**Decision**: Create `src/domain/errors/NotFoundError.ts` if it does not already exist.

**Rationale**: The global error middleware in `src/index.ts` must distinguish `NotFoundError` (→ 404) from generic errors (→ 500). Using a typed custom class is cleaner than string-matching error messages.

---

### 6. Constructor-injected repository (no `req.prisma`, no module-level `new PrismaClient()`)

**Decision**: `PositionRepository` receives a `PrismaClient` instance via its constructor. `PositionService` receives an `IPositionRepository` via its constructor. The controller instantiates them.

```typescript
// controller instantiation
const prisma = new PrismaClient();
const repo = new PositionRepository(prisma);
const service = new PositionService(repo);
```

**Rationale**: Constructor injection enables full mock substitution in unit tests without module-level patching. Avoids the known dead-code anti-pattern (`req.prisma`) and the legacy anti-pattern (`const prisma = new PrismaClient()` at module level in domain models).

## Repository Interface Contract

```typescript
// src/domain/repositories/IPositionRepository.ts

export interface ApplicationWithCandidate {
  candidateId: number;
  firstName: string;
  lastName: string;
  currentInterviewStep: number;
  interviews: Array<{ score: number | null }>;
}

export interface IPositionRepository {
  existsById(id: number): Promise<boolean>;
  findCandidatesByPositionId(id: number): Promise<ApplicationWithCandidate[]>;
}
```

## Response DTO

```typescript
export interface PositionCandidateDto {
  candidateId: number;
  fullName: string;
  currentInterviewStep: number;
  averageScore: number | null;
}
```

## api-spec.yaml Addition

```yaml
  /positions/{id}/candidates:
    get:
      summary: Get candidates in process for a position
      description: Returns all applications for the given position with candidate name, current interview step, and average interview score.
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          description: Position ID
      responses:
        '200':
          description: List of candidates for the position
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: array
                    items:
                      type: object
                      properties:
                        candidateId:
                          type: integer
                        fullName:
                          type: string
                        currentInterviewStep:
                          type: integer
                        averageScore:
                          type: number
                          nullable: true
        '400':
          description: Invalid position ID
        '404':
          description: Position not found
        '500':
          description: Internal server error
```

## File Map

| File | Status | Purpose |
|---|---|---|
| `backend/api-spec.yaml` | **modify** | Add `GET /positions/{id}/candidates` |
| `backend/src/domain/errors/NotFoundError.ts` | **create** | Custom error class |
| `backend/src/domain/repositories/IPositionRepository.ts` | **create** | Repository interface + shared types |
| `backend/src/infrastructure/repositories/PositionRepository.ts` | **create** | Prisma implementation |
| `backend/src/application/services/positionService.ts` | **create** | Business logic + DTO mapping |
| `backend/src/presentation/controllers/positionController.ts` | **create** | HTTP handler |
| `backend/src/routes/positionRoutes.ts` | **create** | Express router |
| `backend/src/index.ts` | **modify (1 line)** | Mount `positionRoutes` at `/positions` |
| `*.test.ts` co-located | **create** | Unit tests for each new source file |

## Risks / Trade-offs

- **[Risk] Global error middleware not typed for `NotFoundError`** → `src/index.ts` currently catches all errors and returns 500. The controller must pass `NotFoundError` to `next()`, and the global handler must check `instanceof NotFoundError`. Mitigation: document the required middleware update in tasks; it is a one-line addition to the existing handler.

- **[Risk] PrismaClient instantiated in controller** → For this story the controller creates `new PrismaClient()` and passes it down. This is slightly better than the legacy model-level pattern (it is scoped to the route module) but still not ideal. A shared singleton (`src/infrastructure/prismaClient.ts`) is the correct end state. Mitigation: accepted for now; noted as follow-up technical debt. The constructor-injection pattern still makes tests mockable.

- **[Trade-off] Average score computed in memory vs. SQL `AVG()`** → Memory computation keeps business logic in the service layer and is trivially testable. At scale (thousands of interviews per application) a SQL aggregate would be faster. Accepted at current scale.

## Open Questions

_(none — all decisions above are unblocked)_
