import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage as updateStageService } from '../../application/services/candidateService';

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

export const updateCandidateStage = async (req: Request, res: Response): Promise<void> => {
    const candidateId = parseInt(req.params.id);
    if (isNaN(candidateId)) {
        res.status(400).json({ error: 'Invalid candidate ID format' });
        return;
    }

    const { applicationId, currentInterviewStep } = req.body;
    if (!applicationId || !Number.isInteger(applicationId)) {
        res.status(400).json({ error: 'Invalid or missing applicationId' });
        return;
    }
    if (!currentInterviewStep || !Number.isInteger(currentInterviewStep)) {
        res.status(400).json({ error: 'Invalid or missing currentInterviewStep' });
        return;
    }

    try {
        const updated = await updateStageService(candidateId, applicationId, currentInterviewStep);
        res.json(updated);
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === 'Candidate not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message === 'Application not found for this candidate') {
                res.status(404).json({ error: error.message });
            } else if (error.message === 'Invalid interview step') {
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