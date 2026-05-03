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
 * Minimal `Request` with `params` and an optional `body` (controller tests).
 *
 * @param params - Route param map (e.g. `{ id: '1' }` for `:id` routes).
 * @param body   - Optional JSON body for write endpoints (PUT/POST/PATCH).
 */
export const makeReq = (
  params: Record<string, string>,
  body?: any,
): Partial<Request> => ({
  params,
  body,
});

/**
 * Shape of an `application` row returned from `prisma.application.findUnique`
 * with `include: { position: { select: { interviewFlowId: true } } }` — the
 * exact shape consumed by `candidateStageService`.
 */
export interface ApplicationWithPositionFixture {
  id: number;
  positionId: number;
  candidateId: number;
  applicationDate: Date;
  currentInterviewStep: number;
  notes: string | null;
  position: { interviewFlowId: number };
}

/**
 * Builds a default Application+Position fixture used by the stage-update flow.
 *
 * @param overrides - Partial fields merged over defaults (ids, candidate ownership, flow id, etc.).
 */
export const makeApplicationWithPosition = (
  overrides: Partial<ApplicationWithPositionFixture> = {},
): ApplicationWithPositionFixture => ({
  id: 10,
  positionId: 1,
  candidateId: 5,
  applicationDate: new Date('2024-01-01'),
  currentInterviewStep: 3,
  notes: null,
  position: { interviewFlowId: 1 },
  ...overrides,
});

/**
 * Minimal projection of an `interviewStep` row used by the stage-update flow.
 * The service only reads `id` and `interviewFlowId`; other columns are unused.
 */
export interface InterviewStepFixture {
  id: number;
  interviewFlowId: number;
}

/**
 * Builds a default InterviewStep fixture (defaults to flow 1, id 3).
 *
 * @param overrides - Partial fields merged over defaults (typically `interviewFlowId`).
 */
export const makeInterviewStep = (
  overrides: Partial<InterviewStepFixture> = {},
): InterviewStepFixture => ({
  id: 3,
  interviewFlowId: 1,
  ...overrides,
});

/**
 * Default valid request body for `PUT /candidates/:id/stage`.
 *
 * @param overrides - Partial body fields (used to test missing/invalid fields).
 */
export const makeStageUpdateBody = (
  overrides: Partial<{ applicationId: number; currentInterviewStep: number }> = {},
): { applicationId: number; currentInterviewStep: number } => ({
  applicationId: 10,
  currentInterviewStep: 3,
  ...overrides,
});

/**
 * Minimal Candidate row used to mock `Candidate.findOne` (which calls
 * `prisma.candidate.findUnique` with deep includes). Only `id` is read by
 * the stage-update service; other fields are present so the `Candidate`
 * constructor does not blow up on `undefined` access in the future.
 *
 * @param overrides - Fields merged into the default row (typically `id`).
 * @returns Plain object matching the mocked Prisma `candidate` shape used in stage tests.
 */
export const makeCandidateRow = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: null,
  address: null,
  educations: [],
  workExperiences: [],
  resumes: [],
  applications: [],
  ...overrides,
});
