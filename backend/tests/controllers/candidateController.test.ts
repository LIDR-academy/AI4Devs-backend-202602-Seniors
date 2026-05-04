/**
 * Unit tests for the candidate controller — specifically `updateCandidateStage`
 * (handler for `PUT /candidates/:id/stage`).
 *
 * Mocks `candidateStageService` so HTTP status and JSON mapping are tested in
 * isolation from Prisma / domain behavior. Service-level orchestration is
 * covered separately in `candidateStageService.test.ts`.
 */
jest.mock('../../src/application/services/candidateStageService', () => ({
  updateCandidateStage: jest.fn(),
}));

import { Request, Response } from 'express';
import { updateCandidateStage as updateCandidateStageController } from '../../src/presentation/controllers/candidateController';
import { updateCandidateStage as updateCandidateStageService } from '../../src/application/services/candidateStageService';
import { makeReq, makeRes, makeStageUpdateBody } from '../helpers/factories';

/**
 * Stand-in for {@link updateCandidateStageService}; each test sets `mockResolvedValue` / `mockRejectedValue`.
 * Cleared in `beforeEach` so cases do not leak implementations.
 */
const mockUpdateCandidateStage =
  updateCandidateStageService as jest.MockedFunction<
    typeof updateCandidateStageService
  >;

/**
 * HTTP layer: parameter parsing, body forwarding, discriminated result mapping
 * to status/JSON, and 500 fallback when the service throws.
 */
describe('updateCandidateStage (controller)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Rows 3 & 4 — non-numeric / empty `:id` short-circuits with 400. */
  describe('400 — invalid id', () => {
    it('responds 400 with { error: "Invalid ID format" } for a non-numeric id ("abc")', async () => {
      const req = makeReq({ id: 'abc' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
      expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    });

    it('responds 400 for an empty id string ("")', async () => {
      const req = makeReq({ id: '' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
    });
  });

  /** Row 5 — `:id = "0"` parses cleanly and is forwarded; service decides not-found. */
  describe('id "0" boundary', () => {
    it('forwards 0 to the service (isNaN(0) === false) and 404s when candidate missing', async () => {
      mockUpdateCandidateStage.mockResolvedValue({ kind: 'candidate_not_found' });
      const req = makeReq({ id: '0' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(mockUpdateCandidateStage).toHaveBeenCalledWith(
        0,
        makeStageUpdateBody(),
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Candidate not found' });
    });
  });

  /** Explicit `candidate_not_found` mapping for a normal numeric id (not only the `:id === "0"` edge). */
  describe('404 — candidate not found', () => {
    it('maps candidate_not_found to 404 Candidate not found for a typical id param', async () => {
      mockUpdateCandidateStage.mockResolvedValue({ kind: 'candidate_not_found' });
      const req = makeReq({ id: '999' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(mockUpdateCandidateStage).toHaveBeenCalledWith(
        999,
        makeStageUpdateBody(),
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Candidate not found' });
    });
  });

  /** Rows 7-11 — body validation paths surfaced as 400 with the validator message. */
  describe('400 — body validation', () => {
    it('responds 400 with { error: "Invalid request body" } when service flags missing body', async () => {
      mockUpdateCandidateStage.mockResolvedValue({
        kind: 'invalid_input',
        message: 'Invalid request body',
      });
      const req = makeReq({ id: '5' }, undefined);
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request body' });
    });

    it('responds 400 with "Invalid applicationId" when applicationId is missing', async () => {
      mockUpdateCandidateStage.mockResolvedValue({
        kind: 'invalid_input',
        message: 'Invalid applicationId',
      });
      const req = makeReq({ id: '5' }, { currentInterviewStep: 3 });
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid applicationId' });
    });

    it('responds 400 with "Invalid currentInterviewStep" when the step field is missing', async () => {
      mockUpdateCandidateStage.mockResolvedValue({
        kind: 'invalid_input',
        message: 'Invalid currentInterviewStep',
      });
      const req = makeReq({ id: '5' }, { applicationId: 10 });
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid currentInterviewStep',
      });
    });

    it('responds 400 for non-integer applicationId values', async () => {
      mockUpdateCandidateStage.mockResolvedValue({
        kind: 'invalid_input',
        message: 'Invalid applicationId',
      });
      const req = makeReq(
        { id: '5' },
        { applicationId: 'foo', currentInterviewStep: 3 },
      );
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid applicationId' });
    });

    it('responds 400 for currentInterviewStep <= 0', async () => {
      mockUpdateCandidateStage.mockResolvedValue({
        kind: 'invalid_input',
        message: 'Invalid currentInterviewStep',
      });
      const req = makeReq(
        { id: '5' },
        { applicationId: 10, currentInterviewStep: 0 },
      );
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid currentInterviewStep',
      });
    });
  });

  /** Discriminated-result → HTTP status mapping (404 / 409 / 400 stage-flow). */
  describe('result kind mapping', () => {
    it('maps application_not_found to 404 with the correct message', async () => {
      mockUpdateCandidateStage.mockResolvedValue({ kind: 'application_not_found' });
      const req = makeReq({ id: '5' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Application not found' });
    });

    it('maps step_not_found to 404 "Interview step not found"', async () => {
      mockUpdateCandidateStage.mockResolvedValue({ kind: 'step_not_found' });
      const req = makeReq({ id: '5' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Interview step not found',
      });
    });

    it('maps application_candidate_mismatch to 409', async () => {
      mockUpdateCandidateStage.mockResolvedValue({
        kind: 'application_candidate_mismatch',
      });
      const req = makeReq({ id: '5' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Application does not belong to candidate',
      });
    });

    it('maps invalid_stage_for_flow to 400 with the documented message', async () => {
      mockUpdateCandidateStage.mockResolvedValue({ kind: 'invalid_stage_for_flow' });
      const req = makeReq({ id: '5' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Stage does not belong to the candidate's interview flow",
      });
    });
  });

  /** Happy path — full equality on the updated Application row body. */
  describe('200 — happy path', () => {
    it('responds 200 with the exact updated Application row returned by the service', async () => {
      const updatedRow = {
        id: 10,
        positionId: 1,
        candidateId: 5,
        applicationDate: new Date('2024-01-01').toISOString(),
        currentInterviewStep: 3,
        notes: null,
      };
      mockUpdateCandidateStage.mockResolvedValue({
        kind: 'ok',
        application: updatedRow,
      });
      const req = makeReq({ id: '5' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.status).not.toHaveBeenCalledWith(409);
      expect(res.status).not.toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(updatedRow);
    });
  });

  /** 500 fallback — unexpected service rejection becomes JSON 500 (no stack leak). */
  describe('500 — unexpected errors', () => {
    it('responds 500 with { error: "Internal Server Error" } when the service throws', async () => {
      mockUpdateCandidateStage.mockRejectedValue(new Error('DB connection lost'));
      const req = makeReq({ id: '5' }, makeStageUpdateBody());
      const res = makeRes();

      await updateCandidateStageController(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });
});
