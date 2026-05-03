import { Request, Response } from 'express';
import { getCandidatesForPosition as getCandidatesService } from '../../application/services/positionService';
import { NotFoundError } from '../../application/errors';

export const getCandidatesForPosition = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }
    const candidates = await getCandidatesService(id);
    res.status(200).json(candidates);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
