import { PositionRepository, ICandidateInProcess } from '../../infrastructure/repositories/PositionRepository';

export type { ICandidateInProcess };

/** Returns all candidates in process for a position, with their current step and avg interview score. */
export class GetPositionCandidatesUseCase {
  private readonly repo: PositionRepository;

  constructor(repo?: PositionRepository) {
    this.repo = repo ?? new PositionRepository();
  }

  async execute(positionId: number): Promise<ICandidateInProcess[]> {
    return this.repo.getCandidatesInProcess(positionId);
  }
}
