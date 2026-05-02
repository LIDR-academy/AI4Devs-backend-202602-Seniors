import { Request, Response } from 'express';
import { getCandidatesForPosition } from '../../application/services/positionService';

export const getCandidatesForPositionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      res.status(400).json({ error: 'Invalid position ID' });
      return;
    }

    const positionId = parseInt(req.params.id, 10);

    if (positionId <= 0) {
      res.status(400).json({ error: 'Invalid position ID' });
      return;
    }

    const candidates = await getCandidatesForPosition(positionId);
    res.json(candidates);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Position not found') {
      res.status(404).json({ error: 'Position not found' });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
