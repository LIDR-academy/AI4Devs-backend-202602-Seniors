import prisma from '../database/prismaClient';

export interface IUpdatedApplication {
  id: number;
  candidateId: number;
  positionId: number;
  currentInterviewStep: number;
  applicationDate: Date;
  notes: string | null;
}

export interface IApplicationRepository {
  findCandidateById(candidateId: number): Promise<{ id: number } | null>;
  findInterviewStep(stepId: number): Promise<{ id: number; name: string } | null>;
  findApplicationByCandidate(candidateId: number): Promise<{ id: number } | null>;
  updateStage(applicationId: number, interviewStepId: number): Promise<IUpdatedApplication>;
}

export class ApplicationRepository implements IApplicationRepository {
  async findCandidateById(candidateId: number): Promise<{ id: number } | null> {
    return prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
  }

  async findInterviewStep(stepId: number): Promise<{ id: number; name: string } | null> {
    return prisma.interviewStep.findUnique({
      where: { id: stepId },
      select: { id: true, name: true },
    });
  }

  async findApplicationByCandidate(candidateId: number): Promise<{ id: number } | null> {
    return prisma.application.findFirst({
      where: { candidateId },
      orderBy: { applicationDate: 'desc' },
      select: { id: true },
    });
  }

  async updateStage(applicationId: number, interviewStepId: number): Promise<IUpdatedApplication> {
    return prisma.application.update({
      where: { id: applicationId },
      data: { currentInterviewStep: interviewStepId },
    });
  }
}
