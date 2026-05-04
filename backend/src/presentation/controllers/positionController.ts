import { Request, Response } from 'express';
import {
    getCandidatesForPosition,
    PositionNotFoundError,
} from '../../application/services/positionService';

export const getCandidatesForPositionController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            res.status(400).json({ error: 'Invalid ID format' });
            return;
        }

        const candidates = await getCandidatesForPosition(id);
        res.status(200).json(candidates);
    } catch (error: unknown) {
        if (error instanceof PositionNotFoundError) {
            res.status(404).json({ error: 'Position not found' });
            return;
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
