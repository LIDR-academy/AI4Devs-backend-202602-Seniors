import { Request, Response } from 'express';
import { getCandidatesInProcess } from '../../application/services/positionService';

export const getCandidatesInProcessController = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidates = await getCandidatesInProcess(id);
        res.json(candidates);
    } catch (error) {
        if (error instanceof Error && error.message === 'Position not found') {
            return res.status(404).json({ error: 'Position not found' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
