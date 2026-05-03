import { ApplicationRepository, IUpdatedApplication } from '../../infrastructure/repositories/ApplicationRepository';
import { StageUpdateError, StageUpdateErrorCode } from '../../domain/errors/StageUpdateError';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type { IUpdatedApplication };

/** Updates a candidate's current interview step using a Result/Either pattern for typed error handling. */
export class UpdateCandidateStageUseCase {
  private readonly repo: ApplicationRepository;

  constructor(repo?: ApplicationRepository) {
    this.repo = repo ?? new ApplicationRepository();
  }

  async execute(
    candidateId: number,
    interviewStepId: number,
  ): Promise<Result<IUpdatedApplication, StageUpdateError>> {
    const candidate = await this.repo.findCandidateById(candidateId);
    if (!candidate) {
      return { ok: false, error: new StageUpdateError(StageUpdateErrorCode.CANDIDATE_NOT_FOUND) };
    }

    const step = await this.repo.findInterviewStep(interviewStepId);
    if (!step) {
      return { ok: false, error: new StageUpdateError(StageUpdateErrorCode.INVALID_STEP) };
    }

    const application = await this.repo.findApplicationByCandidate(candidateId);
    if (!application) {
      return { ok: false, error: new StageUpdateError(StageUpdateErrorCode.APPLICATION_NOT_FOUND) };
    }

    const updated = await this.repo.updateStage(application.id, interviewStepId);
    return { ok: true, value: updated };
  }
}
