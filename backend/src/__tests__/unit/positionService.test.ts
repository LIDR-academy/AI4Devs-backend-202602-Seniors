import { getCandidatesByPositionId } from '../../application/services/positionService';

// Mock the domain models
jest.mock('../../domain/models/Position');
jest.mock('../../domain/models/Application');
jest.mock('../../domain/models/Interview');

import { Position } from '../../domain/models/Position';
import { Application } from '../../domain/models/Application';

const MockPosition = Position as jest.MockedClass<typeof Position>;
const MockApplication = Application as jest.MockedClass<typeof Application>;

describe('positionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCandidatesByPositionId', () => {
    it('should return list of candidates with fullName, currentInterviewStep, averageScore', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue({
        id: 1,
        title: 'Software Engineer',
        companyId: 1,
        interviewFlowId: 1,
        description: 'Test',
        status: 'Open',
        isVisible: true,
        location: 'Remote',
        jobDescription: 'Test',
      } as any);

      MockApplication.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          positionId: 1,
          candidateId: 1,
          applicationDate: new Date(),
          currentInterviewStep: 1,
          candidate: { firstName: 'John', lastName: 'Doe' },
          interviewStep: { name: 'Technical Interview' },
          interviews: [
            { score: 85, id: 1, applicationId: 1, interviewStepId: 1, employeeId: 1, interviewDate: new Date() },
            { score: 90, id: 2, applicationId: 1, interviewStepId: 1, employeeId: 1, interviewDate: new Date() },
          ],
        },
      ] as any);

      const result = await getCandidatesByPositionId(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        candidateId: 1,
        fullName: 'John Doe',
        currentInterviewStep: 'Technical Interview',
        averageScore: 87.5,
      });
    });

    it('should handle multiple interviews with different scores', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue({ id: 1 } as any);
      MockApplication.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          positionId: 1,
          candidateId: 1,
          applicationDate: new Date(),
          currentInterviewStep: 1,
          candidate: { firstName: 'Jane', lastName: 'Smith' },
          interviewStep: { name: 'HR Interview' },
          interviews: [
            { score: 70 },
            { score: 80 },
            { score: 90 },
            { score: 100 },
          ],
        },
      ] as any);

      const result = await getCandidatesByPositionId(1);

      expect(result[0].averageScore).toBe(85);
    });

    it('should handle single interview', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue({ id: 1 } as any);
      MockApplication.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          positionId: 1,
          candidateId: 1,
          applicationDate: new Date(),
          currentInterviewStep: 1,
          candidate: { firstName: 'Bob', lastName: 'Johnson' },
          interviewStep: { name: 'Final Interview' },
          interviews: [{ score: 95 }],
        },
      ] as any);

      const result = await getCandidatesByPositionId(1);

      expect(result[0].averageScore).toBe(95);
    });

    it('should throw error when position does not exist', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue(null);

      await expect(getCandidatesByPositionId(999)).rejects.toThrow('Position not found');
    });

    it('should return empty array when no candidates for position', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue({ id: 1 } as any);
      MockApplication.findMany = jest.fn().mockResolvedValue([]);

      const result = await getCandidatesByPositionId(1);

      expect(result).toHaveLength(0);
    });

    it('should return null averageScore when candidate has no interviews', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue({ id: 1 } as any);
      MockApplication.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          positionId: 1,
          candidateId: 1,
          applicationDate: new Date(),
          currentInterviewStep: 1,
          candidate: { firstName: 'Alice', lastName: 'Brown' },
          interviewStep: { name: 'Initial Screening' },
          interviews: [],
        },
      ] as any);

      const result = await getCandidatesByPositionId(1);

      expect(result[0].averageScore).toBeNull();
    });

    it('should return null averageScore when all scores are null', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue({ id: 1 } as any);
      MockApplication.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          positionId: 1,
          candidateId: 1,
          applicationDate: new Date(),
          currentInterviewStep: 1,
          candidate: { firstName: 'Charlie', lastName: 'Wilson' },
          interviewStep: { name: 'Technical Screening' },
          interviews: [
            { score: null },
            { score: null },
            { score: null },
          ],
        },
      ] as any);

      const result = await getCandidatesByPositionId(1);

      expect(result[0].averageScore).toBeNull();
    });

    it('should NOT produce NaN when scores are null', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue({ id: 1 } as any);
      MockApplication.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          positionId: 1,
          candidateId: 1,
          applicationDate: new Date(),
          currentInterviewStep: 1,
          candidate: { firstName: 'Test', lastName: 'User' },
          interviewStep: { name: 'Screening' },
          interviews: [
            { score: null as any },
            { score: null as any },
          ],
        },
      ] as any);

      const result = await getCandidatesByPositionId(1);

      // Critical edge case: NaN must NOT be in the response
      expect(Number.isNaN(result[0].averageScore)).toBe(false);
      expect(result[0].averageScore).toBeNull();
    });

    it('should correctly concatenate fullName from firstName and lastName', async () => {
      MockPosition.findOne = jest.fn().mockResolvedValue({ id: 1 } as any);
      MockApplication.findMany = jest.fn().mockResolvedValue([
        {
          id: 1,
          positionId: 1,
          candidateId: 1,
          applicationDate: new Date(),
          currentInterviewStep: 1,
          candidate: { firstName: 'Maria', lastName: 'Garcia' },
          interviewStep: { name: 'Manager Interview' },
          interviews: [{ score: 88 }],
        },
      ] as any);

      const result = await getCandidatesByPositionId(1);

      expect(result[0].fullName).toBe('Maria Garcia');
    });
  });
});
