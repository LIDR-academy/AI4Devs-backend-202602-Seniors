# Principios SOLID, DRY y CUPID — Guía práctica para Backend

## SOLID

### S — Single Responsibility
Cada clase o módulo tiene **una sola razón de cambio**.

```typescript
// MAL: el controlador valida, ejecuta lógica y formatea
class CandidateController {
  async updateStage(req, res) {
    if (!req.body.stage) return res.status(400).json({ error: 'stage required' })
    const candidate = await this.db.candidate.findUnique(...)
    if (!candidate) return res.status(404).json(...)
    candidate.currentStep = req.body.stage
    await this.db.candidate.update(...)
    res.json({ ...candidate, updatedAt: new Date() })
  }
}

// BIEN: el controlador delega todo
class CandidateController {
  async updateStage(req: Request, res: Response) {
    const result = await this.updateStageUseCase.execute({
      candidateId: req.params.id,
      stage: req.body.stage,
    })
    if (!result.ok) return res.status(result.error.statusCode).json({ error: result.error.message })
    res.status(200).json({ message: 'Stage updated' })
  }
}
```

### O — Open/Closed
Abierto para extensión, cerrado para modificación. Usa Strategy o Decorator.

### L — Liskov Substitution
Los subtipos deben comportarse como el tipo base sin sorpresas. Respeta los contratos de las interfaces.

### I — Interface Segregation
Prefiere múltiples interfaces pequeñas a una grande.

```typescript
// MAL
interface CandidateRepository {
  findById, save, delete, findByEmail, findByPosition, generateReport
}

// BIEN
interface CandidateReader { findById(id: CandidateId): Promise<Candidate | null> }
interface CandidateWriter { save(candidate: Candidate): Promise<void> }
interface CandidateRepository extends CandidateReader, CandidateWriter {}
```

### D — Dependency Inversion
Depende de abstracciones, no de implementaciones. Inyecta dependencias.

```typescript
// MAL
class UpdateStageUseCase {
  private repo = new PrismaCandidateRepository() // acoplado a Prisma
}

// BIEN
class UpdateStageUseCase {
  constructor(private readonly repo: CandidateRepository) {} // depende del puerto
}
```

---

## DRY — Don't Repeat Yourself

Extrae lógica repetida, pero **aplica la regla de tres**: sólo cuando ya se repite en tres lugares distintos.

```typescript
// Repetición legítima de extraer
const toFullName = (c: { firstName: string; lastName: string }) =>
  `${c.firstName} ${c.lastName}`
```

DRY mal aplicado: crear abstracciones prematuras para código que sólo existe en un lugar.

---

## CUPID

### Composable
Las piezas se combinan sin fricción. Prefiere funciones puras y clases pequeñas.

### Unix-style
Cada pieza hace una sola cosa bien. Un use-case = un caso de uso.

### Predictable
- Misma entrada → misma salida (sin efectos ocultos)
- Evita estado global y mutaciones inesperadas
- Los Value Objects son inmutables

### Idiomatic
Usa las convenciones del lenguaje y el framework:
- TypeScript: usa tipos estrictos, no `any`
- Node/Express: usa middleware para cross-cutting concerns
- Prisma: usa transactions nativas cuando Unit of Work no aplica

### Domain-based
Los nombres reflejan el dominio, no la tecnología:
```typescript
// MAL: nombre tecnológico
class CandidateDbRecord { ... }
class CandidateApiResponse { ... }

// BIEN: nombre del dominio
class Candidate { ... }          // entidad de dominio
class CandidateDto { ... }       // contrato de aplicación
class CandidatePersistence { ... } // modelo de persistencia
```
