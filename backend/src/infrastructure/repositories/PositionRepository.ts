import prisma from '../database/prismaClient';

export interface ICandidateInProcess {
  candidateId: number;
  fullName: string;
  currentInterviewStep: string;
  averageScore: number | null;
}

export interface IPositionRepository {
  getCandidatesInProcess(positionId: number): Promise<ICandidateInProcess[]>;
}

/** CQRS read model: returns a flat DTO per candidate in process for a given position. */
export class PositionRepository implements IPositionRepository {
  async getCandidatesInProcess(positionId: number): Promise<ICandidateInProcess[]> {
    const applications = await prisma.application.findMany({
      where: { positionId },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        interviewStep: { select: { name: true } },
        interviews: { select: { score: true } },
      },
    });

    return applications.map((app) => {
      const validScores = app.interviews
        .filter((i) => i.score !== null)
        .map((i) => i.score as number);

      const averageScore =
        validScores.length > 0
          ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
          : null;

      return {
        candidateId: app.candidateId,
        fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        currentInterviewStep: app.interviewStep.name,
        averageScore,
      };
    });
  }
}
