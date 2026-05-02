// ---------------------------------------------------------------------------
// Prisma mock — must be declared BEFORE any module that imports @prisma/client.
// ---------------------------------------------------------------------------
const mockCandidateFindUnique = jest.fn();
const mockCandidateCreate = jest.fn();
const mockEducationCreate = jest.fn();
const mockWorkExperienceCreate = jest.fn();
const mockResumeCreate = jest.fn();
const mockInterviewStepFindUnique = jest.fn();
const mockApplicationFindMany = jest.fn();
const mockApplicationUpdateMany = jest.fn();

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');

  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    candidate: {
      create: mockCandidateCreate,
      update: jest.fn(),
      findUnique: mockCandidateFindUnique,
    },
    education: {
      create: mockEducationCreate,
      update: jest.fn(),
    },
    workExperience: {
      create: mockWorkExperienceCreate,
      update: jest.fn(),
    },
    resume: {
      create: mockResumeCreate,
    },
    interviewStep: {
      findUnique: mockInterviewStepFindUnique,
    },
    application: {
      findMany: mockApplicationFindMany,
      updateMany: mockApplicationUpdateMany,
    },
  }));

  return {
    ...actual,
    PrismaClient: mockPrismaClient,
  };
});

// ---------------------------------------------------------------------------
// Imports (after all jest.mock calls)
// ---------------------------------------------------------------------------
import request from 'supertest';
import express from 'express';
import candidateRoutes from '../../../routes/candidateRoutes';

describe('PUT /candidates/:id/stage', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/candidates', candidateRoutes);
  });

  it('should_return_200_when_update_is_successful', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue({
      id: 5,
      name: 'Technical Interview',
      orderIndex: 2
    });
    mockApplicationFindMany.mockResolvedValue([
      { id: 1, candidateId: 1, positionId: 1, currentInterviewStep: 3 },
      { id: 2, candidateId: 1, positionId: 2, currentInterviewStep: 4 }
    ]);
    mockApplicationUpdateMany.mockResolvedValue({ count: 2 });

    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Candidate stage updated successfully',
      updatedApplications: 2
    });
  });

  it('should_return_400_when_candidate_id_is_not_a_number', async () => {
    const response = await request(app)
      .put('/candidates/abc/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should_return_400_when_candidate_id_is_negative', async () => {
    const response = await request(app)
      .put('/candidates/-1/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should_return_400_when_candidate_id_is_zero', async () => {
    const response = await request(app)
      .put('/candidates/0/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should_return_400_when_interview_step_is_missing', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({})
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should_return_400_when_interview_step_is_null', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: null })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should_return_400_when_interview_step_is_a_string', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 'abc' })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should_return_400_when_interview_step_is_negative', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: -1 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should_return_400_when_interview_step_is_zero', async () => {
    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 0 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should_return_404_when_candidate_is_not_found', async () => {
    mockCandidateFindUnique.mockResolvedValue(null);

    const response = await request(app)
      .put('/candidates/999/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Candidate not found' });
  });

  it('should_return_404_when_interview_step_is_not_found', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue(null);

    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 999 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Interview step not found' });
  });

  it('should_return_400_when_candidate_has_no_applications', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue({
      id: 5,
      name: 'Technical Interview',
      orderIndex: 2
    });
    mockApplicationFindMany.mockResolvedValue([]);

    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Candidate has no applications' });
  });

  it('should_return_500_when_an_unexpected_error_occurs', async () => {
    mockCandidateFindUnique.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .put('/candidates/1/stage')
      .send({ currentInterviewStep: 5 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});
