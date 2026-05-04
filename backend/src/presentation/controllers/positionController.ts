import { Request, Response } from 'express';
import { getCandidatesForPosition } from '../../application/services/positionService';

export const getCandidates = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid position ID' });
    return;
  }

  try {
    const candidates = await getCandidatesForPosition(id);
    res.json(candidates);
  } catch (error) {
    if (error instanceof Error && error.message === 'POSITION_NOT_FOUND') {
      res.status(404).json({ error: 'Position not found' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
