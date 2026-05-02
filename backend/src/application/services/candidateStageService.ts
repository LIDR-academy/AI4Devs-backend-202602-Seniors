import { Prisma, PrismaClient } from '@prisma/client';
import { AuditService } from './auditService';

export class ApplicationNotFoundError extends Error {
  constructor(applicationId: number) {
    super(`Application with ID ${applicationId} not found`);
    this.name = 'ApplicationNotFoundError';
  }
}

export class InvalidInterviewStepError extends Error {
  constructor(stepId: number) {
    super(`Invalid interview step ID: ${stepId}`);
    this.name = 'InvalidInterviewStepError';
  }
}

export class StepNotInFlowError extends Error {
  constructor(stepId: number, positionId: number) {
    super(`Interview step ${stepId} is not valid for position ${positionId}`);
    this.name = 'StepNotInFlowError';
  }
}

export class VersionConflictError extends Error {
  constructor(applicationId: number) {
    super(`Application ${applicationId} was modified concurrently; retry the operation`);
    this.name = 'VersionConflictError';
  }
}

export interface UpdatedApplicationResponse {
  applicationId: number;
  candidateId: number;
  positionId: number;
  applicationDate: string;
  updatedAt?: string;
  currentInterviewStep: {
    stepId: number;
    stepName: string;
    stepOrder: number;
    interviewFlowId: number;
  };
}

export class CandidateStageService {
  constructor(private readonly prisma: PrismaClient) {}

  async updateStage(
    applicationId: number,
    interviewStepId: number,
    userId: number,
    notes?: string
  ): Promise<UpdatedApplicationResponse> {
    // Step 1: Fetch application with relations (also reads current version for optimistic lock)
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        position: {
          include: {
            interviewFlow: {
              include: {
                interviewSteps: true,
              },
            },
          },
        },
        candidate: true,
        interviewStep: {
          select: {
            id: true,
            name: true,
            orderIndex: true,
            interviewFlowId: true,
          },
        },
      },
    });

    if (!application) {
      throw new ApplicationNotFoundError(applicationId);
    }

    // Step 2: Validate interview step exists
    const targetStep = await this.prisma.interviewStep.findUnique({
      where: { id: interviewStepId },
    });

    if (!targetStep) {
      throw new InvalidInterviewStepError(interviewStepId);
    }

    // Step 3: Validate step is in the position's interview flow
    const stepInFlow = application.position.interviewFlow.interviewSteps.some(
      (step) => step.id === interviewStepId
    );

    if (!stepInFlow) {
      throw new StepNotInFlowError(interviewStepId, application.positionId);
    }

    // Step 4: Check idempotency (if already at this stage, return success)
    const oldStageId = application.currentInterviewStep;
    if (oldStageId === interviewStepId) {
      return this.formatResponse(
        application,
        targetStep.name,
        targetStep.orderIndex,
        targetStep.interviewFlowId
      );
    }

    // Step 5: Update in transaction with optimistic locking (version check) + audit log
    const currentVersion = application.version;
    let updated: Awaited<ReturnType<PrismaClient['application']['update']>>;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        // Conditional update: only succeeds if version hasn't changed since the read
        const updatedApp = await tx.application.update({
          where: { id: applicationId, version: currentVersion },
          data: {
            currentInterviewStep: interviewStepId,
            version: { increment: 1 },
          },
          include: {
            candidate: true,
            position: true,
            interviewStep: {
              select: {
                id: true,
                name: true,
                orderIndex: true,
                interviewFlowId: true,
              },
            },
          },
        });

        await new AuditService(tx).logStageChange(
          applicationId,
          userId,
          oldStageId,
          interviewStepId,
          notes
        );

        return updatedApp;
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // No row matched { id, version } — concurrent update or delete since the read
          throw new VersionConflictError(applicationId);
        }
        if (error.code === 'P2002') {
          throw new Error(`Conflict updating application ${applicationId}: duplicate constraint violated`);
        }
      }
      throw error;
    }

    return this.formatResponse(
      updated,
      targetStep.name,
      targetStep.orderIndex,
      targetStep.interviewFlowId
    );
  }

  private formatResponse(
    application: any,
    stepName: string,
    stepOrder: number,
    interviewFlowId: number
  ): UpdatedApplicationResponse {
    return {
      applicationId: application.id,
      candidateId: application.candidateId,
      positionId: application.positionId,
      applicationDate: application.applicationDate.toISOString(),
      updatedAt: application.updatedAt instanceof Date ? application.updatedAt.toISOString() : undefined,
      currentInterviewStep: {
        stepId: application.currentInterviewStep,
        stepName,
        stepOrder,
        interviewFlowId,
      },
    };
  }
}
