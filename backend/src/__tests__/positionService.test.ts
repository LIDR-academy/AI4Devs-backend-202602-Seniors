import { getCandidatesByPositionId } from '../application/services/positionService';
import { Position } from '../domain/models/Position';

jest.mock('../domain/models/Position');

const mockFindCandidateApplications = Position.findCandidateApplications as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getCandidatesByPositionId', () => {
    it('returns candidates with fullName, currentInterviewStep and averageScore', async () => {
        mockFindCandidateApplications.mockResolvedValue([
            {
                candidate: { firstName: 'Jane', lastName: 'Doe' },
                currentInterviewStep: 2,
                interviews: [{ score: 4 }, { score: 5 }],
            },
        ]);

        const result = await getCandidatesByPositionId(1);

        expect(result).toEqual([
            { fullName: 'Jane Doe', currentInterviewStep: 2, averageScore: 4.5 },
        ]);
    });

    it('returns empty array when position has no candidates', async () => {
        mockFindCandidateApplications.mockResolvedValue([]);

        const result = await getCandidatesByPositionId(1);

        expect(result).toEqual([]);
    });

    it('throws NotFoundError when position does not exist', async () => {
        mockFindCandidateApplications.mockResolvedValue(null);

        await expect(getCandidatesByPositionId(999)).rejects.toThrow('Position not found');
    });

    it('returns averageScore null when candidate has no scored interviews', async () => {
        mockFindCandidateApplications.mockResolvedValue([
            {
                candidate: { firstName: 'John', lastName: 'Smith' },
                currentInterviewStep: 1,
                interviews: [],
            },
        ]);

        const result = await getCandidatesByPositionId(1);

        expect(result[0].averageScore).toBeNull();
    });

    it('returns averageScore null when all interview scores are null', async () => {
        mockFindCandidateApplications.mockResolvedValue([
            {
                candidate: { firstName: 'Ana', lastName: 'López' },
                currentInterviewStep: 1,
                interviews: [{ score: null }, { score: null }],
            },
        ]);

        const result = await getCandidatesByPositionId(1);

        expect(result[0].averageScore).toBeNull();
    });

    it('ignores null scores when computing averageScore', async () => {
        mockFindCandidateApplications.mockResolvedValue([
            {
                candidate: { firstName: 'Luis', lastName: 'García' },
                currentInterviewStep: 3,
                interviews: [{ score: null }, { score: 6 }, { score: 4 }],
            },
        ]);

        const result = await getCandidatesByPositionId(1);

        expect(result[0].averageScore).toBe(5);
    });

    it('throws ValidationError for non-numeric ID', async () => {
        await expect(getCandidatesByPositionId(NaN)).rejects.toThrow('Invalid position ID');
    });

    it('throws ValidationError for negative ID', async () => {
        await expect(getCandidatesByPositionId(-1)).rejects.toThrow('Invalid position ID');
    });
});
