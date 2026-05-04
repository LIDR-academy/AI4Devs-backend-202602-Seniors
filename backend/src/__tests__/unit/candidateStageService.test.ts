import { PrismaClient } from '@prisma/client';
import { updateCandidateStage } from '../../application/services/candidateStageService';

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
    const mockPrismaClient: Record<string, any> = {
        candidate: {
            findUnique: jest.fn(),
        },
        application: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        interviewStep: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn((callback: (tx: Record<string, any>) => Promise<unknown>) => callback(mockPrismaClient)),
    };
    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
    };
});

describe('CandidateStageService', () => {
    let mockPrismaClient: any;

    beforeEach(() => {
        mockPrismaClient = new PrismaClient();
        jest.clearAllMocks();
    });

    describe('updateCandidateStage', () => {
        const mockCandidate = {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
        };

        const mockApplication = {
            id: 1,
            positionId: 1,
            candidateId: 1,
            applicationDate: new Date('2024-01-15'),
            currentInterviewStep: 1,
            notes: 'Initial application',
            position: {
                id: 1,
                title: 'Backend Engineer',
                interviewFlowId: 1,
                interviewFlow: {
                    id: 1,
                    description: 'Tech hiring flow',
                },
            },
        };

        const mockStage = {
            id: 2,
            name: 'Technical Interview',
            interviewFlowId: 1,
            orderIndex: 2,
        };

        it('successfully updates candidate stage when valid candidate and stage provided', async () => {
            mockPrismaClient.candidate.findUnique.mockResolvedValue(mockCandidate);
            mockPrismaClient.application.findFirst.mockResolvedValue(mockApplication);
            mockPrismaClient.interviewStep.findUnique.mockResolvedValue(mockStage);
            mockPrismaClient.application.update.mockResolvedValue({
                ...mockApplication,
                currentInterviewStep: 2,
            });
            mockPrismaClient.application.findUnique.mockResolvedValue({
                ...mockApplication,
                currentInterviewStep: 2,
                position: {
                    id: 1,
                    title: 'Backend Engineer',
                    interviewFlowId: 1,
                },
                interviewStep: {
                    id: 2,
                    name: 'Technical Interview',
                    interviewFlowId: 1,
                },
            });

            const result = await updateCandidateStage(1, 2);

            expect(mockPrismaClient.candidate.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(mockPrismaClient.application.findFirst).toHaveBeenCalledWith({
                where: { candidateId: 1 },
                orderBy: { applicationDate: 'desc' },
                include: {
                    position: {
                        include: { interviewFlow: true },
                    },
                },
            });
            expect(mockPrismaClient.interviewStep.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
            expect(result).toBeDefined();
            expect(result.currentInterviewStep).toBe(2);
        });

        it('throws "Candidate not found" when candidate does not exist', async () => {
            mockPrismaClient.candidate.findUnique.mockResolvedValue(null);

            await expect(updateCandidateStage(999, 2)).rejects.toThrow('Candidate not found');
        });

        it('throws "Interview stage not found" when stage does not exist', async () => {
            mockPrismaClient.candidate.findUnique.mockResolvedValue(mockCandidate);
            mockPrismaClient.application.findFirst.mockResolvedValue(mockApplication);
            mockPrismaClient.interviewStep.findUnique.mockResolvedValue(null);

            await expect(updateCandidateStage(1, 999)).rejects.toThrow('Interview stage not found');
        });

        it('throws "No application found for this candidate" when candidate has no applications', async () => {
            mockPrismaClient.candidate.findUnique.mockResolvedValue(mockCandidate);
            mockPrismaClient.application.findFirst.mockResolvedValue(null);

            await expect(updateCandidateStage(1, 2)).rejects.toThrow('No application found for this candidate');
        });

        it('throws "Invalid stage for this position" when stage is from different interview flow', async () => {
            mockPrismaClient.candidate.findUnique.mockResolvedValue(mockCandidate);
            mockPrismaClient.application.findFirst.mockResolvedValue(mockApplication);
            mockPrismaClient.interviewStep.findUnique.mockResolvedValue({
                ...mockStage,
                interviewFlowId: 999, // Different flow
            });

            await expect(updateCandidateStage(1, 2)).rejects.toThrow('Invalid stage for this position');
        });

        it('succeeds when stage is from correct interview flow', async () => {
            mockPrismaClient.candidate.findUnique.mockResolvedValue(mockCandidate);
            mockPrismaClient.application.findFirst.mockResolvedValue(mockApplication);
            mockPrismaClient.interviewStep.findUnique.mockResolvedValue(mockStage);
            mockPrismaClient.application.update.mockResolvedValue({
                ...mockApplication,
                currentInterviewStep: 2,
            });
            mockPrismaClient.application.findUnique.mockResolvedValue({
                ...mockApplication,
                currentInterviewStep: 2,
                position: {
                    id: 1,
                    title: 'Backend Engineer',
                    interviewFlowId: 1,
                },
                interviewStep: {
                    id: 2,
                    name: 'Technical Interview',
                    interviewFlowId: 1,
                },
            });

            const result = await updateCandidateStage(1, 2);

            expect(result).toBeDefined();
            expect(result.currentInterviewStep).toBe(2);
        });
    });
});
