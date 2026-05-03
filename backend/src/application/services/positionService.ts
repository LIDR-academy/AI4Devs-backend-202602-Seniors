import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../errors';

const prisma = new PrismaClient();

export interface CandidateInPosition {
  fullName: string;
  currentInterviewStep: string;
  averageScore: number | null;
}

export const getCandidatesForPosition = async (
  positionId: number
): Promise<CandidateInPosition[]> => {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      applications: {
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          interviewStep: { select: { name: true } },
          interviews: { select: { score: true } },
        },
      },
    },
  });

  if (!position) {
    throw new NotFoundError('Position not found');
  }

  return position.applications.map((app) => {
    const scores = app.interviews
      .map((i) => i.score)
      .filter((s): s is number => s !== null);

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : null;

    return {
      fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      currentInterviewStep: app.interviewStep.name,
      averageScore,
    };
  });
};
