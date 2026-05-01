import { Router } from 'express';
import { getCandidatesInProcessController } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidatesInProcessController);

export default router;
