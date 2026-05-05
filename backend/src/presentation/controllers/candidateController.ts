import { Request, Response } from 'express';
import { addCandidate, findCandidateById, getPositionCandidates, updateCandidateStage } from '../../application/services/candidateService';

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

export const getPositionCandidatesController = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id);
        if (isNaN(positionId)) {
            return res.status(400).json({ error: 'Invalid position ID format' });
        }

        const candidates = await getPositionCandidates(positionId);
        res.status(200).json({
            data: candidates,
            count: candidates.length
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if ((error as any).code === 'NOT_FOUND') {
                return res.status(404).json({ error: 'Position not found' });
            }
            console.error('Error fetching position candidates:', error.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.error('Unknown error fetching position candidates:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        const candidateId = parseInt(req.params.id);
        if (isNaN(candidateId)) {
            return res.status(400).json({ error: 'Invalid candidate ID format' });
        }

        const { newStage, userId } = req.body;
        if (!newStage || typeof newStage !== 'string') {
            return res.status(400).json({
                error: 'Invalid request body',
                details: 'newStage is required and must be a string'
            });
        }

        const positionId = req.query.positionId ? parseInt(req.query.positionId as string) : undefined;
        const result = await updateCandidateStage(candidateId, newStage, positionId, userId || 'system');

        res.status(200).json(result);
    } catch (error: unknown) {
        if (error instanceof Error) {
            if ((error as any).code === 'NOT_FOUND') {
                return res.status(404).json({ error: error.message });
            }
            if ((error as any).code === 'INVALID_STAGE') {
                return res.status(400).json({
                    error: 'Invalid interview stage',
                    validStages: (error as any).validStages
                });
            }
            if ((error as any).code === 'NO_APPLICATION') {
                return res.status(404).json({ error: 'Candidate has no application for any position' });
            }
            console.error('Error updating candidate stage:', error.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
        console.error('Unknown error updating candidate stage:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export { addCandidate };