import { Request, Response } from 'express';
import {
    addCandidate,
    CandidateServiceError,
    findCandidateById,
    updateCandidateInterviewStep as updateCandidateInterviewStepService,
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

export const updateCandidateInterviewStep = async (req: Request, res: Response) => {
    const candidateId = Number(req.params.id);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const { positionId, interviewStepId } = req.body || {};
    if (
        !Number.isInteger(positionId) ||
        positionId <= 0 ||
        !Number.isInteger(interviewStepId) ||
        interviewStepId <= 0
    ) {
        return res.status(400).json({ error: 'Invalid positionId or interviewStepId format' });
    }

    try {
        const application = await updateCandidateInterviewStepService(candidateId, positionId, interviewStepId);
        return res.status(200).json({
            message: 'Application updated successfully',
            data: application,
        });
    } catch (error) {
        if (
            error instanceof CandidateServiceError ||
            (typeof error === 'object' &&
                error !== null &&
                'statusCode' in error &&
                typeof (error as { statusCode: unknown }).statusCode === 'number')
        ) {
            const serviceError = error as { statusCode: number; message?: string };
            return res.status(serviceError.statusCode).json({ error: serviceError.message || 'Request failed' });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { addCandidate };