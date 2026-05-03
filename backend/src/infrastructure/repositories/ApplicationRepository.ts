import { PrismaClient } from '@prisma/client';
import { ApplicationData, IApplicationRepository } from '../../domain/repositories/IApplicationRepository';

export class ApplicationRepository implements IApplicationRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async candidateExists(candidateId: number): Promise<boolean> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    return candidate !== null;
  }

  async findByIdAndCandidateId(applicationId: number, candidateId: number): Promise<ApplicationData | null> {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, candidateId },
    });
    if (!application) return null;
    return {
      id: application.id,
      positionId: application.positionId,
      candidateId: application.candidateId,
      applicationDate: application.applicationDate,
      currentInterviewStep: application.currentInterviewStep,
      notes: application.notes,
    };
  }

  async updateInterviewStep(applicationId: number, newStepId: number, notes?: string): Promise<ApplicationData> {
    const updateData: { currentInterviewStep: number; notes?: string } = {
      currentInterviewStep: newStepId,
    };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: updateData,
    });
    return {
      id: updated.id,
      positionId: updated.positionId,
      candidateId: updated.candidateId,
      applicationDate: updated.applicationDate,
      currentInterviewStep: updated.currentInterviewStep,
      notes: updated.notes,
      updatedAt: new Date(),
    };
  }

  async isValidInterviewStepForPosition(positionId: number, stepId: number): Promise<boolean> {
    const position = await this.prisma.position.findUnique({
      where: { id: positionId },
      select: { interviewFlowId: true },
    });
    if (!position) return false;

    const step = await this.prisma.interviewStep.findFirst({
      where: { id: stepId, interviewFlowId: position.interviewFlowId },
      select: { id: true },
    });
    return step !== null;
  }

  async getInterviewStepName(stepId: number): Promise<string | null> {
    const step = await this.prisma.interviewStep.findUnique({
      where: { id: stepId },
      select: { name: true },
    });
    return step ? step.name : null;
  }
}
