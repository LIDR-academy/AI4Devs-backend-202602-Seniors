import { Request, Response } from 'express';
import { getCandidates } from '../positionController';
import * as positionService from '../../../application/services/positionService';

jest.mock('../../../application/services/positionService');

const mockGetCandidatesForPosition =
  positionService.getCandidatesForPosition as jest.Mock;

function makeReq(params: Record<string, string>): Partial<Request> {
  return { params };
}

function makeRes() {
  const res = {} as any;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as { status: jest.Mock; json: jest.Mock };
}

describe('getCandidates controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with candidate list for a valid position', async () => {
    const candidates = [
      {
        candidateId: 1,
        fullName: 'Jane Doe',
        currentInterviewStep: { id: 3, name: 'Technical Interview' },
        averageScore: 7.5,
      },
    ];
    mockGetCandidatesForPosition.mockResolvedValue(candidates);

    const req = makeReq({ id: '1' });
    const res = makeRes();

    await getCandidates(req as Request, res as unknown as Response);

    expect(res.json).toHaveBeenCalledWith(candidates);
  });

  it('returns 400 when :id is not a valid integer', async () => {
    const req = makeReq({ id: 'abc' });
    const res = makeRes();

    await getCandidates(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid position ID' });
  });

  it('returns 404 when position is not found', async () => {
    mockGetCandidatesForPosition.mockRejectedValue(
      new Error('POSITION_NOT_FOUND'),
    );

    const req = makeReq({ id: '999' });
    const res = makeRes();

    await getCandidates(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Position not found' });
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCandidatesForPosition.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const req = makeReq({ id: '1' });
    const res = makeRes();

    await getCandidates(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
