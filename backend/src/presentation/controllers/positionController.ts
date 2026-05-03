import { Request, Response, NextFunction } from 'express';
import { PositionService } from '../../application/services/positionService';

export function makeGetPositionCandidates(positionService: PositionService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idParam = parseInt(req.params.id, 10);

    if (isNaN(idParam) || idParam <= 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid position ID',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    try {
      const data = await positionService.getCandidatesByPosition(idParam);
      res.status(200).json({
        success: true,
        data,
        message: 'Candidates retrieved successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        res.status(404).json({
          success: false,
          error: {
            message: error.message,
            code: 'NOT_FOUND',
          },
        });
        return;
      }
      next(error);
    }
  };
}
