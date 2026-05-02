import request from 'supertest';
import { app } from '../../index';
import { updateCandidateStage } from '../../application/services/candidateService';

jest.mock('../../application/services/candidateService', () => ({
    ...jest.requireActual('../../application/services/candidateService'),
    updateCandidateStage: jest.fn(),
}));

const mockUpdateCandidateStage = updateCandidateStage as jest.MockedFunction<typeof updateCandidateStage>;

const validBody = { applicationId: 1, currentInterviewStep: 2 };

describe('PUT /candidates/:id/stage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 200 with updated application on success', async () => {
        mockUpdateCandidateStage.mockResolvedValue({ id: 1, candidateId: 1, currentInterviewStep: 2 });

        const res = await request(app).put('/candidates/1/stage').send(validBody);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: 1, candidateId: 1, currentInterviewStep: 2 });
    });

    it('returns 400 when candidateId is non-numeric', async () => {
        const res = await request(app).put('/candidates/abc/stage').send(validBody);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid candidate ID format');
    });

    it('returns 400 when applicationId is missing', async () => {
        const res = await request(app).put('/candidates/1/stage').send({ currentInterviewStep: 2 });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid or missing applicationId');
    });

    it('returns 400 when currentInterviewStep is missing', async () => {
        const res = await request(app).put('/candidates/1/stage').send({ applicationId: 1 });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid or missing currentInterviewStep');
    });

    it('returns 400 when applicationId is not an integer', async () => {
        const res = await request(app).put('/candidates/1/stage').send({ applicationId: 'x', currentInterviewStep: 2 });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid or missing applicationId');
    });

    it('returns 404 when candidate not found', async () => {
        mockUpdateCandidateStage.mockRejectedValue(new Error('Candidate not found'));

        const res = await request(app).put('/candidates/99/stage').send(validBody);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Candidate not found');
    });

    it('returns 404 when application does not belong to candidate', async () => {
        mockUpdateCandidateStage.mockRejectedValue(new Error('Application not found for this candidate'));

        const res = await request(app).put('/candidates/1/stage').send(validBody);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Application not found for this candidate');
    });

    it('returns 400 when interview step is invalid', async () => {
        mockUpdateCandidateStage.mockRejectedValue(new Error('Invalid interview step'));

        const res = await request(app).put('/candidates/1/stage').send(validBody);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid interview step');
    });

    it('returns 500 on unexpected error', async () => {
        mockUpdateCandidateStage.mockRejectedValue(new Error('Unexpected DB crash'));

        const res = await request(app).put('/candidates/1/stage').send(validBody);
        expect(res.status).toBe(500);
    });
});
