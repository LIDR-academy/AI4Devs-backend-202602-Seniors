const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => ({
        application: {
            findFirst: mockFindFirst,
            update: mockUpdate,
        },
    })),
}));

jest.mock('../../domain/models/Candidate', () => ({ Candidate: {} }));
jest.mock('../../domain/models/Education', () => ({ Education: {} }));
jest.mock('../../domain/models/WorkExperience', () => ({ WorkExperience: {} }));
jest.mock('../../domain/models/Resume', () => ({ Resume: {} }));

import { updateCandidateStage } from './candidateService';

const applicationWithSteps = {
    id: 5,
    positionId: 1,
    candidateId: 7,
    applicationDate: new Date('2024-01-15'),
    currentInterviewStep: 1,
    notes: null,
    position: {
        id: 1,
        interviewFlow: {
            id: 1,
            interviewSteps: [
                { id: 1, name: 'Phone Screen', orderIndex: 1 },
                { id: 2, name: 'Technical Interview', orderIndex: 2 },
                { id: 3, name: 'HR Interview', orderIndex: 3 },
            ],
        },
    },
};

const updatedApplication = {
    id: 5,
    positionId: 1,
    candidateId: 7,
    applicationDate: new Date('2024-01-15'),
    currentInterviewStep: 2,
    notes: null,
    candidate: { id: 7, firstName: 'Ana', lastName: 'García' },
    interviewStep: { id: 2, name: 'Technical Interview', orderIndex: 2 },
};

describe('updateCandidateStage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // CA-1
    describe('CA-1: candidato válido con aplicación activa y stage válido', () => {
        it('actualiza currentInterviewStep y retorna la aplicación con candidate e interviewStep', async () => {
            mockFindFirst.mockResolvedValue(applicationWithSteps);
            mockUpdate.mockResolvedValue(updatedApplication);

            const result = await updateCandidateStage(7, 2);

            expect(result).toEqual(updatedApplication);
            expect(result.currentInterviewStep).toBe(2);
            expect(result.candidate).toBeDefined();
            expect(result.interviewStep).toBeDefined();
        });

        it('llama a findFirst filtrando por candidateId', async () => {
            mockFindFirst.mockResolvedValue(applicationWithSteps);
            mockUpdate.mockResolvedValue(updatedApplication);

            await updateCandidateStage(7, 2);

            expect(mockFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({ where: { candidateId: 7 } })
            );
        });

        it('llama a update con el id de la aplicación y el nuevo stage', async () => {
            mockFindFirst.mockResolvedValue(applicationWithSteps);
            mockUpdate.mockResolvedValue(updatedApplication);

            await updateCandidateStage(7, 2);

            expect(mockUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 5 },
                    data: { currentInterviewStep: 2 },
                })
            );
        });

        it('acepta cualquier step válido del flujo (primero, medio o último)', async () => {
            mockFindFirst.mockResolvedValue(applicationWithSteps);
            mockUpdate.mockResolvedValue({ ...updatedApplication, currentInterviewStep: 3 });

            const result = await updateCandidateStage(7, 3);

            expect(result.currentInterviewStep).toBe(3);
        });
    });

    // CA-2
    describe('CA-2: stage no pertenece al flujo de entrevista de la posición', () => {
        it('lanza error que comienza con "Invalid stage"', async () => {
            mockFindFirst.mockResolvedValue(applicationWithSteps);

            await expect(updateCandidateStage(7, 99)).rejects.toThrow(/^Invalid stage/);
        });

        it('no llama a update cuando el stage es inválido', async () => {
            mockFindFirst.mockResolvedValue(applicationWithSteps);

            await expect(updateCandidateStage(7, 99)).rejects.toThrow();

            expect(mockUpdate).not.toHaveBeenCalled();
        });

        it('rechaza un stage=0 que no existe en el flujo', async () => {
            mockFindFirst.mockResolvedValue(applicationWithSteps);

            await expect(updateCandidateStage(7, 0)).rejects.toThrow(/^Invalid stage/);
        });
    });

    // CA-3
    describe('CA-3: candidato no existe o sin aplicación activa', () => {
        it('lanza error "Candidate not found or has no active application" cuando findFirst retorna null', async () => {
            mockFindFirst.mockResolvedValue(null);

            await expect(updateCandidateStage(999, 2)).rejects.toThrow(
                'Candidate not found or has no active application'
            );
        });

        it('no llama a update cuando el candidato no tiene aplicación', async () => {
            mockFindFirst.mockResolvedValue(null);

            await expect(updateCandidateStage(999, 2)).rejects.toThrow();

            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });
});
