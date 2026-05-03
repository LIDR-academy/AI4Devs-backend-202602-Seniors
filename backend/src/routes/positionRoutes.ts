import { Router } from 'express';
import { getCandidatesForPosition } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidatesForPosition);

export default router;
