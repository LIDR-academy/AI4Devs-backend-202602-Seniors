import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type CandidateForPosition = {
  candidateId: number;
  fullName: string;
  currentInterviewStep: { id: number; name: string };
  averageScore: number | null;
};

function computeAverageScore(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return parseFloat(
    (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2),
  );
}

export const getCandidatesForPosition = async (
  positionId: number,
): Promise<CandidateForPosition[]> => {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
  });
  if (!position) throw new Error('POSITION_NOT_FOUND');

  const applications = await prisma.application.findMany({
    where: { positionId },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true } },
      interviewStep: { select: { id: true, name: true } },
      interviews: { select: { score: true } },
    },
  });

  return applications.map((app) => ({
    candidateId: app.candidate.id,
    fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
    currentInterviewStep: {
      id: app.interviewStep.id,
      name: app.interviewStep.name,
    },
    averageScore: computeAverageScore(app.interviews.map((i) => i.score)),
  }));
};
