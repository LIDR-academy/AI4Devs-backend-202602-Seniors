import { Router } from 'express';
import { getCandidatesByPositionIdController } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidatesByPositionIdController);

export default router;
