import { Request, Response } from 'express';
import {
  addCandidate,
  findCandidateById,
  updateCandidateStage as updateCandidateStageService,
} from '../../application/services/candidateService';

export const addCandidateController = async (req: Request, res: Response) => {
  try {
    const candidateData = req.body;
    const candidate = await addCandidate(candidateData);
    res
      .status(201)
      .json({ message: 'Candidate added successfully', data: candidate });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(400)
        .json({ message: 'Error adding candidate', error: error.message });
    } else {
      res
        .status(400)
        .json({ message: 'Error adding candidate', error: 'Unknown error' });
    }
  }
};

export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const candidate = await findCandidateById(id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export { addCandidate };

export const updateCandidateStage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid application ID' });
    return;
  }

  const { currentInterviewStep } = req.body;
  if (!Number.isInteger(currentInterviewStep) || currentInterviewStep <= 0) {
    res
      .status(400)
      .json({ error: 'currentInterviewStep must be a positive integer' });
    return;
  }

  try {
    const updated = await updateCandidateStageService(id, currentInterviewStep);
    res.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'APPLICATION_NOT_FOUND') {
        res.status(404).json({ error: 'Application not found' });
      } else if (error.message === 'STEP_NOT_FOUND') {
        res.status(404).json({ error: 'Interview step not found' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
