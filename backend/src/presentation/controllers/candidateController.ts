import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage as updateStageService } from '../../application/services/candidateService';
import { NotFoundError, ValidationError } from '../../application/errors';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
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

export const updateCandidateStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const candidateId = parseInt(req.params.id);
    if (isNaN(candidateId)) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }
    const { applicationId, currentInterviewStep } = req.body;
    if (applicationId === undefined || currentInterviewStep === undefined) {
      res.status(400).json({ error: 'applicationId and currentInterviewStep are required' });
      return;
    }
    const result = await updateStageService(candidateId, applicationId, currentInterviewStep);
    res.status(200).json({ message: 'Candidate stage updated successfully', data: result });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};