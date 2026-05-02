// Mock domain models first — they call `new PrismaClient()` at import time
// Without these mocks, multiple PrismaClient instances pollute mock.results
jest.mock('../../domain/models/Candidate', () => ({ Candidate: class {} }));
jest.mock('../../domain/models/Education', () => ({ Education: class {} }));
jest.mock('../../domain/models/WorkExperience', () => ({ WorkExperience: class {} }));
jest.mock('../../domain/models/Resume', () => ({ Resume: class {} }));
jest.mock('../../application/validator', () => ({ validateCandidateData: jest.fn() }));

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => ({
        candidate: { findUnique: jest.fn() },
        application: { findFirst: jest.fn(), update: jest.fn() },
        interviewStep: { findUnique: jest.fn() },
    })),
}));

import { updateCandidateStage } from '../../application/services/candidateService';
import { PrismaClient } from '@prisma/client';

// candidateService is the only remaining caller of `new PrismaClient()` after mocks
const MockedPrisma = PrismaClient as jest.MockedClass<typeof PrismaClient>;
const prismaInstance = MockedPrisma.mock.results[0].value;
const mockCandidate: jest.Mock = prismaInstance.candidate.findUnique;
const mockApplicationFindFirst: jest.Mock = prismaInstance.application.findFirst;
const mockApplicationUpdate: jest.Mock = prismaInstance.application.update;
const mockInterviewStep: jest.Mock = prismaInstance.interviewStep.findUnique;

describe('updateCandidateStage', () => {
    beforeEach(() => {
        mockCandidate.mockClear();
        mockApplicationFindFirst.mockClear();
        mockApplicationUpdate.mockClear();
        mockInterviewStep.mockClear();
    });

    it('throws "Candidate not found" when candidate does not exist', async () => {
        mockCandidate.mockResolvedValue(null);
        await expect(updateCandidateStage(99, 1, 1)).rejects.toThrow('Candidate not found');
    });

    it('throws "Application not found for this candidate" when application does not belong to candidate', async () => {
        mockCandidate.mockResolvedValue({ id: 1 });
        mockApplicationFindFirst.mockResolvedValue(null);
        await expect(updateCandidateStage(1, 99, 1)).rejects.toThrow('Application not found for this candidate');
    });

    it('throws "Invalid interview step" when step does not exist', async () => {
        mockCandidate.mockResolvedValue({ id: 1 });
        mockApplicationFindFirst.mockResolvedValue({ id: 1, candidateId: 1 });
        mockInterviewStep.mockResolvedValue(null);
        await expect(updateCandidateStage(1, 1, 99)).rejects.toThrow('Invalid interview step');
    });

    it('returns updated application on success', async () => {
        mockCandidate.mockResolvedValue({ id: 1 });
        mockApplicationFindFirst.mockResolvedValue({ id: 1, candidateId: 1 });
        mockInterviewStep.mockResolvedValue({ id: 2 });
        mockApplicationUpdate.mockResolvedValue({ id: 1, candidateId: 1, currentInterviewStep: 2 });

        const result = await updateCandidateStage(1, 1, 2);
        expect(result).toEqual({ id: 1, candidateId: 1, currentInterviewStep: 2 });
    });

    it('calls application.update with correct arguments', async () => {
        mockCandidate.mockResolvedValue({ id: 3 });
        mockApplicationFindFirst.mockResolvedValue({ id: 5, candidateId: 3 });
        mockInterviewStep.mockResolvedValue({ id: 4 });
        mockApplicationUpdate.mockResolvedValue({ id: 5, candidateId: 3, currentInterviewStep: 4 });

        await updateCandidateStage(3, 5, 4);

        expect(mockApplicationUpdate).toHaveBeenCalledWith({
            where: { id: 5 },
            data: { currentInterviewStep: 4 },
            select: { id: true, candidateId: true, currentInterviewStep: true },
        });
    });
});
