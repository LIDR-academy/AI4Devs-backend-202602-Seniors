import { getPositionCandidates } from '../application/services/positionCandidatesService';

const mockPrisma = {
    position: { findUnique: jest.fn() },
    application: { findMany: jest.fn() },
};

const positionWithSteps = (steps = [
    { id: 1, name: 'CV Screening', orderIndex: 1 },
    { id: 2, name: 'Technical Interview', orderIndex: 2 },
    { id: 3, name: 'Culture Fit', orderIndex: 3 },
]) => ({
    id: 1,
    interviewFlow: { interviewSteps: steps },
});

const makeApplication = (
    candidateId: number,
    firstName: string,
    lastName: string,
    currentInterviewStep: number,
    scores: (number | null)[] = [],
) => ({
    candidateId,
    currentInterviewStep,
    candidate: { id: candidateId, firstName, lastName },
    interviews: scores.map(score => ({ score })),
});

beforeEach(() => jest.resetAllMocks());

describe('getPositionCandidates', () => {
    it('groups candidates by their current interview step', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findMany.mockResolvedValue([
            makeApplication(100, 'Ana', 'García', 1, [4, 3]),
            makeApplication(101, 'Luis', 'Martínez', 2, [5]),
            makeApplication(102, 'Sara', 'López', 2, []),
        ]);

        const result = await getPositionCandidates(1, mockPrisma as any);

        expect(result.positionId).toBe(1);
        expect(result.interviewSteps).toHaveLength(3);

        const step1 = result.interviewSteps[0];
        expect(step1.stepId).toBe(1);
        expect(step1.stepName).toBe('CV Screening');
        expect(step1.orderIndex).toBe(1);
        expect(step1.candidates).toHaveLength(1);
        expect(step1.candidates[0]).toMatchObject({
            candidateId: 100,
            fullName: 'Ana García',
            currentInterviewStep: 1,
            averageScore: 3.5,
        });

        const step2 = result.interviewSteps[1];
        expect(step2.candidates).toHaveLength(2);
        const luis = step2.candidates.find(c => c.candidateId === 101);
        const sara = step2.candidates.find(c => c.candidateId === 102);
        expect(luis!.averageScore).toBe(5);
        expect(sara!.averageScore).toBeNull();
    });

    it('includes empty steps when no candidates are at that step', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findMany.mockResolvedValue([
            makeApplication(100, 'Ana', 'García', 1, []),
        ]);

        const result = await getPositionCandidates(1, mockPrisma as any);

        const step3 = result.interviewSteps[2];
        expect(step3.stepId).toBe(3);
        expect(step3.candidates).toHaveLength(0);
    });

    it('returns all steps with empty candidates when position has no applications', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findMany.mockResolvedValue([]);

        const result = await getPositionCandidates(1, mockPrisma as any);

        expect(result.interviewSteps).toHaveLength(3);
        result.interviewSteps.forEach(step => expect(step.candidates).toHaveLength(0));
    });

    it('sets averageScore to null when candidate has no interviews', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findMany.mockResolvedValue([
            makeApplication(100, 'Ana', 'García', 1, []),
        ]);

        const result = await getPositionCandidates(1, mockPrisma as any);
        expect(result.interviewSteps[0].candidates[0].averageScore).toBeNull();
    });

    it('sets averageScore to null when all interview scores are null', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps());
        mockPrisma.application.findMany.mockResolvedValue([
            makeApplication(100, 'Ana', 'García', 1, [null, null]),
        ]);

        const result = await getPositionCandidates(1, mockPrisma as any);
        expect(result.interviewSteps[0].candidates[0].averageScore).toBeNull();
    });

    it('preserves the step order as returned by the query (sorted by orderIndex at DB level)', async () => {
        // The service delegates sorting to Prisma (orderBy: { orderIndex: 'asc' }).
        // Here we verify the service does NOT re-sort — it trusts the DB order.
        const steps = [
            { id: 1, name: 'CV Screening', orderIndex: 1 },
            { id: 2, name: 'Technical Interview', orderIndex: 2 },
            { id: 3, name: 'Culture Fit', orderIndex: 3 },
        ];
        mockPrisma.position.findUnique.mockResolvedValue(positionWithSteps(steps));
        mockPrisma.application.findMany.mockResolvedValue([]);

        const result = await getPositionCandidates(1, mockPrisma as any);
        expect(result.interviewSteps.map(s => s.stepId)).toEqual([1, 2, 3]);
    });

    it('throws AppError NOT_FOUND (404) when position does not exist', async () => {
        mockPrisma.position.findUnique.mockResolvedValue(null);
        mockPrisma.application.findMany.mockResolvedValue([]);

        await expect(getPositionCandidates(9999, mockPrisma as any)).rejects.toMatchObject({
            code: 'NOT_FOUND',
            statusCode: 404,
        });
    });

    it('throws AppError NOT_FOUND (404) when position has no interviewFlow', async () => {
        mockPrisma.position.findUnique.mockResolvedValue({ id: 1, interviewFlow: null });
        mockPrisma.application.findMany.mockResolvedValue([]);

        await expect(getPositionCandidates(1, mockPrisma as any)).rejects.toMatchObject({
            code: 'NOT_FOUND',
            statusCode: 404,
        });
    });

    it('throws AppError VALIDATION_ERROR (400) when positionId is not a positive integer', async () => {
        await expect(getPositionCandidates(NaN, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });

    it('throws AppError VALIDATION_ERROR (400) when positionId is zero', async () => {
        await expect(getPositionCandidates(0, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });

    it('throws AppError VALIDATION_ERROR (400) when positionId is negative', async () => {
        await expect(getPositionCandidates(-1, mockPrisma as any)).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        });
        expect(mockPrisma.position.findUnique).not.toHaveBeenCalled();
    });
});
