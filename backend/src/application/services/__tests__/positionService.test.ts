import { getCandidatesByPositionId, PositionServiceError } from '../positionService';
import { Position } from '../../../domain/models/Position';

jest.mock('../../../domain/models/Position', () => ({
    Position: {
        findOne: jest.fn(),
        findCandidateApplications: jest.fn(),
    },
}));

describe('getCandidatesByPositionId', () => {
    const findOneMock = Position.findOne as jest.MockedFunction<typeof Position.findOne>;
    const findCandidateApplicationsMock =
        Position.findCandidateApplications as jest.MockedFunction<typeof Position.findCandidateApplications>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws 400 when positionId is invalid', async () => {
        await expect(getCandidatesByPositionId(0)).rejects.toEqual(
            expect.objectContaining<Partial<PositionServiceError>>({
                message: 'Invalid position ID format',
                statusCode: 400,
            }),
        );

        expect(findOneMock).not.toHaveBeenCalled();
    });

    it('throws 404 when position does not exist', async () => {
        findOneMock.mockResolvedValue(null);

        await expect(getCandidatesByPositionId(99)).rejects.toEqual(
            expect.objectContaining<Partial<PositionServiceError>>({
                message: 'Position not found',
                statusCode: 404,
            }),
        );

        expect(findOneMock).toHaveBeenCalledWith(99);
        expect(findCandidateApplicationsMock).not.toHaveBeenCalled();
    });

    it('returns an empty array when position exists with no applications', async () => {
        findOneMock.mockResolvedValue({ id: 1 } as any);
        findCandidateApplicationsMock.mockResolvedValue([]);

        const result = await getCandidatesByPositionId(1);

        expect(result).toEqual([]);
        expect(findCandidateApplicationsMock).toHaveBeenCalledWith(1);
    });

    it('maps, aggregates, and orders candidate summaries correctly', async () => {
        findOneMock.mockResolvedValue({ id: 5 } as any);
        findCandidateApplicationsMock.mockResolvedValue([
            {
                currentInterviewStep: 2,
                candidate: { firstName: 'Zoe', lastName: 'Beta' },
                interviews: [{ score: 80 }, { score: null }],
            },
            {
                currentInterviewStep: 1,
                candidate: { firstName: 'Ana', lastName: 'Alpha' },
                interviews: [{ score: null }],
            },
            {
                currentInterviewStep: 2,
                candidate: { firstName: 'Ana', lastName: 'Gamma' },
                interviews: [{ score: 1 }, { score: 2 }, { score: 2 }],
            },
        ]);

        const result = await getCandidatesByPositionId(5);

        expect(result).toEqual([
            {
                fullName: 'Ana Alpha',
                currentInterviewStep: 1,
                averageScore: null,
            },
            {
                fullName: 'Ana Gamma',
                currentInterviewStep: 2,
                averageScore: 1.67,
            },
            {
                fullName: 'Zoe Beta',
                currentInterviewStep: 2,
                averageScore: 80,
            },
        ]);
    });
});
