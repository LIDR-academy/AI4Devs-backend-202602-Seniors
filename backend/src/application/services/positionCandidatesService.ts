import { PrismaClient } from '@prisma/client';
import { PositionCandidateSummary } from '../../domain/models/PositionCandidateSummary';
import {
  createPrismaPositionCandidatesRepository,
  PositionCandidatesRepository,
} from '../../infrastructure/repositories/positionCandidatesRepository';

export class PositionNotFoundError extends Error {
  constructor(positionId: number) {
    super(`Position with id ${positionId} not found`);
    this.name = 'PositionNotFoundError';
  }
}

const calculateAverageScore = (scores: Array<number | null>): number | null => {
  const validScores = scores.filter((score): score is number => score !== null);

  if (validScores.length === 0) {
    return null;
  }

  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return sum / validScores.length;
};

const buildFullName = (firstName: string, lastName: string): string =>
  `${firstName} ${lastName}`.trim();

export const getCandidatesByPositionId = async (
  positionId: number,
  repository: PositionCandidatesRepository
): Promise<PositionCandidateSummary[]> => {
  const exists = await repository.positionExists(positionId);
  if (!exists) {
    throw new PositionNotFoundError(positionId);
  }

  const applications = await repository.findApplicationsByPositionId(positionId);

  return applications.map((application) => ({
    full_name: buildFullName(application.candidate.firstName, application.candidate.lastName),
    current_interview_step: application.currentInterviewStep,
    average_score: calculateAverageScore(application.interviews.map((interview) => interview.score)),
  }));
};

export const getCandidatesByPositionIdFromPrisma = async (
  prisma: PrismaClient,
  positionId: number
): Promise<PositionCandidateSummary[]> => {
  const repository = createPrismaPositionCandidatesRepository(prisma);
  return getCandidatesByPositionId(positionId, repository);
};
