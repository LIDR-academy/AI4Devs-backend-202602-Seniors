import { Request, Response } from 'express';
import { getCandidatesByPositionId } from '../../application/services/positionService';

export const getCandidatesByPositionIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const positionId = parseInt(req.params.id);

    if (isNaN(positionId)) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    const candidates = await getCandidatesByPositionId(positionId);
    res.status(200).json(candidates);
  } catch (error: any) {
    if (error.message === 'Position not found') {
      res.status(404).json({ message: 'Position not found' });
    } else if (error.message.includes('Invalid')) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
