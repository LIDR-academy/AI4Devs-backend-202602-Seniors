import { Request, Response } from 'express';
import { addCandidate, findCandidateById } from '../../application/services/candidateService';
import { CandidateStageService } from '../../application/services/candidateStageService';
import { PrismaClient } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

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

export const updateCandidateStage = async (req: Request & { prisma?: PrismaClient }, res: Response) => {
    try {
        const { applicationId } = req.params;
        const { interviewStepId, notes } = req.body;
        const userId = parseInt(req.user?.id || '0', 10);
        const prisma = req.prisma;

        if (!prisma) {
            return res.status(500).json({
                error: 'Internal server error',
                statusCode: 500,
                message: 'Database connection not available',
            });
        }

        if (!userId || Number.isNaN(userId)) {
            return res.status(401).json({
                error: 'Unauthorized',
                statusCode: 401,
                message: 'User ID not found in request',
            });
        }

        // Validate applicationId
        const parsedApplicationId = parseInt(applicationId, 10);
        if (isNaN(parsedApplicationId) || parsedApplicationId <= 0) {
            return res.status(400).json({
                error: 'Invalid application ID',
                statusCode: 400,
                message: 'Application ID must be a positive integer',
            });
        }

        // Validate interviewStepId
        if (typeof interviewStepId !== 'number' || !Number.isInteger(interviewStepId) || interviewStepId <= 0) {
            return res.status(400).json({
                error: 'Invalid interview step ID',
                statusCode: 400,
                message: 'Interview step ID must be a positive integer',
            });
        }

        // Validate notes if provided
        if (notes !== undefined && typeof notes !== 'string') {
            return res.status(400).json({
                error: 'Invalid notes',
                statusCode: 400,
                message: 'Notes must be a string',
            });
        }

        // Sanitize notes to prevent XSS attacks
        const sanitizedNotes = notes ? sanitizeHtml(notes, { allowedTags: [] }) : undefined;

        // Call service
        const service = new CandidateStageService(prisma);
        const updated = await service.updateStage(parsedApplicationId, interviewStepId, userId, sanitizedNotes);

        res.status(200).json(updated);
    } catch (err: any) {
        // Handle known errors by name (instanceof may not work due to module reloading)
        if (err.name === 'ApplicationNotFoundError') {
            return res.status(404).json({
                error: 'Application not found',
                statusCode: 404,
                message: err.message,
            });
        }

        if (err.name === 'StepNotInFlowError') {
            return res.status(400).json({
                error: 'Interview step not valid for this position',
                statusCode: 400,
                message: err.message,
            });
        }

        if (err.name === 'InvalidInterviewStepError') {
            return res.status(400).json({
                error: 'Invalid interview step ID',
                statusCode: 400,
                message: err.message,
            });
        }

        // Log error for debugging (but don't expose to client)
        console.error('Error updating candidate stage:', err);

        // Return generic error
        res.status(500).json({
            error: 'Internal server error',
            statusCode: 500,
            message: 'An error occurred while updating the candidate stage',
        });
    }
};

export { addCandidate };