import express from 'express';
import request from 'supertest';
import candidateRoutes from '../candidateRoutes';
import { CandidateServiceError, updateCandidateInterviewStep } from '../../application/services/candidateService';

jest.mock('../../application/services/candidateService', () => {
    const actual = jest.requireActual('../../application/services/candidateService');
    return {
        ...actual,
        addCandidate: jest.fn(),
        findCandidateById: jest.fn(),
        updateCandidateInterviewStep: jest.fn(),
    };
});

describe('PUT /candidates/:id/stage', () => {
    const updateCandidateInterviewStepMock =
        updateCandidateInterviewStep as jest.MockedFunction<typeof updateCandidateInterviewStep>;

    const createApp = () => {
        const app = express();
        app.use(express.json());
        app.use('/candidates', candidateRoutes);
        return app;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 with updated application payload', async () => {
        const app = createApp();
        const updatedApplication = {
            id: 12,
            candidateId: 3,
            positionId: 5,
            currentInterviewStep: 5,
            applicationDate: new Date('2026-04-29T10:00:00.000Z'),
            notes: null,
        };

        updateCandidateInterviewStepMock.mockResolvedValue(updatedApplication as any);

        const response = await request(app)
            .put('/candidates/3/stage')
            .send({ positionId: 5, interviewStepId: 5 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'Application updated successfully',
            data: {
                ...updatedApplication,
                applicationDate: '2026-04-29T10:00:00.000Z',
            },
        });
        expect(updateCandidateInterviewStepMock).toHaveBeenCalledWith(3, 5, 5);
    });

    it('returns 400 for invalid candidate id', async () => {
        const app = createApp();

        const response = await request(app)
            .put('/candidates/abc/stage')
            .send({ positionId: 5, interviewStepId: 5 });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid ID format' });
        expect(updateCandidateInterviewStepMock).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid body fields', async () => {
        const app = createApp();

        const response = await request(app)
            .put('/candidates/3/stage')
            .send({ positionId: 5, interviewStepId: 0 });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Invalid positionId or interviewStepId format' });
        expect(updateCandidateInterviewStepMock).not.toHaveBeenCalled();
    });

    it('returns 404 for missing records', async () => {
        const app = createApp();
        updateCandidateInterviewStepMock.mockRejectedValue(new CandidateServiceError('Application not found', 404));

        const response = await request(app)
            .put('/candidates/3/stage')
            .send({ positionId: 5, interviewStepId: 5 });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Application not found' });
    });

    it('returns 409 for interview flow mismatch', async () => {
        const app = createApp();
        updateCandidateInterviewStepMock.mockRejectedValue(
            new CandidateServiceError('Interview step does not belong to the position interview flow', 409),
        );

        const response = await request(app)
            .put('/candidates/3/stage')
            .send({ positionId: 5, interviewStepId: 5 });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'Interview step does not belong to the position interview flow' });
    });

    it('returns 500 for unexpected failures', async () => {
        const app = createApp();
        updateCandidateInterviewStepMock.mockRejectedValue(new Error('unexpected failure'));

        const response = await request(app)
            .put('/candidates/3/stage')
            .send({ positionId: 5, interviewStepId: 5 });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
});
