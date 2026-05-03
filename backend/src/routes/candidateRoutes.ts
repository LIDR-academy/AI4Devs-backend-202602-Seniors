import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { addCandidate, getCandidateById } from '../presentation/controllers/candidateController';
import { ApplicationRepository } from '../infrastructure/repositories/ApplicationRepository';
import { CandidateStageService } from '../application/services/candidateStageService';
import { makeUpdateCandidateStage } from '../presentation/controllers/candidateStageController';

const router = Router();

const prisma = new PrismaClient();
const applicationRepository = new ApplicationRepository(prisma);
const candidateStageService = new CandidateStageService(applicationRepository);

router.put('/:id/stage', makeUpdateCandidateStage(candidateStageService));

router.post('/', async (req, res) => {
  try {
    // console.log(req.body); //Just in case you want to inspect the request body
    const result = await addCandidate(req.body);
    res.status(201).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: "An unexpected error occurred" });
    }
  }
});

router.get('/:id', getCandidateById);

export default router;
