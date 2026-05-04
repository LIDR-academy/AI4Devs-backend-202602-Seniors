import request from 'supertest';
import { app } from '../index';
import { AppError } from '../application/errors';
import * as positionCandidatesService from '../application/services/positionCandidatesService';

jest.mock('../application/services/positionCandidatesService');

const mockGetPositionCandidates = positionCandidatesService.getPositionCandidates as jest.MockedFunction<
    typeof positionCandidatesService.getPositionCandidates
>;

const sampleResult: positionCandidatesService.PositionCandidatesResult = {
    positionId: 1,
    interviewSteps: [
        {
            stepId: 1,
            stepName: 'CV Screening',
            orderIndex: 1,
            candidates: [
                { candidateId: 100, fullName: 'Ana García', currentInterviewStep: 1, averageScore: 3.5 },
            ],
        },
        {
            stepId: 2,
            stepName: 'Technical Interview',
            orderIndex: 2,
            candidates: [],
        },
    ],
};

beforeEach(() => jest.resetAllMocks());

describe('GET /positions/:id/candidates', () => {
    it('returns 200 with grouped candidates for a valid position', async () => {
        mockGetPositionCandidates.mockResolvedValue(sampleResult);

        const response = await request(app).get('/positions/1/candidates');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ data: sampleResult });
        expect(mockGetPositionCandidates).toHaveBeenCalledWith(1, expect.anything());
    });

    it('returns 200 with all empty steps when position has no applications', async () => {
        const emptyResult: positionCandidatesService.PositionCandidatesResult = {
            positionId: 2,
            interviewSteps: [
                { stepId: 1, stepName: 'CV Screening', orderIndex: 1, candidates: [] },
            ],
        };
        mockGetPositionCandidates.mockResolvedValue(emptyResult);

        const response = await request(app).get('/positions/2/candidates');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ data: emptyResult });
    });

    it('returns 404 with NOT_FOUND error when position does not exist', async () => {
        mockGetPositionCandidates.mockRejectedValue(
            new AppError('NOT_FOUND', 'Position not found', 404),
        );

        const response = await request(app).get('/positions/9999/candidates');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: { code: 'NOT_FOUND', message: 'Position not found' },
        });
    });

    it('returns 400 with VALIDATION_ERROR when positionId is not a number', async () => {
        const response = await request(app).get('/positions/abc/candidates');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: { code: 'VALIDATION_ERROR' },
        });
        expect(mockGetPositionCandidates).not.toHaveBeenCalled();
    });

    it('returns 400 when service throws a validation error', async () => {
        mockGetPositionCandidates.mockRejectedValue(
            new AppError('VALIDATION_ERROR', 'positionId must be a positive integer', 400),
        );

        const response = await request(app).get('/positions/0/candidates');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: { code: 'VALIDATION_ERROR', message: 'positionId must be a positive integer' },
        });
    });

    it('returns 500 on unexpected service error', async () => {
        mockGetPositionCandidates.mockRejectedValue(new Error('Unexpected DB error'));

        const response = await request(app).get('/positions/1/candidates');

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
            error: { code: 'INTERNAL_ERROR' },
        });
    });
});
