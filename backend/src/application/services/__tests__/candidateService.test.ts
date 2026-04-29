import { CandidateServiceError, updateCandidateInterviewStep } from '../candidateService';
import { Candidate } from '../../../domain/models/Candidate';
import { Position } from '../../../domain/models/Position';
import { InterviewStep } from '../../../domain/models/InterviewStep';
import { Application } from '../../../domain/models/Application';

jest.mock('../../../domain/models/Candidate', () => ({
    Candidate: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../../domain/models/Position', () => ({
    Position: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../../domain/models/InterviewStep', () => ({
    InterviewStep: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../../domain/models/Application', () => ({
    Application: {
        findByCandidateAndPosition: jest.fn(),
        updateInterviewStep: jest.fn(),
    },
}));

describe('updateCandidateInterviewStep', () => {
    const findCandidateMock = Candidate.findOne as jest.MockedFunction<typeof Candidate.findOne>;
    const findPositionMock = Position.findOne as jest.MockedFunction<typeof Position.findOne>;
    const findInterviewStepMock = InterviewStep.findOne as jest.MockedFunction<typeof InterviewStep.findOne>;
    const findApplicationMock =
        Application.findByCandidateAndPosition as jest.MockedFunction<typeof Application.findByCandidateAndPosition>;
    const updateInterviewStepMock =
        Application.updateInterviewStep as jest.MockedFunction<typeof Application.updateInterviewStep>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 when candidate id is invalid', async () => {
        await expect(updateCandidateInterviewStep(0, 1, 1)).rejects.toEqual(
            expect.objectContaining<Partial<CandidateServiceError>>({
                message: 'Invalid candidate ID format',
                statusCode: 400,
            }),
        );
    });

    it('returns 400 when position id is invalid', async () => {
        await expect(updateCandidateInterviewStep(1, 0, 1)).rejects.toEqual(
            expect.objectContaining<Partial<CandidateServiceError>>({
                message: 'Invalid positionId format',
                statusCode: 400,
            }),
        );
    });

    it('returns 404 when candidate does not exist', async () => {
        findCandidateMock.mockResolvedValue(null);

        await expect(updateCandidateInterviewStep(1, 5, 2)).rejects.toEqual(
            expect.objectContaining<Partial<CandidateServiceError>>({
                message: 'Candidate not found',
                statusCode: 404,
            }),
        );
    });

    it('returns 404 when position does not exist', async () => {
        findCandidateMock.mockResolvedValue({ id: 1 } as any);
        findPositionMock.mockResolvedValue(null);

        await expect(updateCandidateInterviewStep(1, 5, 2)).rejects.toEqual(
            expect.objectContaining<Partial<CandidateServiceError>>({
                message: 'Position not found',
                statusCode: 404,
            }),
        );
    });

    it('returns 404 when interview step does not exist', async () => {
        findCandidateMock.mockResolvedValue({ id: 1 } as any);
        findPositionMock.mockResolvedValue({ id: 5, interviewFlowId: 10 } as any);
        findInterviewStepMock.mockResolvedValue(null);

        await expect(updateCandidateInterviewStep(1, 5, 2)).rejects.toEqual(
            expect.objectContaining<Partial<CandidateServiceError>>({
                message: 'Interview step not found',
                statusCode: 404,
            }),
        );
    });

    it('returns 409 when interview step belongs to another flow', async () => {
        findCandidateMock.mockResolvedValue({ id: 1 } as any);
        findPositionMock.mockResolvedValue({ id: 5, interviewFlowId: 10 } as any);
        findInterviewStepMock.mockResolvedValue({ id: 2, interviewFlowId: 11 } as any);

        await expect(updateCandidateInterviewStep(1, 5, 2)).rejects.toEqual(
            expect.objectContaining<Partial<CandidateServiceError>>({
                message: 'Interview step does not belong to the position interview flow',
                statusCode: 409,
            }),
        );
    });

    it('returns 200-equivalent idempotent result when stage is unchanged', async () => {
        const existingApplication = {
            id: 9,
            candidateId: 1,
            positionId: 5,
            currentInterviewStep: 2,
            applicationDate: new Date(),
            notes: null,
        };

        findCandidateMock.mockResolvedValue({ id: 1 } as any);
        findPositionMock.mockResolvedValue({ id: 5, interviewFlowId: 10 } as any);
        findInterviewStepMock.mockResolvedValue({ id: 2, interviewFlowId: 10 } as any);
        findApplicationMock.mockResolvedValue(existingApplication as any);

        const result = await updateCandidateInterviewStep(1, 5, 2);

        expect(result).toBe(existingApplication);
        expect(updateInterviewStepMock).not.toHaveBeenCalled();
    });

    it('updates interview step successfully', async () => {
        const currentApplication = {
            id: 9,
            candidateId: 1,
            positionId: 5,
            currentInterviewStep: 1,
            applicationDate: new Date(),
            notes: null,
        };

        const updatedApplication = {
            ...currentApplication,
            currentInterviewStep: 2,
        };

        findCandidateMock.mockResolvedValue({ id: 1 } as any);
        findPositionMock.mockResolvedValue({ id: 5, interviewFlowId: 10 } as any);
        findInterviewStepMock.mockResolvedValue({ id: 2, interviewFlowId: 10 } as any);
        findApplicationMock.mockResolvedValue(currentApplication as any);
        updateInterviewStepMock.mockResolvedValue(updatedApplication as any);

        const result = await updateCandidateInterviewStep(1, 5, 2);

        expect(updateInterviewStepMock).toHaveBeenCalledWith(9, 2);
        expect(result).toEqual(updatedApplication);
    });
});
