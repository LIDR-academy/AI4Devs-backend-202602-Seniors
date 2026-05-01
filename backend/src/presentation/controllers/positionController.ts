import { Request, Response } from 'express';
import { getCandidatesInProcess } from '../../application/services/positionService';

export const getCandidatesInProcessController = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid position ID format' });
        return;
    }

    try {
        const candidates = await getCandidatesInProcess(id);
        res.status(200).json(candidates);
    } catch (error) {
        if (error instanceof Error && error.message === 'Position not found') {
            res.status(404).json({ error: 'Position not found' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
