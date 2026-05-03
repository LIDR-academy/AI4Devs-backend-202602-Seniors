import { PrismaClient } from '@prisma/client';
import {
    updateCandidateStageForPosition,
    ValidationError,
    NotFoundError,
    ConflictError
} from './candidateService';

type StageMockPrisma = {
    candidateFindUnique: jest.Mock;
    positionFindUnique: jest.Mock;
    interviewStepFindUnique: jest.Mock;
    applicationFindMany: jest.Mock;
    applicationUpdate: jest.Mock;
};

function createStageMockPrisma(overrides: Partial<StageMockPrisma> = {}): PrismaClient {
    const defaults: StageMockPrisma = {
        candidateFindUnique: jest.fn(),
        positionFindUnique: jest.fn(),
        interviewStepFindUnique: jest.fn(),
        applicationFindMany: jest.fn(),
        applicationUpdate: jest.fn()
    };
    const m = { ...defaults, ...overrides };
    return {
        candidate: { findUnique: m.candidateFindUnique },
        position: { findUnique: m.positionFindUnique },
        interviewStep: { findUnique: m.interviewStepFindUnique },
        application: {
            findMany: m.applicationFindMany,
            update: m.applicationUpdate
        }
    } as unknown as PrismaClient;
}

describe('updateCandidateStageForPosition', () => {
    const candidateId = 1;
    const positionId = 10;
    const flowId = 100;
    const previousStep = 5;
    const newStep = 7;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('actualiza currentInterviewStep correctamente', async () => {
        const applicationFindMany = jest.fn().mockResolvedValue([
            {
                id: 99,
                candidateId,
                positionId,
                currentInterviewStep: previousStep
            }
        ]);
        const applicationUpdate = jest.fn().mockResolvedValue({
            id: 99,
            candidateId,
            positionId,
            currentInterviewStep: newStep
        });
        const prisma = createStageMockPrisma({
            candidateFindUnique: jest.fn().mockResolvedValue({ id: candidateId }),
            positionFindUnique: jest.fn().mockResolvedValue({ id: positionId, interviewFlowId: flowId }),
            interviewStepFindUnique: jest.fn().mockResolvedValue({ id: newStep, interviewFlowId: flowId }),
            applicationFindMany,
            applicationUpdate
        });

        const result = await updateCandidateStageForPosition(prisma, candidateId, positionId, newStep);

        expect(applicationUpdate).toHaveBeenCalledWith({
            where: { id: 99 },
            data: { currentInterviewStep: newStep },
            select: {
                id: true,
                candidateId: true,
                positionId: true,
                currentInterviewStep: true
            }
        });
        expect(result).toEqual({
            message: 'Stage updated successfully',
            data: {
                applicationId: 99,
                candidateId,
                positionId,
                previousInterviewStep: previousStep,
                currentInterviewStep: newStep
            }
        });
    });

    it('lanza NotFoundError si Candidate no existe', async () => {
        const prisma = createStageMockPrisma({
            candidateFindUnique: jest.fn().mockResolvedValue(null),
            positionFindUnique: jest.fn().mockResolvedValue({ id: positionId, interviewFlowId: flowId }),
            interviewStepFindUnique: jest.fn().mockResolvedValue({ id: newStep, interviewFlowId: flowId })
        });

        await expect(
            updateCandidateStageForPosition(prisma, candidateId, positionId, newStep)
        ).rejects.toThrow(new NotFoundError('Candidate not found'));
    });

    it('lanza NotFoundError si Position no existe', async () => {
        const prisma = createStageMockPrisma({
            candidateFindUnique: jest.fn().mockResolvedValue({ id: candidateId }),
            positionFindUnique: jest.fn().mockResolvedValue(null),
            interviewStepFindUnique: jest.fn().mockResolvedValue({ id: newStep, interviewFlowId: flowId })
        });

        await expect(
            updateCandidateStageForPosition(prisma, candidateId, positionId, newStep)
        ).rejects.toThrow(new NotFoundError('Position not found'));
    });

    it('lanza NotFoundError si InterviewStep no existe', async () => {
        const prisma = createStageMockPrisma({
            candidateFindUnique: jest.fn().mockResolvedValue({ id: candidateId }),
            positionFindUnique: jest.fn().mockResolvedValue({ id: positionId, interviewFlowId: flowId }),
            interviewStepFindUnique: jest.fn().mockResolvedValue(null)
        });

        await expect(
            updateCandidateStageForPosition(prisma, candidateId, positionId, newStep)
        ).rejects.toThrow(new NotFoundError('InterviewStep not found'));
    });

    it('lanza ValidationError si InterviewStep no pertenece al InterviewFlow de la Position', async () => {
        const prisma = createStageMockPrisma({
            candidateFindUnique: jest.fn().mockResolvedValue({ id: candidateId }),
            positionFindUnique: jest.fn().mockResolvedValue({ id: positionId, interviewFlowId: flowId }),
            interviewStepFindUnique: jest.fn().mockResolvedValue({ id: newStep, interviewFlowId: 999 })
        });

        await expect(
            updateCandidateStageForPosition(prisma, candidateId, positionId, newStep)
        ).rejects.toThrow(
            new ValidationError('InterviewStep does not belong to the Position interview flow')
        );
        expect(prisma.application.findMany).not.toHaveBeenCalled();
    });

    it('lanza NotFoundError si no existe Application', async () => {
        const prisma = createStageMockPrisma({
            candidateFindUnique: jest.fn().mockResolvedValue({ id: candidateId }),
            positionFindUnique: jest.fn().mockResolvedValue({ id: positionId, interviewFlowId: flowId }),
            interviewStepFindUnique: jest.fn().mockResolvedValue({ id: newStep, interviewFlowId: flowId }),
            applicationFindMany: jest.fn().mockResolvedValue([])
        });

        await expect(
            updateCandidateStageForPosition(prisma, candidateId, positionId, newStep)
        ).rejects.toThrow(new NotFoundError('Application not found'));
    });

    it('lanza ConflictError si hay más de una Application', async () => {
        const prisma = createStageMockPrisma({
            candidateFindUnique: jest.fn().mockResolvedValue({ id: candidateId }),
            positionFindUnique: jest.fn().mockResolvedValue({ id: positionId, interviewFlowId: flowId }),
            interviewStepFindUnique: jest.fn().mockResolvedValue({ id: newStep, interviewFlowId: flowId }),
            applicationFindMany: jest.fn().mockResolvedValue([
                { id: 1, candidateId, positionId, currentInterviewStep: 5 },
                { id: 2, candidateId, positionId, currentInterviewStep: 5 }
            ])
        });

        await expect(
            updateCandidateStageForPosition(prisma, candidateId, positionId, newStep)
        ).rejects.toThrow(
            new ConflictError('Multiple applications found for this candidate and position')
        );
        expect(prisma.application.update).not.toHaveBeenCalled();
    });
});
