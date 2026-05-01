import { Request, Response } from 'express';
import {
  ApplicationNotFoundError,
  InvalidTargetInterviewStepError,
  updateApplicationStageFromPrisma,
} from '../../application/services/applicationStageService';

export const updateCandidateApplicationStage = async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    if (isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const { targetInterviewStepId } = req.body;
    if (typeof targetInterviewStepId !== 'number' || Number.isNaN(targetInterviewStepId)) {
      return res.status(400).json({ error: 'targetInterviewStepId must be a valid number' });
    }

    const updated = await updateApplicationStageFromPrisma(
      req.prisma,
      applicationId,
      targetInterviewStepId
    );

    return res.status(200).json(updated);
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    if (error instanceof InvalidTargetInterviewStepError) {
      return res.status(422).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
