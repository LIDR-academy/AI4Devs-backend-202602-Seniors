import request from 'supertest';
import { app } from '../index';
import { ApplicationRepository } from '../infrastructure/repositories/ApplicationRepository';

jest.mock('../infrastructure/repositories/ApplicationRepository');

const MockApplicationRepository = ApplicationRepository as jest.MockedClass<typeof ApplicationRepository>;

const mockCandidate = { id: 1 };
const mockStep = { id: 2, name: 'Technical Interview' };
const mockApplication = { id: 10 };
const mockUpdatedApp = {
  id: 10,
  candidateId: 1,
  positionId: 2,
  currentInterviewStep: 2,
  applicationDate: new Date('2024-05-28'),
  notes: null,
};

describe('PUT /api/v1/candidates/:id/stage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-01: successfully updates the interview stage', async () => {
    MockApplicationRepository.prototype.findCandidateById.mockResolvedValue(mockCandidate);
    MockApplicationRepository.prototype.findInterviewStep.mockResolvedValue(mockStep);
    MockApplicationRepository.prototype.findApplicationByCandidate.mockResolvedValue(mockApplication);
    MockApplicationRepository.prototype.updateStage.mockResolvedValue(mockUpdatedApp);

    const res = await request(app)
      .put('/api/v1/candidates/1/stage')
      .send({ interviewStepId: 2 });

    expect(res.status).toBe(200);
    expect(res.body.currentInterviewStep).toBe(2);
    expect(res.body.candidateId).toBe(1);
  });

  it('TC-02: returns 404 when candidate not found', async () => {
    MockApplicationRepository.prototype.findCandidateById.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/v1/candidates/999/stage')
      .send({ interviewStepId: 2 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('CANDIDATE_NOT_FOUND');
  });

  it('TC-03: returns 404 when candidate has no application', async () => {
    MockApplicationRepository.prototype.findCandidateById.mockResolvedValue(mockCandidate);
    MockApplicationRepository.prototype.findInterviewStep.mockResolvedValue(mockStep);
    MockApplicationRepository.prototype.findApplicationByCandidate.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/v1/candidates/1/stage')
      .send({ interviewStepId: 2 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('APPLICATION_NOT_FOUND');
  });

  it('TC-04: returns 400 when interviewStepId does not exist', async () => {
    MockApplicationRepository.prototype.findCandidateById.mockResolvedValue(mockCandidate);
    MockApplicationRepository.prototype.findInterviewStep.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/v1/candidates/1/stage')
      .send({ interviewStepId: 999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_STEP');
  });

  it('TC-05: returns 400 for non-numeric candidate ID', async () => {
    const res = await request(app)
      .put('/api/v1/candidates/abc/stage')
      .send({ interviewStepId: 2 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ID');
  });
});
