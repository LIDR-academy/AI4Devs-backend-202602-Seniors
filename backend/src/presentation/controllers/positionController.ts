import { Request, Response } from 'express';
import { GetPositionCandidatesUseCase } from '../../application/use-cases/GetPositionCandidatesUseCase';

const useCase = new GetPositionCandidatesUseCase();

/** GET /api/v1/positions/:id/candidates */
export const getPositionCandidates = async (req: Request, res: Response): Promise<void> => {
  const positionId = parseInt(req.params.id, 10);
  if (isNaN(positionId) || positionId <= 0) {
    res.status(400).json({ error: 'INVALID_ID', message: 'Position ID must be a positive integer' });
    return;
  }

  try {
    const candidates = await useCase.execute(positionId);
    res.status(200).json(candidates);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
  }
};
