import { Router } from 'express';
import { getCandidates } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidates);

export default router;
