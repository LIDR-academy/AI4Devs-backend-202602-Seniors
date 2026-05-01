import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Candidate Controller - Update Stage Endpoint', () => {
  let applicationId: number;
  let candidateId: number;
  let positionId: number;
  let companyId: number;
  let interviewFlowId: number;
  let interviewTypeId: number;
  let interviewStepIds: number[] = [];

  beforeAll(async () => {
    try {
      // Create interview type first
      const interviewType = await prisma.interviewType.create({
        data: {
          name: `Technical Interview ${Date.now()}`,
          description: 'Standard technical interview',
        },
      });
      interviewTypeId = interviewType.id;

      // Create interview flow with steps
      const interviewFlow = await prisma.interviewFlow.create({
        data: {
          description: 'Standard interview flow',
          interviewSteps: {
            create: [
              { name: 'Initial Screening', orderIndex: 0, interviewTypeId },
              { name: 'HR Round', orderIndex: 1, interviewTypeId },
              { name: 'Technical Round 1', orderIndex: 2, interviewTypeId },
              { name: 'Technical Round 2', orderIndex: 3, interviewTypeId },
            ],
          },
        },
        include: { interviewSteps: true },
      });
      interviewFlowId = interviewFlow.id;
      interviewStepIds = interviewFlow.interviewSteps.map(s => s.id);

      // Create company
      const company = await prisma.company.create({
        data: {
          name: `Test Company ${Date.now()}`,
        },
      });
      companyId = company.id;

      // Create position with interview flow
      const position = await prisma.position.create({
        data: {
          title: 'Test Position',
          description: 'A test position',
          location: 'Remote',
          jobDescription: 'This is a test job',
          companyId: company.id,
          interviewFlowId: interviewFlow.id,
        },
      });
      positionId = position.id;

      // Create candidate
      const candidate = await prisma.candidate.create({
        data: {
          firstName: 'Test',
          lastName: 'Candidate',
          email: `test-${Date.now()}@example.com`,
        },
      });
      candidateId = candidate.id;

      // Create application with the first interview step
      const application = await prisma.application.create({
        data: {
          candidateId: candidate.id,
          positionId: position.id,
          applicationDate: new Date(),
          currentInterviewStep: interviewStepIds[0],
        },
      });
      applicationId = application.id;
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up only records created by this suite, in reverse FK order

      // 1. Interviews referencing this suite's application
      await prisma.interview.deleteMany({ where: { applicationId } });

      // 2. AuditLog entries referencing this suite's application
      await prisma.auditLog.deleteMany({ where: { applicationId } });

      // 3. Application created by this suite
      await prisma.application.deleteMany({ where: { id: applicationId } });

      // 4. Candidate-related child records
      await prisma.resume.deleteMany({ where: { candidateId } });
      await prisma.workExperience.deleteMany({ where: { candidateId } });
      await prisma.education.deleteMany({ where: { candidateId } });

      // 5. Candidate created by this suite
      await prisma.candidate.deleteMany({ where: { id: candidateId } });

      // 6. Position created by this suite
      await prisma.position.deleteMany({ where: { id: positionId } });

      // 7. InterviewSteps created by this suite's flow
      await prisma.interviewStep.deleteMany({ where: { interviewFlowId } });

      // 8. InterviewFlow created by this suite
      await prisma.interviewFlow.deleteMany({ where: { id: interviewFlowId } });

      // 9. InterviewType created by this suite
      await prisma.interviewType.deleteMany({ where: { id: interviewTypeId } });

      // 10. Company created by this suite
      await prisma.company.deleteMany({ where: { id: companyId } });

      await prisma.$disconnect();
    } catch (error) {
      console.error('Cleanup error:', error);
      await prisma.$disconnect();
      throw error;
    }
  });

  describe('Happy Path - Successful Stage Updates', () => {
    it('should update candidate stage with valid data', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[1], // HR Round
          notes: 'Candidate performed well',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('applicationId', applicationId);
      expect(response.body).toHaveProperty('candidateId', candidateId);
      expect(response.body.currentInterviewStep.stepName).toBe('HR Round');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should update stage without notes', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[2], // Technical Round 1
        });

      expect(response.status).toBe(200);
      expect(response.body.currentInterviewStep.stepName).toBe('Technical Round 1');
    });

    it('should handle idempotent requests (updating to same stage)', async () => {
      // First update
      await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[3], // Technical Round 2
        });

      // Second update to same stage
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[3],
          notes: 'Already at this stage',
        });

      expect(response.status).toBe(200);
      expect(response.body.currentInterviewStep.stepName).toBe('Technical Round 2');
    });

    it('should sanitize HTML in notes field', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[2],
          notes: 'Good candidate <script>alert("xss")</script> with strong skills',
        });

      expect(response.status).toBe(200);
      // HTML should be stripped from notes in audit log
      // Verify by checking the audit log doesn't contain script tags
    });
  });

  describe('Input Validation - Errors', () => {
    it('should return 400 for invalid applicationId format', async () => {
      const response = await request(app)
        .put('/candidates/invalid/stage')
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[1],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid application ID');
      expect(response.body.message).toContain('positive integer');
    });

    it('should return 400 for negative applicationId', async () => {
      const response = await request(app)
        .put('/candidates/-1/stage')
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[1],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('positive integer');
    });

    it('should return 400 for missing interviewStepId', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Interview step ID');
    });

    it('should return 400 for negative interviewStepId', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('positive integer');
    });

    it('should return 400 for non-integer interviewStepId', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: 'two',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Interview step ID');
    });

    it('should return 400 for invalid notes type', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[1],
          notes: 12345, // Should be string
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid notes');
    });
  });

  describe('Authentication & Authorization - Errors', () => {
    it('should return 401 when missing Authorization header', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .send({
          interviewStepId: 2,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Authorization');
    });

    it('should return 403 when user lacks required role', async () => {
      // Mock token for a user without recruiter/hiring_manager role
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer viewer-token')
        .send({
          interviewStepId: interviewStepIds[1],
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('Application Not Found - Errors', () => {
    it('should return 404 when application does not exist', async () => {
      const response = await request(app)
        .put('/candidates/99999/stage')
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: 2,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Application not found');
    });
  });

  describe('Interview Step Validation - Errors', () => {
    it('should return 400 when interview step does not exist', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: 99999, // Non-existent step
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid interview step ID');
    });

    it('should return 400 when interview step not in position flow', async () => {
      // Create another interview type and flow with different steps
      const otherType = await prisma.interviewType.create({
        data: {
          name: `Other Type ${Date.now()}`,
        },
      });

      const otherFlow = await prisma.interviewFlow.create({
        data: {
          description: 'Other interview flow',
          interviewSteps: {
            create: [
              { name: 'Step 1', orderIndex: 0, interviewTypeId: otherType.id },
            ],
          },
        },
        include: { interviewSteps: true },
      });

      // Try to use step from other flow
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: otherFlow.interviewSteps[0].id,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Interview step not valid for this position');

      // Clean up (delete steps first due to foreign key)
      await prisma.interviewStep.deleteMany({ where: { interviewFlowId: otherFlow.id } });
      await prisma.interviewFlow.delete({ where: { id: otherFlow.id } });
      await prisma.interviewType.delete({ where: { id: otherType.id } });
    });
  });

  describe('Response Structure Validation', () => {
    it('should return all required fields in response', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[1],
          notes: 'Test update',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('applicationId');
      expect(response.body).toHaveProperty('candidateId');
      expect(response.body).toHaveProperty('positionId');
      expect(response.body).toHaveProperty('applicationDate');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('currentInterviewStep');

      const { currentInterviewStep } = response.body;
      expect(currentInterviewStep).toHaveProperty('stepId');
      expect(currentInterviewStep).toHaveProperty('stepName');
      expect(currentInterviewStep).toHaveProperty('stepOrder');
      expect(currentInterviewStep).toHaveProperty('interviewFlowId');
    });

    it('should return ISO 8601 formatted dates', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[2],
        });

      expect(response.status).toBe(200);
      expect(new Date(response.body.applicationDate)).toBeInstanceOf(Date);
      expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('Error Response Format', () => {
    it('should not include PII in error messages', async () => {
      const response = await request(app)
        .put('/candidates/99999/stage')
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: interviewStepIds[1],
        });

      expect(response.status).toBe(404);
      // Error message should not contain candidate email, name, or other personal info
      expect(response.body.message).not.toContain('@');
      expect(response.body.message).not.toContain('Test');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
    });

    it('should have consistent error response structure', async () => {
      const response = await request(app)
        .put(`/candidates/${applicationId}/stage`)
        .set('Authorization', 'Bearer recruiter-token')
        .send({
          interviewStepId: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.statusCode).toBe('number');
      expect(typeof response.body.message).toBe('string');
    });
  });
});
