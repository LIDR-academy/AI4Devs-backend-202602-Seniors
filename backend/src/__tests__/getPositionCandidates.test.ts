jest.mock('@prisma/client', () => {
    const mockReturnValue = {
        position: { findUnique: jest.fn() },
        application: { findMany: jest.fn() },
    };
    return {
        PrismaClient: jest.fn().mockReturnValue(mockReturnValue),
    };
});

import { PrismaClient } from '@prisma/client';
import { getCandidatesInProcessController } from '../presentation/controllers/positionController';

const prismaMock = new PrismaClient() as any;

const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /positions/:id/candidates', () => {
    it('returns 400 when :id is not a valid integer', async () => {
        const req = { params: { id: 'abc' } } as any;
        const res = makeRes();

        await getCandidatesInProcessController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid position ID format' });
    });

    it('returns 404 when position does not exist', async () => {
        prismaMock.position.findUnique.mockResolvedValue(null);
        const req = { params: { id: '99' } } as any;
        const res = makeRes();

        await getCandidatesInProcessController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Position not found' });
    });

    it('happy path: returns CandidateInProcessDTO list with correct fullName, step and averageScore', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.application.findMany.mockResolvedValue([
            {
                currentInterviewStep: 2,
                candidate: { firstName: 'John', lastName: 'Doe' },
                interviews: [{ score: 8 }, { score: 6 }],
            },
        ]);
        const req = { params: { id: '1' } } as any;
        const res = makeRes();

        await getCandidatesInProcessController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([
            { fullName: 'John Doe', currentInterviewStep: 2, averageScore: 7 },
        ]);
    });

    it('returns empty array when position exists but has no applications', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.application.findMany.mockResolvedValue([]);
        const req = { params: { id: '1' } } as any;
        const res = makeRes();

        await getCandidatesInProcessController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns averageScore = null when candidate has applications but no interviews yet', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.application.findMany.mockResolvedValue([
            {
                currentInterviewStep: 1,
                candidate: { firstName: 'Jane', lastName: 'Smith' },
                interviews: [],
            },
        ]);
        const req = { params: { id: '1' } } as any;
        const res = makeRes();

        await getCandidatesInProcessController(req, res);

        expect(res.json).toHaveBeenCalledWith([
            { fullName: 'Jane Smith', currentInterviewStep: 1, averageScore: null },
        ]);
    });

    it('excludes null scores from averageScore calculation', async () => {
        prismaMock.position.findUnique.mockResolvedValue({ id: 1 });
        prismaMock.application.findMany.mockResolvedValue([
            {
                currentInterviewStep: 3,
                candidate: { firstName: 'Carlos', lastName: 'López' },
                interviews: [{ score: 8 }, { score: null }, { score: 4 }],
            },
        ]);
        const req = { params: { id: '1' } } as any;
        const res = makeRes();

        await getCandidatesInProcessController(req, res);

        expect(res.json).toHaveBeenCalledWith([
            { fullName: 'Carlos López', currentInterviewStep: 3, averageScore: 6 },
        ]);
    });
});
