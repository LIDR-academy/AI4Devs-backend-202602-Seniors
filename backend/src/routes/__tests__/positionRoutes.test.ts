import express from 'express';
import request from 'supertest';
import positionRoutes from '../positionRoutes';
import { getCandidatesByPositionId, PositionServiceError } from '../../application/services/positionService';

jest.mock('../../application/services/positionService', () => {
    const actual = jest.requireActual('../../application/services/positionService');
    return {
        ...actual,
        getCandidatesByPositionId: jest.fn(),
    };
});

describe('GET /positions/:id/candidates', () => {
    const getCandidatesByPositionIdMock = getCandidatesByPositionId as jest.MockedFunction<typeof getCandidatesByPositionId>;

    const createApp = () => {
        const app = express();
        app.use(express.json());
        app.use('/positions', positionRoutes);
        return app;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 with candidate summaries', async () => {
        const app = createApp();
        const payload = [
            { fullName: 'Ana Alpha', currentInterviewStep: 1, averageScore: null },
            { fullName: 'Zoe Beta', currentInterviewStep: 2, averageScore: 80 },
        ];
        getCandidatesByPositionIdMock.mockResolvedValue(payload);

        const response = await request(app).get('/positions/5/candidates');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(payload);
        expect(getCandidatesByPositionIdMock).toHaveBeenCalledWith(5);
    });

    it('returns 400 for invalid id format', async () => {
        const app = createApp();

        const response = await request(app).get('/positions/abc/candidates');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid ID format' });
        expect(getCandidatesByPositionIdMock).not.toHaveBeenCalled();
    });

    it('returns 404 when position is not found', async () => {
        const app = createApp();
        getCandidatesByPositionIdMock.mockRejectedValue(new PositionServiceError('Position not found', 404));

        const response = await request(app).get('/positions/999/candidates');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Position not found' });
    });

    it('returns 500 for unexpected errors', async () => {
        const app = createApp();
        getCandidatesByPositionIdMock.mockRejectedValue(new Error('unexpected failure'));

        const response = await request(app).get('/positions/2/candidates');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
});
