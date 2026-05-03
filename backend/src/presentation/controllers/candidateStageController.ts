import { Request, Response, NextFunction } from 'express';
import { CandidateStageService } from '../../application/services/candidateStageService';
import { ValidationError } from '../../application/validator';
import * as validatorModule from '../../application/validator';

export function makeUpdateCandidateStage(candidateStageService: CandidateStageService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idParam = parseInt(req.params.id, 10);

    if (isNaN(idParam) || idParam <= 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid candidate ID',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    let stageData;
    try {
      stageData = validatorModule.validateStageUpdateData(req.body as Record<string, unknown>);
    } catch (error) {
      if (error instanceof Error && error.name === 'ValidationError') {
        const validationErr = error as ValidationError;
        res.status(400).json({
          success: false,
          error: {
            message: validationErr.message,
            code: 'VALIDATION_ERROR',
            details: validationErr.details,
          },
        });
        return;
      }
      next(error);
      return;
    }

    try {
      const data = await candidateStageService.updateCandidateStage(idParam, stageData);
      res.status(200).json({
        success: true,
        data,
        message: 'Candidate stage updated successfully',
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
      if (error instanceof Error && error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          error: {
            message: error.message,
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }
      next(error);
    }
  };
}
