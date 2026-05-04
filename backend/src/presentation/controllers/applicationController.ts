import { Request, Response } from 'express';
import { getCandidatesByPosition, updateCandidateStage } from '../../application/services/applicationService';

const parseId = (value: string) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};

export const getPositionCandidates = async (req: Request, res: Response) => {
    const positionId = parseId(req.params.id);

    if (!positionId) {
        return res.status(400).json({ message: 'Invalid position ID' });
    }

    try {
        const candidates = await getCandidatesByPosition(positionId);
        return res.json(candidates);
    } catch (error) {
        if (error instanceof Error && error.message === 'Position not found') {
            return res.status(404).json({ message: error.message });
        }

        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const moveCandidateStage = async (req: Request, res: Response) => {
    const candidateId = parseId(req.params.id);
    const currentInterviewStep = Number(req.body.currentInterviewStep ?? req.body.current_interview_step);
    const positionId = req.body.positionId === undefined ? undefined : Number(req.body.positionId);

    if (!candidateId) {
        return res.status(400).json({ message: 'Invalid candidate ID' });
    }

    if (!Number.isInteger(currentInterviewStep) || currentInterviewStep <= 0) {
        return res.status(400).json({ message: 'currentInterviewStep is required and must be a positive integer' });
    }

    if (positionId !== undefined && (!Number.isInteger(positionId) || positionId <= 0)) {
        return res.status(400).json({ message: 'positionId must be a positive integer' });
    }

    try {
        const application = await updateCandidateStage({
            candidateId,
            currentInterviewStep,
            positionId,
        });

        return res.json({ message: 'Candidate stage updated successfully', data: application });
    } catch (error) {
        if (error instanceof Error) {
            if (['Candidate not found', 'Application not found', 'Interview step not found'].includes(error.message)) {
                return res.status(404).json({ message: error.message });
            }

            if (error.message === 'Position ID is required when candidate has multiple applications') {
                return res.status(400).json({ message: error.message });
            }
        }

        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
