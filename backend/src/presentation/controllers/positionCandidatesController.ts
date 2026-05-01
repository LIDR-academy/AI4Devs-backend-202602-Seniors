import { Request, Response } from 'express';
import {
  getCandidatesByPositionIdFromPrisma,
  PositionNotFoundError,
} from '../../application/services/positionCandidatesService';

export const getPositionCandidates = async (req: Request, res: Response) => {
  try {
    const positionId = parseInt(req.params.id, 10);
    if (isNaN(positionId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const candidates = await getCandidatesByPositionIdFromPrisma(req.prisma, positionId);
    return res.status(200).json(candidates);
  } catch (error) {
    if (error instanceof PositionNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
