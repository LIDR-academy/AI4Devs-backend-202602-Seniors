import request from 'supertest';
import { app } from '../../index';
import { getPositionCandidates, getPositionInterviewSteps } from '../../application/services/positionService';

jest.mock('../../application/services/positionService');

const mockGetPositionCandidates = getPositionCandidates as jest.MockedFunction<typeof getPositionCandidates>;
const mockGetPositionInterviewSteps = getPositionInterviewSteps as jest.MockedFunction<typeof getPositionInterviewSteps>;

describe('GET /positions/:id/candidates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 with candidates array', async () => {
        const candidates = [
            { candidateId: 1, applicationId: 10, fullName: 'John Doe', currentInterviewStep: 'HR Screen', currentInterviewStepId: 1, averageScore: null },
        ];
        mockGetPositionCandidates.mockResolvedValue(candidates);

        const res = await request(app).get('/positions/1/candidates');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(candidates);
    });

    it('returns 400 when id is non-numeric', async () => {
        const res = await request(app).get('/positions/abc/candidates');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('returns 404 when position not found', async () => {
        mockGetPositionCandidates.mockResolvedValue(null);

        const res = await request(app).get('/positions/999/candidates');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Position not found');
    });

    it('returns 500 on unexpected service error', async () => {
        mockGetPositionCandidates.mockRejectedValue(new Error('DB failure'));

        const res = await request(app).get('/positions/1/candidates');
        expect(res.status).toBe(500);
    });
});

describe('GET /positions/:id/interviewSteps', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 with steps array', async () => {
        const steps = [
            { id: 1, name: 'HR Screen', orderIndex: 1, interviewType: 'HR Screen' },
            { id: 2, name: 'Technical Screen', orderIndex: 2, interviewType: 'Technical Screen' },
        ];
        mockGetPositionInterviewSteps.mockResolvedValue(steps);

        const res = await request(app).get('/positions/1/interviewSteps');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(steps);
    });

    it('returns 400 when id is non-numeric', async () => {
        const res = await request(app).get('/positions/xyz/interviewSteps');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('returns 404 when position not found', async () => {
        mockGetPositionInterviewSteps.mockResolvedValue(null);

        const res = await request(app).get('/positions/999/interviewSteps');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Position not found');
    });
});
