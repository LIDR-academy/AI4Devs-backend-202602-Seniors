import { Request, Response } from 'express';
import { getCandidatesByPosition } from '../../application/services/applicationService';

export const getCandidatesByPositionController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const positionId = parseInt(req.params.id, 10);
    if (isNaN(positionId)) {
        res.status(400).json({ error: 'Invalid position ID format' });
        return;
    }

    try {
        const candidates = await getCandidatesByPosition(positionId);
        res.status(200).json(candidates);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Position not found') {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
