import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/index';

const prisma = new PrismaClient();

describe('GET /positions/:id/candidates', () => {
  let positionId: number;
  let candidate1Id: number;
  let candidate2Id: number;
  let companyId: number;
  let interviewFlowId: number;
  let interviewTypeId: number;
  let employeeId: number;

  beforeAll(async () => {
    const suffix = Date.now();

    const interviewType = await prisma.interviewType.create({
      data: { name: `Tech ${suffix}`, description: 'Technical assessment' },
    });
    interviewTypeId = interviewType.id;

    const interviewFlow = await prisma.interviewFlow.create({
      data: {
        description: `Test flow ${suffix}`,
        interviewSteps: {
          create: [
            { name: 'Screening', orderIndex: 1, interviewTypeId: interviewType.id },
            { name: 'Technical', orderIndex: 2, interviewTypeId: interviewType.id },
          ],
        },
      },
      include: { interviewSteps: { orderBy: { orderIndex: 'asc' } } },
    });
    interviewFlowId = interviewFlow.id;
    const firstStep = interviewFlow.interviewSteps[0];

    const company = await prisma.company.create({ data: { name: `Co ${suffix}` } });
    companyId = company.id;

    const position = await prisma.position.create({
      data: {
        title: `Engineer ${suffix}`,
        description: 'Test position',
        location: 'Remote',
        jobDescription: 'Build things',
        companyId: company.id,
        interviewFlowId: interviewFlow.id,
      },
    });
    positionId = position.id;

    const employee = await prisma.employee.create({
      data: {
        name: `Interviewer ${suffix}`,
        email: `int-${suffix}@example.com`,
        role: 'Interviewer',
        companyId: company.id,
      },
    });
    employeeId = employee.id;

    // Candidate 1 – has one completed interview with score 4
    const c1 = await prisma.candidate.create({
      data: { firstName: 'Alice', lastName: 'Seeded', email: `alice-${suffix}@example.com` },
    });
    candidate1Id = c1.id;
    const app1 = await prisma.application.create({
      data: {
        candidateId: c1.id,
        positionId: position.id,
        applicationDate: new Date(),
        currentInterviewStep: firstStep.id,
        notes: 'Strong candidate',
      },
    });
    await prisma.interview.create({
      data: {
        applicationId: app1.id,
        interviewStepId: firstStep.id,
        employeeId: employee.id,
        interviewDate: new Date(),
        result: 'Passed',
        score: 4,
      },
    });

    // Candidate 2 – applied but no interviews conducted yet
    const c2 = await prisma.candidate.create({
      data: { firstName: 'Bob', lastName: 'Seeded', email: `bob-${suffix}@example.com` },
    });
    candidate2Id = c2.id;
    await prisma.application.create({
      data: {
        candidateId: c2.id,
        positionId: position.id,
        applicationDate: new Date(),
        currentInterviewStep: firstStep.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.interview.deleteMany({ where: { employee: { id: employeeId } } });
    await prisma.auditLog.deleteMany({ where: { application: { positionId } } });
    await prisma.application.deleteMany({ where: { positionId } });
    await prisma.candidate.deleteMany({ where: { id: { in: [candidate1Id, candidate2Id] } } });
    await prisma.employee.deleteMany({ where: { id: employeeId } });
    await prisma.position.deleteMany({ where: { id: positionId } });
    await prisma.interviewStep.deleteMany({ where: { interviewFlowId } });
    await prisma.interviewFlow.deleteMany({ where: { id: interviewFlowId } });
    await prisma.interviewType.deleteMany({ where: { id: interviewTypeId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app).get(`/positions/${positionId}/candidates`);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 403 when user lacks required role', async () => {
      const res = await request(app)
        .get(`/positions/${positionId}/candidates`)
        .set('Authorization', 'Bearer viewer-token');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  describe('Request parameter parsing', () => {
    it('should return 400 for a non-numeric position ID', async () => {
      const res = await request(app)
        .get('/positions/abc/candidates')
        .set('Authorization', 'Bearer recruiter-token');
      expect(res.status).toBe(400);
    });

    it('should return 400 for a non-positive position ID', async () => {
      const res = await request(app)
        .get('/positions/0/candidates')
        .set('Authorization', 'Bearer recruiter-token');
      expect(res.status).toBe(400);
    });
  });

  describe('Success – 200', () => {
    it('should return correct envelope shape for the seeded position', async () => {
      const res = await request(app)
        .get(`/positions/${positionId}/candidates`)
        .set('Authorization', 'Bearer recruiter-token')
        .set('X-Company-Id', String(companyId));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('positionId', positionId);
      expect(res.body).toHaveProperty('positionTitle');
      expect(res.body).toHaveProperty('candidates');
      expect(Array.isArray(res.body.candidates)).toBe(true);
      expect(res.body.candidates).toHaveLength(2);
    });

    it('should include all required fields for each candidate', async () => {
      const res = await request(app)
        .get(`/positions/${positionId}/candidates`)
        .set('Authorization', 'Bearer recruiter-token')
        .set('X-Company-Id', String(companyId));

      expect(res.status).toBe(200);
      expect(res.body.candidates.length).toBeGreaterThan(0);
      res.body.candidates.forEach((candidate: any) => {
        expect(candidate).toHaveProperty('candidateId');
        expect(candidate).toHaveProperty('fullName');
        expect(candidate).toHaveProperty('email');
        expect(candidate).toHaveProperty('applicationDate');
        expect(candidate).toHaveProperty('currentInterviewStep');
        expect(candidate).toHaveProperty('averageScore');
        expect(candidate).toHaveProperty('totalInterviewsCompleted');
      });
    });

    it('should construct fullName from firstName and lastName', async () => {
      const res = await request(app)
        .get(`/positions/${positionId}/candidates`)
        .set('Authorization', 'Bearer recruiter-token')
        .set('X-Company-Id', String(companyId));

      expect(res.status).toBe(200);
      res.body.candidates.forEach((c: any) => {
        expect(c.fullName).toMatch(/\w+\s+\w+/);
      });
    });

    it('should return a numeric averageScore for candidates with completed interviews', async () => {
      const res = await request(app)
        .get(`/positions/${positionId}/candidates`)
        .set('Authorization', 'Bearer recruiter-token')
        .set('X-Company-Id', String(companyId));

      expect(res.status).toBe(200);
      const alice = res.body.candidates.find((c: any) => c.candidateId === candidate1Id);
      expect(alice).toBeDefined();
      expect(alice.averageScore).toBe(4);
      expect(alice.totalInterviewsCompleted).toBe(1);
    });

    it('should return null averageScore for candidates with no interviews', async () => {
      const res = await request(app)
        .get(`/positions/${positionId}/candidates`)
        .set('Authorization', 'Bearer recruiter-token')
        .set('X-Company-Id', String(companyId));

      expect(res.status).toBe(200);
      const bob = res.body.candidates.find((c: any) => c.candidateId === candidate2Id);
      expect(bob).toBeDefined();
      expect(bob.averageScore).toBeNull();
      expect(bob.totalInterviewsCompleted).toBe(0);
    });
  });

  describe('Error – 404', () => {
    it('should return 404 when position does not exist', async () => {
      const res = await request(app)
        .get('/positions/9999999/candidates')
        .set('Authorization', 'Bearer recruiter-token');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 when requester belongs to a different company', async () => {
      const res = await request(app)
        .get(`/positions/${positionId}/candidates`)
        .set('Authorization', 'Bearer recruiter-token')
        .set('X-Company-Id', '999999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
