import { PrismaClient } from '@prisma/client';

interface ApplicationWithCandidateAndInterviews {
  currentInterviewStep: number;
  candidate: {
    firstName: string;
    lastName: string;
  };
  interviews: Array<{
    score: number | null;
  }>;
}

export interface PositionCandidatesRepository {
  positionExists(positionId: number): Promise<boolean>;
  findApplicationsByPositionId(positionId: number): Promise<ApplicationWithCandidateAndInterviews[]>;
}

export const createPrismaPositionCandidatesRepository = (
  prisma: PrismaClient
): PositionCandidatesRepository => ({
  async positionExists(positionId: number): Promise<boolean> {
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      select: { id: true },
    });

    return Boolean(position);
  },

  async findApplicationsByPositionId(positionId: number): Promise<ApplicationWithCandidateAndInterviews[]> {
    return prisma.application.findMany({
      where: { positionId },
      select: {
        currentInterviewStep: true,
        candidate: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        interviews: {
          select: {
            score: true,
          },
        },
      },
    });
  },
});
