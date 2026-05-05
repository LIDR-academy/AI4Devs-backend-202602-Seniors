import { Request, Response } from 'express';
import { addCandidate, findCandidateById } from '../../application/services/candidateService';
import {
    updateApplicationInterviewStage,
    CandidateStageError,
} from '../../application/services/candidateStageService';

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

type StageBody = {
    positionId?: number;
    interviewStepId?: number;
};

export const putCandidateStage = async (req: Request, res: Response) => {
    try {
        const candidateId = parseInt(req.params.id, 10);
        if (Number.isNaN(candidateId)) {
            return res.status(400).json({ error: 'Identificador de candidato no válido.' });
        }

        const body = req.body as StageBody;
        const positionId = Number(body.positionId);
        const interviewStepId = Number(body.interviewStepId);

        if (!Number.isFinite(positionId) || positionId <= 0) {
            return res.status(400).json({
                error: 'Se requiere positionId (número) en el cuerpo de la petición.',
            });
        }
        if (!Number.isFinite(interviewStepId) || interviewStepId <= 0) {
            return res.status(400).json({
                error: 'Se requiere interviewStepId (número) en el cuerpo de la petición.',
            });
        }

        const updated = await updateApplicationInterviewStage(
            req.prisma,
            candidateId,
            positionId,
            interviewStepId
        );

        return res.json({
            message: 'Etapa de entrevista actualizada correctamente.',
            application: {
                id: updated.id,
                candidate_id: updated.candidateId,
                position_id: updated.positionId,
                current_interview_step: {
                    id: updated.interviewStep.id,
                    name: updated.interviewStep.name,
                    order_index: updated.interviewStep.orderIndex,
                },
            },
        });
    } catch (error) {
        if (error instanceof CandidateStageError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        if (
            error instanceof Error &&
            error.name === 'CandidateStageError' &&
            'statusCode' in error &&
            typeof (error as Error & { statusCode: unknown }).statusCode === 'number'
        ) {
            const e = error as Error & { statusCode: number; message: string };
            return res.status(e.statusCode).json({ error: e.message });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

export { addCandidate };