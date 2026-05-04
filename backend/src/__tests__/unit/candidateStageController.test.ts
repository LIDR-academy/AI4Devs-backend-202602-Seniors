import { Request, Response } from 'express';
import { updateCandidateStageController } from '../../presentation/controllers/candidateStageController';
import { updateCandidateStage } from '../../application/services/candidateStageService';

jest.mock('../../application/services/candidateStageService');

describe('CandidateStageController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRequest = {
            params: { id: '1' },
            body: { stageId: 2 },
        };
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
        jest.clearAllMocks();
    });

    describe('updateCandidateStageController', () => {
        it('returns 200 with updated application on success', async () => {
            const mockApplication = {
                id: 1,
                positionId: 1,
                candidateId: 1,
                currentInterviewStep: 2,
            };
            (updateCandidateStage as jest.Mock).mockResolvedValue(mockApplication);

            await updateCandidateStageController(mockRequest as Request, mockResponse as Response);

            expect(updateCandidateStage).toHaveBeenCalledWith(1, 2);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockApplication);
        });

        it('returns 400 when candidate ID is invalid', async () => {
            mockRequest.params = { id: 'invalid' };

            await updateCandidateStageController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid candidate ID format' });
        });

        it('returns 400 when stage ID is invalid', async () => {
            mockRequest.body = { stageId: 'invalid' };

            await updateCandidateStageController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid stage ID format' });
        });

        it('returns 404 when candidate not found', async () => {
            (updateCandidateStage as jest.Mock).mockRejectedValue(new Error('Candidate not found'));

            await updateCandidateStageController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Candidate not found' });
        });

        it('returns 404 when no application found', async () => {
            (updateCandidateStage as jest.Mock).mockRejectedValue(new Error('No application found for this candidate'));

            await updateCandidateStageController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'No application found for this candidate' });
        });

        it('returns 400 when stage not found', async () => {
            (updateCandidateStage as jest.Mock).mockRejectedValue(new Error('Interview stage not found'));

            await updateCandidateStageController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Interview stage not found' });
        });

        it('returns 400 when stage is invalid for position', async () => {
            (updateCandidateStage as jest.Mock).mockRejectedValue(new Error('Invalid stage for this position'));

            await updateCandidateStageController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid stage for this position' });
        });

        it('returns 500 on unknown error', async () => {
            (updateCandidateStage as jest.Mock).mockRejectedValue(new Error('Unknown error'));

            await updateCandidateStageController(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal Server Error' });
        });
    });
});
