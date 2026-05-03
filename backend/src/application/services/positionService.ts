import { IPositionRepository } from '../../domain/repositories/IPositionRepository';
import { NotFoundError } from '../../domain/errors/NotFoundError';

export interface PositionCandidateDto {
  candidateId: number;
  fullName: string;
  currentInterviewStep: number;
  averageScore: number | null;
}

export class PositionService {
  constructor(private readonly positionRepository: IPositionRepository) {}

  async getCandidatesByPosition(id: number): Promise<PositionCandidateDto[]> {
    const exists = await this.positionRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Position not found');
    }

    const applications = await this.positionRepository.findCandidatesByPositionId(id);

    return applications.map((app) => {
      const scoredInterviews = app.interviews.filter(
        (interview): interview is { score: number } => interview.score !== null
      );
      const averageScore =
        scoredInterviews.length > 0
          ? scoredInterviews.reduce((sum, interview) => sum + interview.score, 0) /
            scoredInterviews.length
          : null;

      return {
        candidateId: app.candidateId,
        fullName: `${app.firstName} ${app.lastName}`,
        currentInterviewStep: app.currentInterviewStep,
        averageScore,
      };
    });
  }
}
