import { PrismaClient } from '@prisma/client';
import { ApplicationStageUpdate } from '../../domain/models/ApplicationStageUpdate';
import {
  ApplicationStageRepository,
  createPrismaApplicationStageRepository,
} from '../../infrastructure/repositories/applicationStageRepository';

export class ApplicationNotFoundError extends Error {
  constructor(applicationId: number) {
    super(`Application with id ${applicationId} not found`);
    this.name = 'ApplicationNotFoundError';
  }
}

export class InvalidTargetInterviewStepError extends Error {
  constructor(targetInterviewStepId: number) {
    super(`Interview step ${targetInterviewStepId} is not valid for this application flow`);
    this.name = 'InvalidTargetInterviewStepError';
  }
}

export const updateApplicationStage = async (
  applicationId: number,
  targetInterviewStepId: number,
  repository: ApplicationStageRepository
): Promise<ApplicationStageUpdate> => {
  const application = await repository.findApplicationById(applicationId);
  if (!application) {
    throw new ApplicationNotFoundError(applicationId);
  }

  const isStepValid = await repository.targetStepBelongsToFlow(
    targetInterviewStepId,
    application.position.interviewFlowId
  );

  if (!isStepValid) {
    throw new InvalidTargetInterviewStepError(targetInterviewStepId);
  }

  const updatedApplication = await repository.updateCurrentInterviewStep(
    applicationId,
    targetInterviewStepId
  );

  return {
    application_id: updatedApplication.id,
    current_interview_step: updatedApplication.currentInterviewStep,
  };
};

export const updateApplicationStageFromPrisma = async (
  prisma: PrismaClient,
  applicationId: number,
  targetInterviewStepId: number
): Promise<ApplicationStageUpdate> => {
  const repository = createPrismaApplicationStageRepository(prisma);
  return updateApplicationStage(applicationId, targetInterviewStepId, repository);
};
