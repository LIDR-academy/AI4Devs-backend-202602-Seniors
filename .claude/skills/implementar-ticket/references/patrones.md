# Referencia de Patrones de Diseño — Backend DDD

## Repository

**Cuándo:** siempre que el dominio necesite persistir o recuperar agregados.

```typescript
// Puerto (dominio)
export interface CandidateRepository {
  findById(id: CandidateId): Promise<Candidate | null>
  save(candidate: Candidate): Promise<void>
}

// Adaptador (infraestructura)
export class PrismaCandidateRepository implements CandidateRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: CandidateId): Promise<Candidate | null> {
    const row = await this.db.candidate.findUnique({ where: { id: id.value } })
    return row ? CandidateMapper.toDomain(row) : null
  }

  async save(candidate: Candidate): Promise<void> {
    await this.db.candidate.upsert({
      where: { id: candidate.id.value },
      update: CandidateMapper.toPersistence(candidate),
      create: CandidateMapper.toPersistence(candidate),
    })
  }
}
```

---

## Result / Either

**Cuándo:** operaciones que pueden fallar por reglas de negocio (no por excepciones técnicas).

```typescript
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

// Uso en use-case
async execute(dto: UpdateStageDto): Promise<Result<void, DomainError>> {
  const candidate = await this.repo.findById(new CandidateId(dto.candidateId))
  if (!candidate) return err(new CandidateNotFoundError(dto.candidateId))

  const result = candidate.moveToStage(dto.stage)
  if (!result.ok) return result

  await this.repo.save(candidate)
  return ok(undefined)
}
```

---

## Factory

**Cuándo:** la creación de un objeto es compleja o requiere validaciones de dominio.

```typescript
export class ApplicationFactory {
  static create(props: CreateApplicationProps): Result<Application, DomainError> {
    if (!InterviewStep.isValid(props.initialStep)) {
      return err(new InvalidInterviewStepError(props.initialStep))
    }
    return ok(new Application({
      id: ApplicationId.generate(),
      candidateId: new CandidateId(props.candidateId),
      currentStep: new InterviewStep(props.initialStep),
    }))
  }
}
```

---

## Strategy

**Cuándo:** hay múltiples algoritmos intercambiables para una misma operación.

```typescript
export interface ScoreCalculationStrategy {
  calculate(interviews: Interview[]): number
}

export class WeightedAverageStrategy implements ScoreCalculationStrategy {
  calculate(interviews: Interview[]): number {
    const total = interviews.reduce((sum, i) => sum + i.score * i.weight, 0)
    const weights = interviews.reduce((sum, i) => sum + i.weight, 0)
    return weights === 0 ? 0 : total / weights
  }
}

export class SimpleAverageStrategy implements ScoreCalculationStrategy {
  calculate(interviews: Interview[]): number {
    if (interviews.length === 0) return 0
    return interviews.reduce((sum, i) => sum + i.score, 0) / interviews.length
  }
}
```

---

## Observer / Domain Events

**Cuándo:** una acción dispara efectos en otros bounded contexts.

```typescript
// Evento de dominio
export class CandidateAdvancedToStage {
  constructor(
    readonly candidateId: string,
    readonly newStage: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}

// Publicación dentro del agregado
class Application {
  moveToStage(stage: InterviewStep): Result<void, DomainError> {
    if (!this.canMoveTo(stage)) return err(new InvalidTransitionError())
    this.currentStep = stage
    this.addDomainEvent(new CandidateAdvancedToStage(this.candidateId.value, stage.value))
    return ok(undefined)
  }
}
```

---

## Decorator

**Cuándo:** añadir comportamiento transversal (logging, caché, retry) sin modificar la clase.

```typescript
export class LoggingCandidateRepository implements CandidateRepository {
  constructor(
    private readonly inner: CandidateRepository,
    private readonly logger: Logger,
  ) {}

  async findById(id: CandidateId): Promise<Candidate | null> {
    this.logger.debug(`findById ${id.value}`)
    const result = await this.inner.findById(id)
    this.logger.debug(`findById ${id.value} → ${result ? 'found' : 'not found'}`)
    return result
  }

  async save(candidate: Candidate): Promise<void> {
    this.logger.debug(`save ${candidate.id.value}`)
    await this.inner.save(candidate)
  }
}
```

---

## Unit of Work

**Cuándo:** múltiples operaciones de escritura deben ser atómicas.

```typescript
export interface UnitOfWork {
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  candidateRepository: CandidateRepository
  applicationRepository: ApplicationRepository
}

// Uso en use-case
async execute(dto: MoveStageDto): Promise<Result<void, DomainError>> {
  await this.uow.begin()
  try {
    const candidate = await this.uow.candidateRepository.findById(...)
    // ... lógica de dominio
    await this.uow.applicationRepository.save(application)
    await this.uow.commit()
    return ok(undefined)
  } catch (e) {
    await this.uow.rollback()
    throw e
  }
}
```

---

## CQRS

**Cuándo:** las necesidades de lectura y escritura difieren significativamente.

```typescript
// Command side
export class UpdateCandidateStageCommand {
  constructor(readonly candidateId: string, readonly stage: string) {}
}

export class UpdateCandidateStageHandler {
  async handle(cmd: UpdateCandidateStageCommand): Promise<Result<void, DomainError>> { ... }
}

// Query side (puede usar una proyección distinta, sin pasar por el dominio)
export class GetPositionCandidatesQuery {
  constructor(readonly positionId: string) {}
}

export class GetPositionCandidatesHandler {
  async handle(query: GetPositionCandidatesQuery): Promise<CandidateSummaryDto[]> {
    // Puede ir directo a DB con una query SQL optimizada
    return this.db.$queryRaw`
      SELECT c.first_name || ' ' || c.last_name AS full_name,
             a.current_interview_step,
             AVG(i.score) AS average_score
      FROM applications a
      JOIN candidates c ON c.id = a.candidate_id
      LEFT JOIN interviews i ON i.application_id = a.id
      WHERE a.position_id = ${query.positionId}
      GROUP BY c.id, a.id
    `
  }
}
```

---

## Saga / Process Manager

**Cuándo:** flujos de negocio multi-paso con compensación ante fallos.

```typescript
export class HiringProcessSaga {
  private state: HiringState = 'PENDING'

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof ApplicationReceived) {
      await this.scheduleInitialInterview(event)
      this.state = 'INTERVIEW_SCHEDULED'
    }
    if (event instanceof InterviewCompleted && this.state === 'INTERVIEW_SCHEDULED') {
      if (event.passed) {
        await this.advanceToNextStage(event)
      } else {
        await this.rejectCandidate(event)  // compensación
      }
    }
  }
}
```
