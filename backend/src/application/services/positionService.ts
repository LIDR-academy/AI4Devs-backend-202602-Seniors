import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PositionCandidate {
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  applicationDate: string;
  currentInterviewStep: number | null;
  averageScore: number | null;
}

export const getCandidatesForPosition = async (
  positionId: number,
  db: PrismaClient = prisma
): Promise<PositionCandidate[]> => {
  // Validate positionId
  if (isNaN(positionId) || positionId <= 0) {
    throw new Error('Invalid position ID');
  }

  // Check if position exists
  const position = await db.position.findUnique({
    where: { id: positionId }
  });

  if (!position) {
    throw new Error('Position not found');
  }

  // Get all applications for this position with interviews and candidate data
  const applications = await db.application.findMany({
    where: { positionId },
    orderBy: { applicationDate: 'desc' },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      interviews: {
        select: {
          score: true
        }
      }
    }
  });

  // Map applications to PositionCandidate format with average score calculation
  const candidates: PositionCandidate[] = applications.map(app => {
    const validScores = app.interviews
      .map(interview => interview.score)
      .filter((score): score is number => score !== null);

    const averageScore = validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : null;

    return {
      candidateId: app.candidate.id,
      firstName: app.candidate.firstName,
      lastName: app.candidate.lastName,
      email: app.candidate.email,
      applicationDate: app.applicationDate.toISOString(),
      currentInterviewStep: app.currentInterviewStep || null,
      averageScore
    };
  });

  return candidates;
};
