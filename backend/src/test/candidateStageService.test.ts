import { PrismaClient } from '@prisma/client';
import { updateApplicationInterviewStage } from '../application/services/candidateStageService';

describe('candidateStageService', () => {
    const flowStepIds = [{ id: 100 }, { id: 101 }];

    it('lanza 404 si no hay aplicación para candidato y posición', async () => {
        const prisma = {
            application: {
                findFirst: jest.fn().mockResolvedValue(null),
            },
        } as unknown as PrismaClient;

        await expect(updateApplicationInterviewStage(prisma, 1, 5, 100)).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it('lanza 404 si la posición no tiene flujo de entrevistas', async () => {
        const prisma = {
            application: {
                findFirst: jest.fn().mockResolvedValue({ id: 1, candidateId: 1, positionId: 5 }),
            },
            position: {
                findUnique: jest.fn().mockResolvedValue(null),
            },
        } as unknown as PrismaClient;

        await expect(updateApplicationInterviewStage(prisma, 1, 5, 100)).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it('lanza 400 si interviewStepId no pertenece al InterviewFlow de la posición', async () => {
        const prisma = {
            application: {
                findFirst: jest.fn().mockResolvedValue({ id: 1, candidateId: 1, positionId: 5 }),
            },
            position: {
                findUnique: jest.fn().mockResolvedValue({
                    interviewFlow: {
                        interviewSteps: flowStepIds,
                    },
                }),
            },
        } as unknown as PrismaClient;

        await expect(updateApplicationInterviewStage(prisma, 1, 5, 999)).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('no pertenece'),
        });
    });

    it('actualiza currentInterviewStep cuando el paso es válido para el flujo de la posición', async () => {
        const updatedRow = {
            id: 1,
            candidateId: 1,
            positionId: 5,
            interviewStep: { id: 101, name: 'Manager', orderIndex: 3 },
        };

        const prisma = {
            application: {
                findFirst: jest.fn().mockResolvedValue({ id: 1, candidateId: 1, positionId: 5 }),
                update: jest.fn().mockResolvedValue(updatedRow),
            },
            position: {
                findUnique: jest.fn().mockResolvedValue({
                    interviewFlow: {
                        interviewSteps: flowStepIds,
                    },
                }),
            },
        } as unknown as PrismaClient;

        const result = await updateApplicationInterviewStage(prisma, 1, 5, 101);

        expect(prisma.application.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { currentInterviewStep: 101 },
            include: expect.any(Object),
        });
        expect(result.interviewStep.id).toBe(101);
    });
});
