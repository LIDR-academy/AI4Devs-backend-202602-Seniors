import { Request, Response } from 'express';
import {
    getCandidatesByPositionId,
    positionExists,
} from '../../application/services/positionCandidateService';

export const getPositionCandidates = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id, 10);
        if (Number.isNaN(positionId)) {
            return res.status(400).json({ error: 'Identificador de posición no válido.' });
        }

        const exists = await positionExists(req.prisma, positionId);
        if (!exists) {
            return res.status(404).json({ error: 'Posición no encontrada.' });
        }

        const candidatos = await getCandidatesByPositionId(req.prisma, positionId);
        return res.json({
            position_id: positionId,
            candidatos,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};
