jest.mock('@prisma/client', () => {
  const mockPositionFindUnique = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      position: { findUnique: mockPositionFindUnique },
    })),
  };
});

import { PrismaClient } from '@prisma/client';
import { getCandidatesForPosition } from '../application/services/positionService';

const prismaMock = new PrismaClient() as jest.Mocked<any>;

const makePosition = (applications: any[]) => ({ id: 1, title: 'Developer', applications });

describe('getCandidatesForPosition service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws Position not found when position does not exist', async () => {
    prismaMock.position.findUnique.mockResolvedValue(null);

    await expect(getCandidatesForPosition(999)).rejects.toThrow('Position not found');
  });

  it('returns empty array when no applications exist', async () => {
    prismaMock.position.findUnique.mockResolvedValue(makePosition([]));

    const result = await getCandidatesForPosition(1);

    expect(result).toEqual([]);
  });

  it('returns candidates with correct fullName', async () => {
    prismaMock.position.findUnique.mockResolvedValue(makePosition([
      { candidate: { firstName: 'John', lastName: 'Doe' }, interviewStep: { name: 'Initial Screening' }, interviews: [] },
    ]));

    const result = await getCandidatesForPosition(1);

    expect(result[0].fullName).toBe('John Doe');
  });

  it('returns correct currentInterviewStep name', async () => {
    prismaMock.position.findUnique.mockResolvedValue(makePosition([
      { candidate: { firstName: 'Jane', lastName: 'Smith' }, interviewStep: { name: 'Technical Interview' }, interviews: [] },
    ]));

    const result = await getCandidatesForPosition(1);

    expect(result[0].currentInterviewStep).toBe('Technical Interview');
  });

  it('calculates averageScore correctly', async () => {
    prismaMock.position.findUnique.mockResolvedValue(makePosition([
      { candidate: { firstName: 'Alice', lastName: 'Brown' }, interviewStep: { name: 'HR Interview' }, interviews: [{ score: 6 }, { score: 8 }] },
    ]));

    const result = await getCandidatesForPosition(1);

    expect(result[0].averageScore).toBe(7);
  });

  it('returns averageScore null when no interviews', async () => {
    prismaMock.position.findUnique.mockResolvedValue(makePosition([
      { candidate: { firstName: 'Bob', lastName: 'Green' }, interviewStep: { name: 'Initial Screening' }, interviews: [] },
    ]));

    const result = await getCandidatesForPosition(1);

    expect(result[0].averageScore).toBeNull();
  });

  it('returns averageScore null when all scores are null', async () => {
    prismaMock.position.findUnique.mockResolvedValue(makePosition([
      { candidate: { firstName: 'Carol', lastName: 'White' }, interviewStep: { name: 'Final Interview' }, interviews: [{ score: null }, { score: null }] },
    ]));

    const result = await getCandidatesForPosition(1);

    expect(result[0].averageScore).toBeNull();
  });
});
