import { PrismaClient } from '@prisma/client';
import {
  ApplicationWithCandidate,
  IPositionRepository,
} from '../../domain/repositories/IPositionRepository';

export class PositionRepository implements IPositionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async existsById(id: number): Promise<boolean> {
    const position = await this.prisma.position.findUnique({
      where: { id },
      select: { id: true },
    });
    return position !== null;
  }

  async findCandidatesByPositionId(id: number): Promise<ApplicationWithCandidate[]> {
    const applications = await this.prisma.application.findMany({
      where: { positionId: id },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        interviews: { select: { score: true } },
      },
    });

    return applications.map((app) => ({
      candidateId: app.candidate.id,
      firstName: app.candidate.firstName,
      lastName: app.candidate.lastName,
      currentInterviewStep: app.currentInterviewStep,
      interviews: app.interviews.map((interview) => ({ score: interview.score ?? null })),
    }));
  }
}
