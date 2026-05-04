const mockPrisma = {
    position: {
        findUnique: jest.fn(),
    },
    application: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
    candidate: {
        findUnique: jest.fn(),
    },
    interviewStep: {
        findUnique: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

import { getCandidatesByPosition, updateCandidateStage } from './applicationService';

describe('applicationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCandidatesByPosition', () => {
        it('returns candidate summaries grouped by application for a position', async () => {
            mockPrisma.position.findUnique.mockResolvedValue({ id: 10 });
            mockPrisma.application.findMany.mockResolvedValue([
                {
                    id: 7,
                    candidate: {
                        id: 3,
                        firstName: 'Ada',
                        lastName: 'Lovelace',
                    },
                    interviewStep: {
                        id: 2,
                        name: 'Technical Interview',
                        orderIndex: 2,
                    },
                    interviews: [
                        { score: 4 },
                        { score: 5 },
                        { score: null },
                    ],
                },
            ]);

            await expect(getCandidatesByPosition(10)).resolves.toEqual([
                {
                    applicationId: 7,
                    candidateId: 3,
                    fullName: 'Ada Lovelace',
                    current_interview_step: {
                        id: 2,
                        name: 'Technical Interview',
                        orderIndex: 2,
                    },
                    averageScore: 4.5,
                },
            ]);
        });

        it('fails when the position does not exist', async () => {
            mockPrisma.position.findUnique.mockResolvedValue(null);

            await expect(getCandidatesByPosition(404)).rejects.toThrow('Position not found');
            expect(mockPrisma.application.findMany).not.toHaveBeenCalled();
        });
    });

    describe('updateCandidateStage', () => {
        it('updates the application stage for a candidate and position', async () => {
            const updatedApplication = {
                id: 9,
                candidateId: 3,
                positionId: 10,
                currentInterviewStep: 4,
            };
            mockPrisma.candidate.findUnique.mockResolvedValue({ id: 3 });
            mockPrisma.interviewStep.findUnique.mockResolvedValue({ id: 4 });
            mockPrisma.application.findMany.mockResolvedValue([{ id: 9, positionId: 10 }]);
            mockPrisma.application.update.mockResolvedValue(updatedApplication);

            await expect(updateCandidateStage({
                candidateId: 3,
                positionId: 10,
                currentInterviewStep: 4,
            })).resolves.toEqual(updatedApplication);

            expect(mockPrisma.application.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 9 },
                data: { currentInterviewStep: 4 },
            }));
        });

        it('requires positionId when candidate has multiple applications', async () => {
            mockPrisma.candidate.findUnique.mockResolvedValue({ id: 3 });
            mockPrisma.interviewStep.findUnique.mockResolvedValue({ id: 4 });
            mockPrisma.application.findMany.mockResolvedValue([
                { id: 9, positionId: 10 },
                { id: 11, positionId: 12 },
            ]);

            await expect(updateCandidateStage({
                candidateId: 3,
                currentInterviewStep: 4,
            })).rejects.toThrow('Position ID is required when candidate has multiple applications');

            expect(mockPrisma.application.update).not.toHaveBeenCalled();
        });
    });
});
