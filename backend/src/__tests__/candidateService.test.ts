import { getPositionCandidates, updateCandidateStage } from '../application/services/candidateService';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client');

describe('candidateService.getPositionCandidates', () => {
    let mockPrismaClient: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrismaClient = {
            position: {
                findUnique: jest.fn()
            },
            application: {
                findMany: jest.fn()
            },
            $disconnect: jest.fn()
        };
        (PrismaClient as jest.Mock).mockImplementation(() => mockPrismaClient);
    });

    it('should return candidates for a valid position', async () => {
        mockPrismaClient.position.findUnique.mockResolvedValue({ id: 1, title: 'Test Position' });
        mockPrismaClient.application.findMany.mockResolvedValue([
            {
                id: 1,
                positionId: 1,
                candidate: {
                    id: 1,
                    firstName: 'María',
                    lastName: 'López García'
                },
                interviewStep: {
                    name: 'Technical Round'
                },
                interviews: [
                    { score: 80 },
                    { score: 90 }
                ],
                applicationDate: new Date('2026-01-01')
            },
            {
                id: 2,
                positionId: 1,
                candidate: {
                    id: 2,
                    firstName: 'Carlos',
                    lastName: 'Rodríguez'
                },
                interviewStep: {
                    name: 'HR Interview'
                },
                interviews: [
                    { score: 75 }
                ],
                applicationDate: new Date('2026-01-02')
            }
        ]);

        const result = await getPositionCandidates(1);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            id: 1,
            fullName: 'María López García',
            currentInterviewStep: 'Technical Round',
            averageScore: 85,
            totalInterviews: 2
        });
        expect(result[1]).toEqual({
            id: 2,
            fullName: 'Carlos Rodríguez',
            currentInterviewStep: 'HR Interview',
            averageScore: 75,
            totalInterviews: 1
        });
    });

    it('should return empty array when position has no candidates', async () => {
        mockPrismaClient.position.findUnique.mockResolvedValue({ id: 2, title: 'Empty Position' });
        mockPrismaClient.application.findMany.mockResolvedValue([]);

        const result = await getPositionCandidates(2);

        expect(result).toEqual([]);
    });

    it('should throw NOT_FOUND error when position does not exist', async () => {
        mockPrismaClient.position.findUnique.mockResolvedValue(null);

        await expect(getPositionCandidates(999)).rejects.toThrow('Position not found');
    });

    it('should calculate averageScore correctly with decimal rounding', async () => {
        mockPrismaClient.position.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaClient.application.findMany.mockResolvedValue([
            {
                id: 1,
                positionId: 1,
                candidate: {
                    id: 1,
                    firstName: 'John',
                    lastName: 'Doe'
                },
                interviewStep: {
                    name: 'Round 1'
                },
                interviews: [
                    { score: 85 },
                    { score: 90 },
                    { score: 87 }
                ],
                applicationDate: new Date()
            }
        ]);

        const result = await getPositionCandidates(1);

        // (85 + 90 + 87) / 3 = 262 / 3 = 87.333... ≈ 87.3
        expect(result[0].averageScore).toBe(87.3);
    });

    it('should handle candidates with no interviews', async () => {
        mockPrismaClient.position.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaClient.application.findMany.mockResolvedValue([
            {
                id: 1,
                positionId: 1,
                candidate: {
                    id: 1,
                    firstName: 'Jane',
                    lastName: 'Smith'
                },
                interviewStep: {
                    name: 'Applied'
                },
                interviews: [],
                applicationDate: new Date()
            }
        ]);

        const result = await getPositionCandidates(1);

        expect(result[0]).toEqual({
            id: 1,
            fullName: 'Jane Smith',
            currentInterviewStep: 'Applied',
            averageScore: null,
            totalInterviews: 0
        });
    });

    it('should order candidates by applicationDate descending', async () => {
        mockPrismaClient.position.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaClient.application.findMany.mockResolvedValue([
            {
                id: 1,
                positionId: 1,
                candidate: { id: 1, firstName: 'First', lastName: 'Candidate' },
                interviewStep: { name: 'Round 1' },
                interviews: [],
                applicationDate: new Date('2026-03-01')
            },
            {
                id: 2,
                positionId: 1,
                candidate: { id: 2, firstName: 'Second', lastName: 'Candidate' },
                interviewStep: { name: 'Round 1' },
                interviews: [],
                applicationDate: new Date('2026-03-02')
            }
        ]);

        await getPositionCandidates(1);

        expect(mockPrismaClient.application.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { applicationDate: 'desc' }
            })
        );
    });
});

describe('candidateService.updateCandidateStage', () => {
    let mockPrismaClient: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrismaClient = {
            candidate: {
                findUnique: jest.fn()
            },
            interviewStep: {
                findFirst: jest.fn(),
                findMany: jest.fn()
            },
            application: {
                findFirst: jest.fn(),
                update: jest.fn()
            },
            $disconnect: jest.fn()
        };
        (PrismaClient as jest.Mock).mockImplementation(() => mockPrismaClient);
    });

    it('should update candidate stage to a valid stage', async () => {
        mockPrismaClient.candidate.findUnique.mockResolvedValue({ id: 1, firstName: 'John' });
        mockPrismaClient.interviewStep.findFirst.mockResolvedValue({ id: 2, name: 'Technical Round' });
        mockPrismaClient.application.findFirst.mockResolvedValue({
            id: 100,
            candidateId: 1,
            positionId: 1,
            applicationDate: new Date('2026-01-01'),
            interviewStep: { name: 'Initial Screening' }
        });
        mockPrismaClient.application.update.mockResolvedValue({
            id: 100,
            candidateId: 1,
            positionId: 1,
            currentInterviewStep: 2,
            interviewStep: { name: 'Technical Round' }
        });

        const result = await updateCandidateStage(1, 'Technical Round', undefined, 'user-123');

        expect(result).toEqual({
            id: 100,
            candidateId: 1,
            positionId: 1,
            currentInterviewStep: 'Technical Round',
            previousInterviewStep: 'Initial Screening',
            status: 'in_progress',
            movedAt: expect.any(String),
            movedBy: 'user-123'
        });
    });

    it('should throw NOT_FOUND when candidate does not exist', async () => {
        mockPrismaClient.candidate.findUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(999, 'Technical Round')).rejects.toThrow('Candidate not found');
    });

    it('should throw INVALID_STAGE error with valid stages list', async () => {
        mockPrismaClient.candidate.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaClient.interviewStep.findFirst.mockResolvedValue(null);
        mockPrismaClient.interviewStep.findMany.mockResolvedValue([
            { name: 'Initial Screening' },
            { name: 'Technical Round' },
            { name: 'HR Interview' }
        ]);

        const error = await updateCandidateStage(1, 'Invalid Stage').catch(e => e);

        expect(error.message).toBe('Invalid interview stage');
        expect((error as any).validStages).toEqual([
            'Initial Screening',
            'Technical Round',
            'HR Interview'
        ]);
    });

    it('should throw NO_APPLICATION when candidate has no application', async () => {
        mockPrismaClient.candidate.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaClient.interviewStep.findFirst.mockResolvedValue({ id: 2, name: 'Technical Round' });
        mockPrismaClient.application.findFirst.mockResolvedValue(null);

        await expect(updateCandidateStage(1, 'Technical Round')).rejects.toThrow('Candidate has no application');
    });

    it('should only update the application for the specified positionId', async () => {
        mockPrismaClient.candidate.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaClient.interviewStep.findFirst.mockResolvedValue({ id: 2, name: 'Technical Round' });
        mockPrismaClient.application.findFirst.mockResolvedValue({
            id: 50,
            candidateId: 1,
            positionId: 5,
            interviewStep: { name: 'Initial Screening' }
        });
        mockPrismaClient.application.update.mockResolvedValue({
            id: 50,
            candidateId: 1,
            positionId: 5,
            currentInterviewStep: 2,
            interviewStep: { name: 'Technical Round' }
        });

        await updateCandidateStage(1, 'Technical Round', 5, 'user-123');

        expect(mockPrismaClient.application.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    candidateId: 1,
                    positionId: 5
                }
            })
        );
    });

    it('should use system as default userId', async () => {
        mockPrismaClient.candidate.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaClient.interviewStep.findFirst.mockResolvedValue({ id: 2, name: 'Technical Round' });
        mockPrismaClient.application.findFirst.mockResolvedValue({
            id: 100,
            candidateId: 1,
            positionId: 1,
            interviewStep: { name: 'Initial Screening' }
        });
        mockPrismaClient.application.update.mockResolvedValue({
            id: 100,
            candidateId: 1,
            positionId: 1,
            currentInterviewStep: 2,
            interviewStep: { name: 'Technical Round' }
        });

        const result = await updateCandidateStage(1, 'Technical Round');

        expect(result.movedBy).toBe('system');
    });

    it('should include previousInterviewStep in response', async () => {
        mockPrismaClient.candidate.findUnique.mockResolvedValue({ id: 1 });
        mockPrismaClient.interviewStep.findFirst.mockResolvedValue({ id: 3, name: 'Final Round' });
        mockPrismaClient.application.findFirst.mockResolvedValue({
            id: 100,
            candidateId: 1,
            positionId: 1,
            interviewStep: { name: 'HR Interview' }
        });
        mockPrismaClient.application.update.mockResolvedValue({
            id: 100,
            candidateId: 1,
            positionId: 1,
            currentInterviewStep: 3,
            interviewStep: { name: 'Final Round' }
        });

        const result = await updateCandidateStage(1, 'Final Round');

        expect(result.previousInterviewStep).toBe('HR Interview');
    });
});
