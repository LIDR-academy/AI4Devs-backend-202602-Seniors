const mockPositionFindUnique = jest.fn();
const mockApplicationFindMany = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    position: { findUnique: mockPositionFindUnique },
    application: { findMany: mockApplicationFindMany },
  })),
}));

import { getCandidatesForPosition } from '../positionService';

describe('getCandidatesForPosition', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns mapped candidates when position has applications', async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1 });
    mockApplicationFindMany.mockResolvedValue([
      {
        candidate: { id: 10, firstName: 'Jane', lastName: 'Doe' },
        interviewStep: { id: 3, name: 'Technical Interview' },
        interviews: [{ score: 8 }, { score: 7 }],
      },
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result).toEqual([
      {
        candidateId: 10,
        fullName: 'Jane Doe',
        currentInterviewStep: { id: 3, name: 'Technical Interview' },
        averageScore: 7.5,
      },
    ]);
  });

  it('returns empty array when position has no applications', async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1 });
    mockApplicationFindMany.mockResolvedValue([]);

    const result = await getCandidatesForPosition(1);

    expect(result).toEqual([]);
  });

  it('throws POSITION_NOT_FOUND when position does not exist', async () => {
    mockPositionFindUnique.mockResolvedValue(null);

    await expect(getCandidatesForPosition(999)).rejects.toThrow(
      'POSITION_NOT_FOUND',
    );
  });

  it('returns null averageScore when candidate has no interviews', async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1 });
    mockApplicationFindMany.mockResolvedValue([
      {
        candidate: { id: 10, firstName: 'Jane', lastName: 'Doe' },
        interviewStep: { id: 3, name: 'Technical Interview' },
        interviews: [],
      },
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result[0].averageScore).toBeNull();
  });

  it('excludes null scores when computing average', async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1 });
    mockApplicationFindMany.mockResolvedValue([
      {
        candidate: { id: 10, firstName: 'Jane', lastName: 'Doe' },
        interviewStep: { id: 3, name: 'Technical Interview' },
        interviews: [{ score: 8 }, { score: null }],
      },
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result[0].averageScore).toBe(8);
  });
});
