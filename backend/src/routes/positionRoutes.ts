import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PositionRepository } from '../infrastructure/repositories/PositionRepository';
import { PositionService } from '../application/services/positionService';
import { makeGetPositionCandidates } from '../presentation/controllers/positionController';

const router = Router();

const prisma = new PrismaClient();
const positionRepository = new PositionRepository(prisma);
const positionService = new PositionService(positionRepository);

router.get('/:id/candidates', makeGetPositionCandidates(positionService));

export default router;
