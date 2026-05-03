/**
 * Candidate resource routes mounted at `/candidates` in `index.ts` (`POST /`, `GET /:id`, `PUT /:id/stage`).
 */
import { Router } from 'express';
import {
  addCandidate,
  getCandidateById,
  updateCandidateStage,
} from '../presentation/controllers/candidateController';

const router = Router();

/**
 * Creates a candidate; calls service {@link addCandidate} directly (not {@link addCandidateController}).
 *
 * On success responds **201** with the Prisma create payload. Validation errors yield **400**
 * `{ message }`; unknown failures **500** `{ message }`.
 */
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

/** Loads a single candidate by primary key. */
router.get('/:id', getCandidateById);

/** Updates `Application.currentInterviewStep` for one of the candidate's applications. */
router.put('/:id/stage', updateCandidateStage);

export default router;
