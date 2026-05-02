import { Request, Response } from 'express';
import { getPositionCandidates, getPositionInterviewSteps } from '../../application/services/positionService';

export const getCandidatesForPosition = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }

    try {
        const candidates = await getPositionCandidates(id);
        if (candidates === null) {
            res.status(404).json({ error: 'Position not found' });
            return;
        }
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getInterviewStepsForPosition = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }

    try {
        const steps = await getPositionInterviewSteps(id);
        if (steps === null) {
            res.status(404).json({ error: 'Position not found' });
            return;
        }
        res.json(steps);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
