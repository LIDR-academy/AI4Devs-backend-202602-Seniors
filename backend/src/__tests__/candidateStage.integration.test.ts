import request from 'supertest';
import { app } from '../index';
import { AppError } from '../application/errors';
import * as candidateStageService from '../application/services/candidateStageService';

jest.mock('../application/services/candidateStageService');

const mockUpdateCandidateStage = candidateStageService.updateCandidateStage as jest.MockedFunction<
    typeof candidateStageService.updateCandidateStage
>;

// positionId (3) and candidateId (100) are intentionally different to catch argument-order bugs
const POSITION_ID = 3;
const CANDIDATE_ID = 100;
const STEP_ID = 2;

const sampleResult: candidateStageService.UpdatedApplicationResult = {
    applicationId: 10,
    candidateId: CANDIDATE_ID,
    positionId: POSITION_ID,
    currentInterviewStep: STEP_ID,
};

const validBody = { candidateId: CANDIDATE_ID, currentInterviewStep: STEP_ID };

beforeEach(() => jest.resetAllMocks());

describe('PUT /candidates/:id/stage', () => {
    it('returns 200 with updated application data on success', async () => {
        mockUpdateCandidateStage.mockResolvedValue(sampleResult);

        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send(validBody);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ data: sampleResult });
        expect(mockUpdateCandidateStage).toHaveBeenCalledWith(
            POSITION_ID,
            CANDIDATE_ID,
            STEP_ID,
            expect.anything(),
        );
    });

    it('returns 404 when position is not found', async () => {
        mockUpdateCandidateStage.mockRejectedValue(
            new AppError('NOT_FOUND', 'Position not found', 404),
        );

        const response = await request(app)
            .put('/candidates/9999/stage')
            .send(validBody);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: { code: 'NOT_FOUND', message: 'Position not found' },
        });
    });

    it('returns 404 when candidate is not found', async () => {
        mockUpdateCandidateStage.mockRejectedValue(
            new AppError('NOT_FOUND', 'Candidate not found', 404),
        );

        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send({ candidateId: 9999, currentInterviewStep: STEP_ID });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: { code: 'NOT_FOUND', message: 'Candidate not found' },
        });
    });

    it('returns 404 when no application exists for the candidate+position pair', async () => {
        mockUpdateCandidateStage.mockRejectedValue(
            new AppError('NOT_FOUND', 'Application not found for this candidate and position', 404),
        );

        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send({ candidateId: 200, currentInterviewStep: STEP_ID });

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
            error: { code: 'NOT_FOUND', message: 'Application not found for this candidate and position' },
        });
    });

    it('returns 400 when target step does not belong to the position flow', async () => {
        mockUpdateCandidateStage.mockRejectedValue(
            new AppError(
                'VALIDATION_ERROR',
                "The interview step does not belong to this position's interview flow",
                400,
            ),
        );

        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send({ candidateId: CANDIDATE_ID, currentInterviewStep: 99 });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: {
                code: 'VALIDATION_ERROR',
                message: "The interview step does not belong to this position's interview flow",
            },
        });
    });

    it('returns 400 when candidateId is missing from body', async () => {
        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send({ currentInterviewStep: STEP_ID });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
        expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    });

    it('returns 400 when currentInterviewStep is missing from body', async () => {
        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send({ candidateId: CANDIDATE_ID });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
        expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    });

    it('returns 400 when positionId path param is not a number', async () => {
        const response = await request(app)
            .put('/candidates/abc/stage')
            .send(validBody);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
        expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    });

    it('returns 400 when candidateId in body is a non-numeric string', async () => {
        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send({ candidateId: 'abc', currentInterviewStep: STEP_ID });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
        expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    });

    it('returns 400 when candidateId in body is zero', async () => {
        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send({ candidateId: 0, currentInterviewStep: STEP_ID });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
        expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    });

    it('returns 400 when candidateId in body is negative', async () => {
        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send({ candidateId: -1, currentInterviewStep: STEP_ID });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
        expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    });

    it('returns 500 on unexpected service error', async () => {
        mockUpdateCandidateStage.mockRejectedValue(new Error('Unexpected DB error'));

        const response = await request(app)
            .put(`/candidates/${POSITION_ID}/stage`)
            .send(validBody);

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({ error: { code: 'INTERNAL_ERROR' } });
    });
});
