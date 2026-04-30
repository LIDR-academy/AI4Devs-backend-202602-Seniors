import { getCandidatesForPosition } from '../application/services/positionService';
import { Application } from '../domain/models/Application';

jest.mock('../domain/models/Application');

const mockFindByPositionId = Application.findByPositionId as jest.Mock;

describe('getCandidatesForPosition', () => {
    afterEach(() => jest.clearAllMocks());

    it('returns POSITION_NOT_FOUND when the position does not exist', async () => {
        mockFindByPositionId.mockResolvedValue(null);

        const result = await getCandidatesForPosition(999);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe('POSITION_NOT_FOUND');
        }
    });

    it('returns an empty array when the position exists but has no candidates', async () => {
        mockFindByPositionId.mockResolvedValue([]);

        const result = await getCandidatesForPosition(1);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value).toEqual([]);
        }
    });

    it('maps fullName, currentInterviewStep and averageScore correctly', async () => {
        mockFindByPositionId.mockResolvedValue([
            {
                candidate: { firstName: 'Juan', lastName: 'García' },
                interviewStep: { name: 'Technical Interview' },
                interviews: [{ score: 8 }, { score: 6 }],
            },
        ]);

        const result = await getCandidatesForPosition(1);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value).toEqual([
                {
                    fullName: 'Juan García',
                    currentInterviewStep: 'Technical Interview',
                    averageScore: 7,
                },
            ]);
        }
    });

    it('returns null averageScore when candidate has no interviews', async () => {
        mockFindByPositionId.mockResolvedValue([
            {
                candidate: { firstName: 'Ana', lastName: 'López' },
                interviewStep: { name: 'Initial Screening' },
                interviews: [],
            },
        ]);

        const result = await getCandidatesForPosition(1);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value[0].averageScore).toBeNull();
        }
    });

    it('ignores null scores when calculating the average', async () => {
        mockFindByPositionId.mockResolvedValue([
            {
                candidate: { firstName: 'Pedro', lastName: 'Martínez' },
                interviewStep: { name: 'HR Interview' },
                interviews: [{ score: 9 }, { score: null }, { score: 7 }],
            },
        ]);

        const result = await getCandidatesForPosition(1);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value[0].averageScore).toBe(8);
        }
    });
});
