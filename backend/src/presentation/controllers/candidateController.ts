import { Request, Response } from 'express';
import { addCandidate, findCandidateById } from '../../application/services/candidateService';
import { updateCandidateStage } from '../../application/services/applicationService';

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

export const updateCandidateStageController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const candidateId = parseInt(req.params.id, 10);
    if (isNaN(candidateId)) {
        res.status(400).json({ error: 'Invalid candidate ID format' });
        return;
    }

    const { applicationId, currentInterviewStep } = req.body as {
        applicationId: unknown;
        currentInterviewStep: unknown;
    };

    if (
        typeof applicationId !== 'number' ||
        typeof currentInterviewStep !== 'number'
    ) {
        res
            .status(400)
            .json({ error: 'applicationId and currentInterviewStep are required numbers' });
        return;
    }

    try {
        const result = await updateCandidateStage(
            candidateId,
            applicationId,
            currentInterviewStep
        );
        res.status(200).json(result);
    } catch (error: unknown) {
        if (error instanceof Error) {
            const notFoundMessages = [
                'Application not found for this candidate',
                'Interview step not found',
            ];
            if (notFoundMessages.includes(error.message)) {
                res.status(404).json({ error: error.message });
                return;
            }
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

