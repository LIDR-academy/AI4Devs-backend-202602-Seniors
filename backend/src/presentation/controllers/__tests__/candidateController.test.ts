import { Request, Response } from 'express';
import { updateCandidateStage } from '../candidateController';
import * as candidateService from '../../../application/services/candidateService';

jest.mock('../../../application/services/candidateService');

const mockUpdateCandidateStage =
  candidateService.updateCandidateStage as jest.Mock;

function makeReq(
  params: Record<string, string>,
  body: Record<string, unknown>,
): Partial<Request> {
  return { params, body };
}

function makeRes() {
  const res = {} as any;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as { status: jest.Mock; json: jest.Mock };
}

describe('updateCandidateStage controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with updated application for valid request', async () => {
    const updated = {
      id: 7,
      candidateId: 1,
      positionId: 2,
      currentInterviewStep: 4,
    };
    mockUpdateCandidateStage.mockResolvedValue(updated);

    const req = makeReq({ id: '7' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 400 when :id is not a valid integer', async () => {
    const req = makeReq({ id: 'abc' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid application ID' });
  });

  it('returns 400 when :id is zero', async () => {
    const req = makeReq({ id: '0' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid application ID' });
  });

  it('returns 400 when :id is negative', async () => {
    const req = makeReq({ id: '-1' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid application ID' });
  });

  it('returns 400 when currentInterviewStep is missing', async () => {
    const req = makeReq({ id: '7' }, {});
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'currentInterviewStep must be a positive integer',
    });
  });

  it('returns 400 when currentInterviewStep is not a positive integer', async () => {
    const req = makeReq({ id: '7' }, { currentInterviewStep: -1 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'currentInterviewStep must be a positive integer',
    });
  });

  it('returns 400 when currentInterviewStep is zero', async () => {
    const req = makeReq({ id: '7' }, { currentInterviewStep: 0 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'currentInterviewStep must be a positive integer',
    });
  });

  it('returns 404 when application is not found', async () => {
    mockUpdateCandidateStage.mockRejectedValue(
      new Error('APPLICATION_NOT_FOUND'),
    );

    const req = makeReq({ id: '999' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Application not found' });
  });

  it('returns 404 when interview step is not found', async () => {
    mockUpdateCandidateStage.mockRejectedValue(new Error('STEP_NOT_FOUND'));

    const req = makeReq({ id: '7' }, { currentInterviewStep: 999 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Interview step not found',
    });
  });

  it('returns 500 on unexpected error', async () => {
    mockUpdateCandidateStage.mockRejectedValue(
      new Error('DB connection failed'),
    );

    const req = makeReq({ id: '7' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
