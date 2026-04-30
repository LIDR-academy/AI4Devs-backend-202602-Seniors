const mockFindMany = jest.fn();
const mockPositionFindOne = jest.fn();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => ({
        application: { findMany: mockFindMany },
    })),
}));

jest.mock('../../domain/models/Position', () => ({
    Position: { findOne: mockPositionFindOne },
}));

import { getCandidatesInProcess } from './positionService';

describe('getCandidatesInProcess', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // CA-1
    describe('CA-1: posición válida con aplicaciones activas', () => {
        it('devuelve array con fullName, currentInterviewStep y averageScore', async () => {
            mockPositionFindOne.mockResolvedValue({ id: 1 });
            mockFindMany.mockResolvedValue([
                {
                    candidate: { firstName: 'John', lastName: 'Doe' },
                    interviewStep: { name: 'Technical Interview' },
                    interviews: [{ score: 4 }, { score: 5 }],
                },
            ]);

            const result = await getCandidatesInProcess(1);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                fullName: 'John Doe',
                currentInterviewStep: 'Technical Interview',
                averageScore: 4.5,
            });
        });

        it('devuelve múltiples candidatos cuando hay varias aplicaciones', async () => {
            mockPositionFindOne.mockResolvedValue({ id: 1 });
            mockFindMany.mockResolvedValue([
                {
                    candidate: { firstName: 'John', lastName: 'Doe' },
                    interviewStep: { name: 'Technical Interview' },
                    interviews: [{ score: 4 }],
                },
                {
                    candidate: { firstName: 'Jane', lastName: 'Smith' },
                    interviewStep: { name: 'HR Interview' },
                    interviews: [{ score: 3 }, { score: 5 }],
                },
            ]);

            const result = await getCandidatesInProcess(1);

            expect(result).toHaveLength(2);
            expect(result[0].fullName).toBe('John Doe');
            expect(result[1].fullName).toBe('Jane Smith');
        });
    });

    // CA-2
    describe('CA-2: cálculo de averageScore', () => {
        it('calcula la media aritmética redondeada a 2 decimales', async () => {
            mockPositionFindOne.mockResolvedValue({ id: 1 });
            mockFindMany.mockResolvedValue([
                {
                    candidate: { firstName: 'Alice', lastName: 'Wonder' },
                    interviewStep: { name: 'Technical' },
                    interviews: [{ score: 1 }, { score: 1 }, { score: 2 }], // 4/3 = 1.33
                },
            ]);

            const result = await getCandidatesInProcess(1);

            expect(result[0].averageScore).toBe(1.33);
        });

        it('devuelve null cuando ninguna entrevista tiene score', async () => {
            mockPositionFindOne.mockResolvedValue({ id: 1 });
            mockFindMany.mockResolvedValue([
                {
                    candidate: { firstName: 'Bob', lastName: 'Builder' },
                    interviewStep: { name: 'Phone Screen' },
                    interviews: [{ score: null }, { score: null }],
                },
            ]);

            const result = await getCandidatesInProcess(1);

            expect(result[0].averageScore).toBeNull();
        });

        it('devuelve null cuando el candidato no tiene entrevistas', async () => {
            mockPositionFindOne.mockResolvedValue({ id: 1 });
            mockFindMany.mockResolvedValue([
                {
                    candidate: { firstName: 'Carol', lastName: 'Danvers' },
                    interviewStep: { name: 'Phone Screen' },
                    interviews: [],
                },
            ]);

            const result = await getCandidatesInProcess(1);

            expect(result[0].averageScore).toBeNull();
        });

        it('ignora entrevistas con score null al calcular la media', async () => {
            mockPositionFindOne.mockResolvedValue({ id: 1 });
            mockFindMany.mockResolvedValue([
                {
                    candidate: { firstName: 'Dave', lastName: 'Banner' },
                    interviewStep: { name: 'Technical' },
                    interviews: [{ score: 4 }, { score: null }, { score: 6 }], // (4+6)/2 = 5
                },
            ]);

            const result = await getCandidatesInProcess(1);

            expect(result[0].averageScore).toBe(5);
        });
    });

    // CA-3
    describe('CA-3: casos límite de positionId', () => {
        it('devuelve array vacío cuando la posición no tiene aplicaciones', async () => {
            mockPositionFindOne.mockResolvedValue({ id: 1 });
            mockFindMany.mockResolvedValue([]);

            const result = await getCandidatesInProcess(1);

            expect(result).toEqual([]);
        });

        it('lanza error "Position not found" cuando el positionId no existe', async () => {
            mockPositionFindOne.mockResolvedValue(null);

            await expect(getCandidatesInProcess(999)).rejects.toThrow('Position not found');
        });

        it('no llama a findMany cuando la posición no existe', async () => {
            mockPositionFindOne.mockResolvedValue(null);

            await expect(getCandidatesInProcess(999)).rejects.toThrow();

            expect(mockFindMany).not.toHaveBeenCalled();
        });
    });
});
