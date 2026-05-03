/**
 * Shared test fixtures for position–candidate flows.
 *
 * Factories build Prisma-shaped objects and minimal Express `req`/`res` mocks used
 * across service, controller, and integration tests.
 */
import { Request, Response } from 'express';

/** Shape of an `application` row as returned by mocked `findMany` includes. */
export interface ApplicationFixture {
  id: number;
  positionId: number;
  candidateId: number;
  applicationDate: Date;
  currentInterviewStep: number;
  notes: string | null;
  candidate: { id: number; firstName: string; lastName: string };
  interviews: { score: number | null }[];
}

/**
 * Builds a default application fixture; override any field for a specific scenario.
 *
 * @param overrides - Partial fields merged over defaults (ids, candidate, interviews, etc.).
 */
export const makeApplication = (
  overrides: Partial<ApplicationFixture> = {},
): ApplicationFixture => ({
  id: 10,
  positionId: 1,
  candidateId: 5,
  applicationDate: new Date('2024-01-01'),
  currentInterviewStep: 3,
  notes: null,
  candidate: { id: 5, firstName: 'Jane', lastName: 'Doe' },
  interviews: [],
  ...overrides,
});

/**
 * Minimal `position` row for `Position.findOne` / Prisma `findUnique` mocks.
 *
 * @param overrides - Fields merged into defaults (typically `id`).
 */
export const makePosition = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  companyId: 1,
  interviewFlowId: 1,
  title: 'Backend Engineer',
  description: 'Build APIs',
  status: 'Open',
  isVisible: true,
  location: 'Remote',
  jobDescription: 'Job description',
  ...overrides,
});

/**
 * Express `Response` stub with `status` and `json` chained as Jest mocks (controller tests).
 */
export const makeRes = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

/**
 * Minimal `Request` with `params` only (e.g. `{ id: '1' }` for `:id` routes).
 *
 * @param params - Route param map passed to `getPositionCandidates`.
 */
export const makeReq = (params: Record<string, string>): Partial<Request> => ({
  params,
});
