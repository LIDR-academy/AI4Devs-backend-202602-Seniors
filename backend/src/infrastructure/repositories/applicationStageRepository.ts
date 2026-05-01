import { PrismaClient } from '@prisma/client';

interface ApplicationForStageUpdate {
  id: number;
  position: {
    interviewFlowId: number;
  };
}

export interface ApplicationStageRepository {
  findApplicationById(applicationId: number): Promise<ApplicationForStageUpdate | null>;
  targetStepBelongsToFlow(targetInterviewStepId: number, interviewFlowId: number): Promise<boolean>;
  updateCurrentInterviewStep(
    applicationId: number,
    targetInterviewStepId: number
  ): Promise<{ id: number; currentInterviewStep: number }>;
}

export const createPrismaApplicationStageRepository = (
  prisma: PrismaClient
): ApplicationStageRepository => ({
  async findApplicationById(applicationId: number): Promise<ApplicationForStageUpdate | null> {
    return prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        position: {
          select: {
            interviewFlowId: true,
          },
        },
      },
    });
  },

  async targetStepBelongsToFlow(
    targetInterviewStepId: number,
    interviewFlowId: number
  ): Promise<boolean> {
    const step = await prisma.interviewStep.findFirst({
      where: {
        id: targetInterviewStepId,
        interviewFlowId,
      },
      select: {
        id: true,
      },
    });

    return Boolean(step);
  },

  async updateCurrentInterviewStep(
    applicationId: number,
    targetInterviewStepId: number
  ): Promise<{ id: number; currentInterviewStep: number }> {
    return prisma.application.update({
      where: { id: applicationId },
      data: {
        currentInterviewStep: targetInterviewStepId,
      },
      select: {
        id: true,
        currentInterviewStep: true,
      },
    });
  },
});
