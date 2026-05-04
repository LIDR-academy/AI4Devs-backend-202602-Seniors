import { Request, Response } from 'express';
import {
    addCandidate,
    findCandidateById,
    updateCandidateStage as updateCandidateStageInService,
} from '../../application/services/candidateService';

function parseStrictInteger(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^-?\d+$/.test(trimmed)) {
            return parseInt(trimmed, 10);
        }
    }
    return null;
}

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
    const rawCandidateId = req.params.id;
    if (!/^-?\d+$/.test(rawCandidateId.trim())) {
        res.status(400).json({ error: 'Invalid candidate ID format' });
        return;
    }
    const candidateId = parseInt(rawCandidateId, 10);

    const body = req.body as Record<string, unknown>;
    const rawApplicationId = body.applicationId;
    if (rawApplicationId === undefined || rawApplicationId === null) {
        res.status(400).json({ error: 'Invalid or missing applicationId' });
        return;
    }
    const applicationId = parseStrictInteger(rawApplicationId);
    if (applicationId === null) {
        res.status(400).json({ error: 'Invalid or missing applicationId' });
        return;
    }

    const rawInterviewStep = body.currentInterviewStep;
    if (rawInterviewStep === undefined || rawInterviewStep === null) {
        res.status(400).json({ error: 'Invalid or missing currentInterviewStep' });
        return;
    }
    const interviewStepId = parseStrictInteger(rawInterviewStep);
    if (interviewStepId === null) {
        res.status(400).json({ error: 'Invalid or missing currentInterviewStep' });
        return;
    }

    try {
        const result = await updateCandidateStageInService(
            candidateId,
            applicationId,
            interviewStepId,
        );
        res.status(200).json(result);
    } catch (error: unknown) {
        if (!(error instanceof Error)) {
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (error.message === 'Candidate not found') {
            res.status(404).json({ error: 'Candidate not found' });
            return;
        }
        if (error.message === 'Application not found for this candidate') {
            res.status(404).json({ error: 'Application not found for this candidate' });
            return;
        }
        if (error.message === 'Invalid interview step') {
            res.status(400).json({ error: 'Invalid interview step' });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { addCandidate };