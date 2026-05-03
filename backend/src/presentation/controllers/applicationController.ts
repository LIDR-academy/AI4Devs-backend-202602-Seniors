import { Request, Response } from 'express';
import { UpdateCandidateStageUseCase } from '../../application/use-cases/UpdateCandidateStageUseCase';
import { StageUpdateErrorCode } from '../../domain/errors/StageUpdateError';

const useCase = new UpdateCandidateStageUseCase();

const ERROR_STATUS: Record<StageUpdateErrorCode, number> = {
  [StageUpdateErrorCode.CANDIDATE_NOT_FOUND]: 404,
  [StageUpdateErrorCode.APPLICATION_NOT_FOUND]: 404,
  [StageUpdateErrorCode.INVALID_STEP]: 400,
};

/** PUT /api/v1/candidates/:id/stage */
export const updateCandidateStage = async (req: Request, res: Response): Promise<void> => {
  const candidateId = parseInt(req.params.id, 10);
  if (isNaN(candidateId) || candidateId <= 0) {
    res.status(400).json({ error: 'INVALID_ID', message: 'Candidate ID must be a positive integer' });
    return;
  }

  const { interviewStepId } = req.body;
  if (interviewStepId === undefined || interviewStepId === null) {
    res.status(400).json({ error: 'MISSING_FIELD', message: 'interviewStepId is required' });
    return;
  }

  const stepId = parseInt(String(interviewStepId), 10);
  if (isNaN(stepId) || stepId <= 0) {
    res.status(400).json({ error: 'INVALID_STEP', message: 'interviewStepId must be a positive integer' });
    return;
  }

  try {
    const result = await useCase.execute(candidateId, stepId);

    if (!result.ok) {
      const status = ERROR_STATUS[result.error.code] ?? 400;
      res.status(status).json({ error: result.error.code, message: result.error.message });
      return;
    }

    res.status(200).json(result.value);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
  }
};
