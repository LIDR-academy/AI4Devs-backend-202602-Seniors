import { updateCandidateStage } from '../application/services/candidateStageService';

const mockPrisma = {
    position: { findUnique: jest.fn() },
    candidate: { findUnique: jest.fn() },
    application: { findFirst: jest.fn(), update: jest.fn() },
};

const positionWithSteps = () => ({
    id: 1,
    interviewFlow: {
        interviewSteps: [{ id: 1 }, { id: 2 }],
    },
});

const candidateRecord = () => ({ id: 100 });

const applicationRecord = () => ({
    id: 10,
    positionId: 1,
    candidateId: 100,
    currentInterviewStep: 1,
});

beforeEach(() => jest.resetAllMocks());

describe('updateCandidateStage', () => {
    it('updates currentInterviewStep and returns the updated application', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findFirst.mockResolvedValue(applicationRecord());
        mockPrisma.application.update.mockResolvedValue({
            id: 10,
            positionId: 1,
            candidateId: 100,
            currentInterviewStep: 2,
        });

        const result = await updateCandidateStage(1, 100, 2, mockPrisma as any);

        expect(result).toMatchObject({
            applicationId: 10,
            positionId: 1,
            candidateId: 100,
            currentInterviewStep: 2,
        });
        expect(mockPrisma.application.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: { currentInterviewStep: 2 },
        });
    });

    it('is idempotent when moving to the same step', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findFirst.mockResolvedValue(applicationRecord());
        mockPrisma.application.update.mockResolvedValue({
            id: 10,
            positionId: 1,
            candidateId: 100,
            currentInterviewStep: 1,
        });

        const result = await updateCandidateStage(1, 100, 1, mockPrisma as any);

        expect(result.currentInterviewStep).toBe(1);
        expect(mockPrisma.application.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: { currentInterviewStep: 1 },
        });
    });

    it('throws NOT_FOUND (404) when position does not exist', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(9999, 100, 2, mockPrisma as any)).rejects.toMatchObject({
            code: 'NOT_FOUND',
            statusCode: 404,
            message: 'Position not found',
        });
        expect(mockPrisma.application.findFirst).not.toHaveBeenCalled();
        expect(mockPrisma.candidate.findUnique).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND (404) with "Candidate not found" when no application and candidate does not exist', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findFirst.mockResolvedValue(null);
        mockPrisma.candidate.findUnique.mockResolvedValue(null);

        await expect(updateCandidateStage(1, 9999, 2, mockPrisma as any)).rejects.toMatchObject({
            code: 'NOT_FOUND',
            statusCode: 404,
            message: 'Candidate not found',
        });
        expect(mockPrisma.application.update).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND (404) with "Application not found" when candidate exists but has no application for this position', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findFirst.mockResolvedValue(null);
        mockPrisma.candidate.findUnique.mockResolvedValue(candidateRecord());

        await expect(updateCandidateStage(1, 100, 2, mockPrisma as any)).rejects.toMatchObject({
            code: 'NOT_FOUND',
            statusCode: 404,
            message: 'Application not found for this candidate and position',
        });
        expect(mockPrisma.application.update).not.toHaveBeenCalled();
    });

    it('throws VALIDATION_ERROR (400) when target step does not belong to the position flow', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps()); // steps: 1, 2
        mockPrisma.application.findFirst.mockResolvedValue(applicationRecord());

        await expect(updateCandidateStage(1, 100, 99, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.application.update).not.toHaveBeenCalled();
    });

    it('throws VALIDATION_ERROR (400) when positionId is zero', async () => {
        await expect(updateCandidateStage(0, 100, 2, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });

    it('throws VALIDATION_ERROR (400) when positionId is negative', async () => {
        await expect(updateCandidateStage(-1, 100, 2, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });

    it('throws VALIDATION_ERROR (400) when candidateId is NaN', async () => {
        await expect(updateCandidateStage(1, NaN, 2, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });

    it('throws VALIDATION_ERROR (400) when candidateId is negative', async () => {
        await expect(updateCandidateStage(1, -5, 2, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });

    it('throws VALIDATION_ERROR (400) when currentInterviewStep is zero', async () => {
        await expect(updateCandidateStage(1, 100, 0, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });

    it('throws VALIDATION_ERROR (400) when currentInterviewStep is negative', async () => {
        await expect(updateCandidateStage(1, 100, -3, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });
});
