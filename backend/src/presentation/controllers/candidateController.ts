import { Request, Response } from 'express';
import {
    addCandidate,
    findCandidateById,
    updateCandidateStageForPosition,
    ValidationError,
    NotFoundError,
    ConflictError
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

export const updateCandidateStage = async (req: Request, res: Response) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid candidate ID format' });
    }

    const { positionId, currentInterviewStep } = req.body;
    if (positionId === undefined || currentInterviewStep === undefined) {
        return res.status(400).json({ error: 'positionId and currentInterviewStep are required' });
    }
    const parsedCandidateId = Number(req.params.id);
    const parsedPositionId = typeof positionId === 'number' ? positionId : Number(positionId);
    const parsedCurrentInterviewStep =
        typeof currentInterviewStep === 'number' ? currentInterviewStep : Number(currentInterviewStep);

    if (
        !Number.isInteger(parsedPositionId) ||
        parsedPositionId <= 0 ||
        !Number.isInteger(parsedCurrentInterviewStep) ||
        parsedCurrentInterviewStep <= 0
    ) {
        return res.status(400).json({ error: 'positionId and currentInterviewStep must be positive integers' });
    }

    try {
        const result = await updateCandidateStageForPosition(
            req.prisma,
            parsedCandidateId,
            parsedPositionId,
            parsedCurrentInterviewStep
        );
        return res.status(200).json(result);
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        if (error instanceof ConflictError) {
            return res.status(409).json({ error: error.message });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
};