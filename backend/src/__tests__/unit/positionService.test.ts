import { getPositionCandidates, getPositionInterviewSteps } from '../../application/services/positionService';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => ({
        position: { findUnique: jest.fn() },
    })),
}));

// positionService called `new PrismaClient()` on import — grab that instance
const MockedPrisma = PrismaClient as jest.MockedClass<typeof PrismaClient>;
const prismaInstance = MockedPrisma.mock.results[0].value;
const mockFindUnique: jest.Mock = prismaInstance.position.findUnique;

describe('positionService', () => {
    beforeEach(() => {
        mockFindUnique.mockClear();
    });

    describe('getPositionCandidates', () => {
        it('returns null when position not found', async () => {
            mockFindUnique.mockResolvedValue(null);
            const result = await getPositionCandidates(999);
            expect(result).toBeNull();
        });

        it('returns empty array when position has no applications', async () => {
            mockFindUnique.mockResolvedValue({ applications: [] });
            const result = await getPositionCandidates(1);
            expect(result).toEqual([]);
        });

        it('returns candidates with correct DTO structure', async () => {
            mockFindUnique.mockResolvedValue({
                applications: [{
                    id: 10,
                    candidateId: 1,
                    currentInterviewStep: 2,
                    candidate: { firstName: 'John', lastName: 'Doe' },
                    interviewStep: { name: 'HR Screen' },
                    interviews: [],
                }],
            });
            const result = await getPositionCandidates(1);
            expect(result).toEqual([{
                candidateId: 1,
                applicationId: 10,
                fullName: 'John Doe',
                currentInterviewStep: 'HR Screen',
                currentInterviewStepId: 2,
                averageScore: null,
            }]);
        });

        it('computes averageScore correctly from multiple interviews', async () => {
            mockFindUnique.mockResolvedValue({
                applications: [{
                    id: 10,
                    candidateId: 1,
                    currentInterviewStep: 3,
                    candidate: { firstName: 'Jane', lastName: 'Smith' },
                    interviewStep: { name: 'Technical Interview' },
                    interviews: [{ score: 8 }, { score: 10 }],
                }],
            });
            const result = await getPositionCandidates(1);
            expect(result![0].averageScore).toBe(9);
        });

        it('returns null averageScore when all interview scores are null', async () => {
            mockFindUnique.mockResolvedValue({
                applications: [{
                    id: 10,
                    candidateId: 1,
                    currentInterviewStep: 1,
                    candidate: { firstName: 'Carlos', lastName: 'García' },
                    interviewStep: { name: 'HR Screen' },
                    interviews: [{ score: null }, { score: null }],
                }],
            });
            const result = await getPositionCandidates(1);
            expect(result![0].averageScore).toBeNull();
        });

        it('concatenates firstName and lastName into fullName', async () => {
            mockFindUnique.mockResolvedValue({
                applications: [{
                    id: 5,
                    candidateId: 2,
                    currentInterviewStep: 4,
                    candidate: { firstName: 'María', lastName: 'López' },
                    interviewStep: { name: 'Final Interview' },
                    interviews: [],
                }],
            });
            const result = await getPositionCandidates(1);
            expect(result![0].fullName).toBe('María López');
        });
    });

    describe('getPositionInterviewSteps', () => {
        it('returns null when position not found', async () => {
            mockFindUnique.mockResolvedValue(null);
            const result = await getPositionInterviewSteps(999);
            expect(result).toBeNull();
        });

        it('returns steps with correct DTO structure', async () => {
            mockFindUnique.mockResolvedValue({
                interviewFlow: {
                    interviewSteps: [
                        { id: 1, name: 'HR Screen', orderIndex: 1, interviewType: { name: 'HR Screen' } },
                        { id: 2, name: 'Technical Screen', orderIndex: 2, interviewType: { name: 'Technical Screen' } },
                    ],
                },
            });
            const result = await getPositionInterviewSteps(1);
            expect(result).toEqual([
                { id: 1, name: 'HR Screen', orderIndex: 1, interviewType: 'HR Screen' },
                { id: 2, name: 'Technical Screen', orderIndex: 2, interviewType: 'Technical Screen' },
            ]);
        });

        it('maps interviewType.name to the interviewType field', async () => {
            mockFindUnique.mockResolvedValue({
                interviewFlow: {
                    interviewSteps: [
                        { id: 4, name: 'Final Interview', orderIndex: 4, interviewType: { name: 'Final Interview' } },
                    ],
                },
            });
            const result = await getPositionInterviewSteps(1);
            expect(result![0].interviewType).toBe('Final Interview');
        });
    });
});
