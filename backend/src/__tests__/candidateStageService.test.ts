import { updateCandidateStage } from '../application/services/candidateStageService';
import { Candidate } from '../domain/models/Candidate';
import { Application } from '../domain/models/Application';

jest.mock('../domain/models/Candidate');
jest.mock('../domain/models/Application');

const mockFindOne = Candidate.findOne as jest.Mock;
const mockFindLatest = Application.findLatestByCandidateId as jest.Mock;
const mockUpdateStep = Application.updateInterviewStep as jest.Mock;

const fakeCandidate = { id: 1, firstName: 'John', lastName: 'Doe' };
const fakeApplication = { id: 10 };
const fakeUpdated = {
    id: 10,
    candidateId: 1,
    positionId: 1,
    currentInterviewStep: 2,
    applicationDate: new Date(),
    notes: null,
};

describe('updateCandidateStage', () => {
    afterEach(() => jest.clearAllMocks());

    it('returns CANDIDATE_NOT_FOUND when the candidate does not exist', async () => {
        mockFindOne.mockResolvedValue(null);

        const result = await updateCandidateStage(999, 2);

        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toBe('CANDIDATE_NOT_FOUND');
    });

    it('returns CANDIDATE_NOT_FOUND when the candidate has no applications', async () => {
        mockFindOne.mockResolvedValue(fakeCandidate);
        mockFindLatest.mockResolvedValue(null);

        const result = await updateCandidateStage(1, 2);

        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toBe('CANDIDATE_NOT_FOUND');
    });

    it('returns the updated application on success', async () => {
        mockFindOne.mockResolvedValue(fakeCandidate);
        mockFindLatest.mockResolvedValue(fakeApplication);
        mockUpdateStep.mockResolvedValue(fakeUpdated);

        const result = await updateCandidateStage(1, 2);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.currentInterviewStep).toBe(2);
            expect(mockUpdateStep).toHaveBeenCalledWith(10, 2);
        }
    });

    it('returns INVALID_INTERVIEW_STEP when Prisma raises a FK constraint error', async () => {
        mockFindOne.mockResolvedValue(fakeCandidate);
        mockFindLatest.mockResolvedValue(fakeApplication);
        mockUpdateStep.mockRejectedValue({ code: 'P2003' });

        const result = await updateCandidateStage(1, 9999);

        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toBe('INVALID_INTERVIEW_STEP');
    });
});
