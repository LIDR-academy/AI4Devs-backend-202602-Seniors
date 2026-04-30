import { Request, Response } from 'express';
import { addCandidate, findCandidateById } from '../../application/services/candidateService';
import { updateCandidateStage } from '../../application/services/candidateStageService';

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

export const updateCandidateStageController = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid candidate ID' });
        return;
    }

    const { currentInterviewStep } = req.body;
    if (currentInterviewStep === undefined || !Number.isInteger(currentInterviewStep)) {
        res.status(400).json({ message: 'currentInterviewStep is required and must be an integer' });
        return;
    }

    const result = await updateCandidateStage(id, currentInterviewStep);

    if (!result.success) {
        if (result.error === 'CANDIDATE_NOT_FOUND') {
            res.status(404).json({ message: 'Candidate not found' });
        } else {
            res.status(400).json({ message: 'Invalid interview step ID' });
        }
        return;
    }

    res.status(200).json(result.value);
};

export { addCandidate };