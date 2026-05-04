import { Request, Response } from 'express';
import { updateCandidateStage } from '../../application/services/candidateStageService';

export const updateCandidateStageController = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Parse and Validate Candidate ID
        const candidateId = parseInt(req.params.id);
        if (isNaN(candidateId)) {
            res.status(400).json({ error: 'Invalid candidate ID format' });
            return;
        }

        // 2. Parse and Validate Stage ID
        const newStageId = parseInt(req.body.stageId);
        if (isNaN(newStageId)) {
            res.status(400).json({ error: 'Invalid stage ID format' });
            return;
        }

        // 3. Call Service
        const updatedApplication = await updateCandidateStage(candidateId, newStageId);

        // 4. Return Success
        res.status(200).json(updatedApplication);
    } catch (error: unknown) {
        // 5. Error Handling
        if (error instanceof Error) {
            switch (error.message) {
                case 'Candidate not found':
                    res.status(404).json({ error: 'Candidate not found' });
                    break;
                case 'No application found for this candidate':
                    res.status(404).json({ error: 'No application found for this candidate' });
                    break;
                case 'Interview stage not found':
                    res.status(400).json({ error: 'Interview stage not found' });
                    break;
                case 'Invalid stage for this position':
                    res.status(400).json({ error: 'Invalid stage for this position' });
                    break;
                default:
                    res.status(500).json({ error: 'Internal Server Error' });
            }
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
