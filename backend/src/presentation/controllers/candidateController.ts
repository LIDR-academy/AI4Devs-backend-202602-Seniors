import { Request, Response } from 'express';
import {
    addCandidate,
    findCandidateById,
    updateCandidateStage
} from '../../application/services/candidateService';

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

export const updateCandidateStageController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const candidateId = parseInt(id, 10);

        if (isNaN(candidateId) || candidateId <= 0) {
            res.status(400).json({ error: 'Invalid candidate ID format' });
            return;
        }

        const { currentInterviewStep } = req.body;

        if (
            currentInterviewStep === undefined ||
            currentInterviewStep === null ||
            typeof currentInterviewStep !== 'number' ||
            currentInterviewStep <= 0
        ) {
            res.status(400).json({
                error: 'currentInterviewStep is required and must be a positive number'
            });
            return;
        }

        const result = await updateCandidateStage(candidateId, currentInterviewStep);

        res.json({
            message: result.message,
            updatedApplications: result.updatedApplications
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (
            errorMessage === 'Candidate not found' ||
            errorMessage === 'Interview step not found'
        ) {
            res.status(404).json({ error: errorMessage });
            return;
        }

        if (errorMessage === 'Candidate has no applications') {
            res.status(400).json({ error: errorMessage });
            return;
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
};