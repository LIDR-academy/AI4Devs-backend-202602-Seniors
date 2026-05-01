import { Request, Response } from 'express';
import {
  addCandidate,
  findCandidateById,
  updateCandidateStage,
} from '../../application/services/candidateService';
import { validateStageUpdateBody } from '../../application/validator';

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

export const updateStageController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const candidateId = parseInt(req.params.id);
  if (isNaN(candidateId)) {
    res.status(400).json({ error: 'Invalid candidate ID format' });
    return;
  }

  try {
    validateStageUpdateBody(req.body);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Invalid request body' });
    }
    return;
  }

  const { applicationId, newInterviewStepId } = req.body;

  try {
    const result = await updateCandidateStage(
      candidateId,
      applicationId,
      newInterviewStepId,
    );
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      const NOT_FOUND = ['Application not found', 'InterviewStep not found'];
      const BAD_REQUEST = [
        'Application does not belong to this candidate',
        'Step does not belong to the position interview flow',
      ];
      if (NOT_FOUND.includes(error.message)) {
        res.status(404).json({ error: error.message });
      } else if (BAD_REQUEST.includes(error.message)) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export { addCandidate };
