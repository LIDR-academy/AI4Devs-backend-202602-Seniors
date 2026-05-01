jest.mock('@prisma/client', () => {
    const mockReturnValue = {
        application: { findUnique: jest.fn(), update: jest.fn() },
        interviewStep: { findUnique: jest.fn() },
        position: { findUnique: jest.fn() },
    };
    return {
        PrismaClient: jest.fn().mockReturnValue(mockReturnValue),
    };
});

import { PrismaClient } from '@prisma/client';
import { updateStageController } from '../presentation/controllers/candidateController';

const prismaMock = new PrismaClient() as any;

const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockApplication = {
    id: 10,
    positionId: 1,
    candidateId: 5,
    applicationDate: new Date('2024-01-01'),
    currentInterviewStep: 2,
    notes: null,
    interviews: [],
};

const mockInterviewStep = {
    id: 3,
    interviewFlowId: 7,
    interviewTypeId: 1,
    name: 'Technical Interview',
    orderIndex: 2,
};

const mockPosition = {
    id: 1,
    companyId: 1,
    interviewFlowId: 7,
    title: 'Software Engineer',
    description: 'Software Engineer position',
    status: 'Open',
    isVisible: true,
    location: 'Remote',
    jobDescription: 'Full stack development',
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('PUT /candidates/:id/stage', () => {
    it('returns 400 when candidateId in URL is not a valid integer', async () => {
        const req = { params: { id: 'abc' }, body: { applicationId: 10, newInterviewStepId: 3 } } as any;
        const res = makeRes();

        await updateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid candidate ID format' });
    });

    it('returns 400 when body is missing applicationId', async () => {
        const req = { params: { id: '5' }, body: { newInterviewStepId: 3 } } as any;
        const res = makeRes();

        await updateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid applicationId: must be a positive integer' });
    });

    it('returns 400 when body is missing newInterviewStepId', async () => {
        const req = { params: { id: '5' }, body: { applicationId: 10 } } as any;
        const res = makeRes();

        await updateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid newInterviewStepId: must be a positive integer' });
    });

    it('returns 404 when applicationId does not exist', async () => {
        prismaMock.application.findUnique.mockResolvedValue(null);
        const req = { params: { id: '5' }, body: { applicationId: 99, newInterviewStepId: 3 } } as any;
        const res = makeRes();

        await updateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Application not found' });
    });

    it('returns 400 when applicationId does not belong to the given candidateId', async () => {
        prismaMock.application.findUnique.mockResolvedValue({ ...mockApplication, candidateId: 999 });
        const req = { params: { id: '5' }, body: { applicationId: 10, newInterviewStepId: 3 } } as any;
        const res = makeRes();

        await updateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Application does not belong to this candidate' });
    });

    it('returns 404 when newInterviewStepId does not exist', async () => {
        prismaMock.application.findUnique.mockResolvedValue(mockApplication);
        prismaMock.interviewStep.findUnique.mockResolvedValue(null);
        const req = { params: { id: '5' }, body: { applicationId: 10, newInterviewStepId: 99 } } as any;
        const res = makeRes();

        await updateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'InterviewStep not found' });
    });

    it('returns 400 when newInterviewStepId does not belong to the position interview flow', async () => {
        prismaMock.application.findUnique.mockResolvedValue(mockApplication);
        prismaMock.interviewStep.findUnique.mockResolvedValue({ ...mockInterviewStep, interviewFlowId: 99 });
        prismaMock.position.findUnique.mockResolvedValue(mockPosition);
        const req = { params: { id: '5' }, body: { applicationId: 10, newInterviewStepId: 3 } } as any;
        const res = makeRes();

        await updateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Step does not belong to the position interview flow' });
    });

    it('happy path: updates currentInterviewStep and returns { id, currentInterviewStep }', async () => {
        prismaMock.application.findUnique.mockResolvedValue(mockApplication);
        prismaMock.interviewStep.findUnique.mockResolvedValue(mockInterviewStep);
        prismaMock.position.findUnique.mockResolvedValue(mockPosition);
        prismaMock.application.update.mockResolvedValue({ id: 10, currentInterviewStep: 3 });
        const req = { params: { id: '5' }, body: { applicationId: 10, newInterviewStepId: 3 } } as any;
        const res = makeRes();

        await updateStageController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ id: 10, currentInterviewStep: 3 });
    });
});
