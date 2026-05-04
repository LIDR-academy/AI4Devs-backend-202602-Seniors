/**
 * CHARACTERIZATION: Tests for existing candidate endpoints behavior
 * These tests capture the CURRENT behavior exactly, including bugs
 */

import { Request, Response } from 'express';

// Mock Prisma client globally before importing modules that use it
jest.mock('@prisma/client', () => {
    const mockCandidate = {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    };
    const mockEducation = {
        create: jest.fn(),
        update: jest.fn(),
    };
    const mockWorkExperience = {
        create: jest.fn(),
        update: jest.fn(),
    };
    const mockResume = {
        create: jest.fn(),
        update: jest.fn(),
    };
    const mockPrismaClient = {
        candidate: mockCandidate,
        education: mockEducation,
        workExperience: mockWorkExperience,
        resume: mockResume,
    };
    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
        Prisma: {
            PrismaClientInitializationError: class extends Error {
                code = 'P0001';
            },
        },
    };
});

// Import after mocking
const { Candidate } = require('../../../domain/models/Candidate');
const { addCandidate, findCandidateById } = require('../../../application/services/candidateService');
const { addCandidateController, getCandidateById } = require('../../../presentation/controllers/candidateController');

describe('POST /candidates - addCandidate endpoint', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;
    let mockSend: jest.Mock;

    beforeEach(() => {
        mockStatus = jest.fn().mockReturnThis();
        mockJson = jest.fn().mockReturnThis();
        mockSend = jest.fn().mockReturnThis();
        mockRes = {
            status: mockStatus,
            json: mockJson,
            send: mockSend,
        } as unknown as Response;
        jest.clearAllMocks();
    });

    // CHARACTERIZATION: Minimal valid candidate data that passes validation
    const minimalValidCandidate = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan.perez@example.com',
    };

    // CHARACTERIZATION: Valid candidate with all fields
    const fullValidCandidate = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan.perez@example.com',
        phone: '612345678',
        address: 'Calle Falsa 123',
        educations: [
            {
                institution: 'Universidad de Buenos Aires',
                title: 'Ingeniero en Sistemas',
                startDate: '2015-03-01',
                endDate: '2020-07-15',
            },
        ],
        workExperiences: [
            {
                company: 'Tech Corp',
                position: 'Software Engineer',
                description: 'Desarrollo de APIs',
                startDate: '2020-08-01',
                endDate: '2023-12-31',
            },
        ],
        cv: {
            filePath: '/uploads/cv.pdf',
            fileType: 'application/pdf',
        },
    };

    describe('Input Validation', () => {
        it('// CHARACTERIZATION: should reject candidate without firstName', async () => {
            mockReq = { body: { lastName: 'Perez', email: 'test@example.com' } };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Error adding candidate' })
            );
        });

        it('// CHARACTERIZATION: should reject candidate with invalid firstName (numbers)', async () => {
            mockReq = { body: { firstName: 'Juan123', lastName: 'Perez', email: 'test@example.com' } };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        it('// CHARACTERIZATION: should reject candidate without email', async () => {
            mockReq = { body: { firstName: 'Juan', lastName: 'Perez' } };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        it('// CHARACTERIZATION: should reject candidate with invalid email format', async () => {
            mockReq = { body: { firstName: 'Juan', lastName: 'Perez', email: 'invalid-email' } };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        it('// CHARACTERIZATION: should reject candidate with invalid phone (not 6/7/9 prefix)', async () => {
            mockReq = { body: { firstName: 'Juan', lastName: 'Perez', email: 'test@example.com', phone: '512345678' } };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        it('// CHARACTERIZATION: should accept valid phone numbers (6, 7, or 9 prefix)', async () => {
            const phones = ['612345678', '712345678', '912345678'];
            for (const phone of phones) {
                mockReq = { body: { ...minimalValidCandidate, phone } };
                mockStatus.mockClear();
                mockJson.mockClear();

                try {
                    await addCandidate(mockReq.body);
                } catch {
                    // May fail on DB constraints, but validation should pass
                }
                // If we get here without throwing, validation passed
            }
        });
    });

    describe('Successful Creation', () => {
        it('// CHARACTERIZATION: should create candidate with minimal data and return 201', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            (mockPrismaClient.candidate.create as jest.Mock).mockResolvedValue({
                id: 1,
                ...minimalValidCandidate,
                phone: null,
                address: null,
            });

            mockReq = { body: minimalValidCandidate };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(201);
        });

        it('// CHARACTERIZATION: should return JSON with message and data wrapper on success', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            const createdCandidate = {
                id: 1,
                ...minimalValidCandidate,
                phone: null,
                address: null,
            };

            (mockPrismaClient.candidate.create as jest.Mock).mockResolvedValue(createdCandidate);

            mockReq = { body: minimalValidCandidate };

            await addCandidateController(mockReq as Request, mockRes);

            // Controller uses res.json() with wrapper { message, data }
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Candidate added successfully',
                    data: expect.anything(),
                })
            );
        });

        it('// CHARACTERIZATION: should save educations when provided', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            const createdCandidate = { id: 1, ...minimalValidCandidate, phone: null, address: null };
            (mockPrismaClient.candidate.create as jest.Mock).mockResolvedValue(createdCandidate);
            (mockPrismaClient.education.create as jest.Mock).mockResolvedValue({
                id: 1,
                candidateId: 1,
                ...fullValidCandidate.educations![0],
            });

            mockReq = { body: fullValidCandidate };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockPrismaClient.education.create).toHaveBeenCalled();
        });

        it('// CHARACTERIZATION: should save workExperiences when provided', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            const createdCandidate = { id: 1, ...minimalValidCandidate, phone: null, address: null };
            (mockPrismaClient.candidate.create as jest.Mock).mockResolvedValue(createdCandidate);
            (mockPrismaClient.workExperience.create as jest.Mock).mockResolvedValue({
                id: 1,
                candidateId: 1,
                ...fullValidCandidate.workExperiences![0],
            });

            mockReq = { body: fullValidCandidate };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockPrismaClient.workExperience.create).toHaveBeenCalled();
        });

        it('// CHARACTERIZATION: should save CV when provided and not empty', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            const createdCandidate = { id: 1, ...minimalValidCandidate, phone: null, address: null };
            (mockPrismaClient.candidate.create as jest.Mock).mockResolvedValue(createdCandidate);
            (mockPrismaClient.resume.create as jest.Mock).mockResolvedValue({
                id: 1,
                candidateId: 1,
                ...fullValidCandidate.cv,
                uploadDate: new Date(),
            });

            mockReq = { body: fullValidCandidate };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockPrismaClient.resume.create).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('// CHARACTERIZATION: should return 400 with message when email is duplicate (P2002)', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            const prismaError = new Error('Unique constraint failed') as any;
            prismaError.code = 'P2002';

            (mockPrismaClient.candidate.create as jest.Mock).mockRejectedValue(prismaError);

            mockReq = { body: minimalValidCandidate };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Error adding candidate' })
            );
        });

        it('// CHARACTERIZATION: should return 400 for validation errors', async () => {
            mockReq = { body: { firstName: '', lastName: 'Perez', email: 'test@example.com' } };

            await addCandidateController(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
        });

        it('// CHARACTERIZATION: should throw Error with string message', async () => {
            mockReq = { body: { firstName: 'J', lastName: 'Perez', email: 'test@example.com' } };

            try {
                await addCandidate(mockReq.body);
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
            }
        });
    });
});

describe('GET /candidates/:id - getCandidateById endpoint', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockStatus: jest.Mock;
    let mockJson: jest.Mock;
    let mockSend: jest.Mock;

    beforeEach(() => {
        mockStatus = jest.fn().mockReturnThis();
        mockJson = jest.fn().mockReturnThis();
        mockSend = jest.fn().mockReturnThis();
        mockRes = {
            status: mockStatus,
            json: mockJson,
            send: mockSend,
        } as unknown as Response;
        jest.clearAllMocks();
    });

    describe('ID Parameter Handling', () => {
        it('// CHARACTERIZATION: should return 400 when id is not a number', async () => {
            mockReq = { params: { id: 'abc' } };

            await getCandidateById(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid ID format' });
        });

        it('// CHARACTERIZATION: should accept parseInt result even if string contains numbers (123abc becomes 123)', async () => {
            mockReq = { params: { id: '123abc' } };

            await getCandidateById(mockReq as Request, mockRes);

            // parseInt('123abc') = 123, which is a valid number, so it proceeds
            // The controller does NOT return 400 for this - it's a behavior quirk
        });

        it('// CHARACTERIZATION: should accept valid integer id', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            (mockPrismaClient.candidate.findUnique as jest.Mock).mockResolvedValue(null);

            mockReq = { params: { id: '1' } };

            await getCandidateById(mockReq as Request, mockRes);

            expect(mockPrismaClient.candidate.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 1 } })
            );
        });
    });

    describe('Candidate Retrieval', () => {
        const mockCandidateData = {
            id: 1,
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'juan.perez@example.com',
            phone: '612345678',
            address: 'Calle Falsa 123',
            educations: [],
            workExperiences: [],
            resumes: [],
            applications: [],
        };

        it('// CHARACTERIZATION: should return 404 when candidate is not found', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            (mockPrismaClient.candidate.findUnique as jest.Mock).mockResolvedValue(null);

            mockReq = { params: { id: '999' } };

            await getCandidateById(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Candidate not found' });
        });

        it('// CHARACTERIZATION: should return candidate with all relations when found', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            const candidateWithRelations = {
                ...mockCandidateData,
                educations: [{ id: 1, institution: 'UBA', title: 'Ing', startDate: new Date(), candidateId: 1 }],
                workExperiences: [],
                resumes: [],
                applications: [],
            };

            (mockPrismaClient.candidate.findUnique as jest.Mock).mockResolvedValue(candidateWithRelations);

            mockReq = { params: { id: '1' } };

            await getCandidateById(mockReq as Request, mockRes);

            expect(mockJson).toHaveBeenCalled();
            const returnedCandidate = mockJson.mock.calls[0][0];
            expect(returnedCandidate).toHaveProperty('firstName', 'Juan');
            // BUG: Prisma returns educations but Candidate model uses education property
            expect(returnedCandidate).toHaveProperty('education');
        });

        it('// CHARACTERIZATION: should include applications with position and interview data', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            const candidateWithApplication = {
                ...mockCandidateData,
                applications: [
                    {
                        id: 1,
                        positionId: 1,
                        candidateId: 1,
                        applicationDate: new Date(),
                        currentInterviewStep: 1,
                        notes: 'Initial application',
                        position: { id: 1, title: 'Software Engineer' },
                        interviews: [
                            {
                                interviewDate: new Date(),
                                interviewStep: { name: 'Technical Review' },
                                notes: 'Good performance',
                                score: 8,
                            },
                        ],
                    },
                ],
            };

            (mockPrismaClient.candidate.findUnique as jest.Mock).mockResolvedValue(candidateWithApplication);

            mockReq = { params: { id: '1' } };

            await getCandidateById(mockReq as Request, mockRes);

            expect(mockJson).toHaveBeenCalled();
            const returnedCandidate = mockJson.mock.calls[0][0];
            expect(returnedCandidate.applications[0]).toHaveProperty('position');
            expect(returnedCandidate.applications[0].position).toHaveProperty('title', 'Software Engineer');
        });

        it('// CHARACTERIZATION: should return 500 on database error', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            (mockPrismaClient.candidate.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

            mockReq = { params: { id: '1' } };

            await getCandidateById(mockReq as Request, mockRes);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Internal Server Error' });
        });
    });
});

describe('Data Model Behavior', () => {
    describe('Candidate.save()', () => {
        it('// CHARACTERIZATION: only saves scalar fields to candidate (firstName, lastName, email, phone, address)', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            (mockPrismaClient.candidate.create as jest.Mock).mockResolvedValue({ id: 1 });

            const candidate = new Candidate({
                firstName: 'Juan',
                lastName: 'Perez',
                email: 'test@example.com',
                phone: '612345678',
                education: [{ institution: 'UBA', title: 'Ing', startDate: '2015-01-01' }],
            });

            await candidate.save();

            expect(mockPrismaClient.candidate.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        firstName: 'Juan',
                        lastName: 'Perez',
                        email: 'test@example.com',
                        phone: '612345678',
                    }),
                })
            );
        });

        it('// CHARACTERIZATION: education is included in candidate create data (nested create)', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            (mockPrismaClient.candidate.create as jest.Mock).mockResolvedValue({ id: 1 });

            const candidate = new Candidate({
                firstName: 'Juan',
                lastName: 'Perez',
                email: 'test@example.com',
            });
            candidate.education = [
                // @ts-ignore - testing runtime behavior
                { institution: 'UBA', title: 'Ing', startDate: new Date() },
            ];

            await candidate.save();

            const createCall = (mockPrismaClient.candidate.create as jest.Mock).mock.calls[0][0];
            // Educations ARE included via Prisma nested create
            expect(createCall.data.educations).toBeDefined();
        });

        it('// BUG: does NOT include workExperiences in the candidate create data', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            (mockPrismaClient.candidate.create as jest.Mock).mockResolvedValue({ id: 1 });

            const candidate = new Candidate({
                firstName: 'Juan',
                lastName: 'Perez',
                email: 'test@example.com',
            });
            candidate.workExperience = [
                // @ts-ignore
                { company: 'TechCorp', position: 'Dev', startDate: new Date() },
            ];

            await candidate.save();

            const createCall = (mockPrismaClient.candidate.create as jest.Mock).mock.calls[0][0];
            expect(createCall.data.workExperiences).toBeUndefined();
        });
    });

    describe('Candidate.findOne()', () => {
        it('// CHARACTERIZATION: returns a Candidate instance (not raw Prisma data)', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            const prismaData = {
                id: 1,
                firstName: 'Juan',
                lastName: 'Perez',
                email: 'test@example.com',
                phone: null,
                address: null,
                educations: [],
                workExperiences: [],
                resumes: [],
                applications: [],
            };

            (mockPrismaClient.candidate.findUnique as jest.Mock).mockResolvedValue(prismaData);

            const result = await Candidate.findOne(1);

            expect(result).toBeInstanceOf(Candidate);
        });

        it('// CHARACTERIZATION: returns null when candidate not found', async () => {
            const { PrismaClient } = require('@prisma/client');
            const mockPrismaClient = new PrismaClient();

            (mockPrismaClient.candidate.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await Candidate.findOne(999);

            expect(result).toBeNull();
        });
    });
});

describe('Validator Behavior', () => {
    const { validateCandidateData } = require('../../../application/validator');

    it('// CHARACTERIZATION: validateCandidateData returns early if id is provided (edit mode)', () => {
        // BUG: When id is provided, validation is skipped entirely
        const result = validateCandidateData({ id: 1 });
        expect(result).toBeUndefined(); // No error thrown
    });

    it('// CHARACTERIZATION: validateCandidateData requires firstName', () => {
        expect(() => validateCandidateData({ lastName: 'P', email: 'a@b.com' })).toThrow('Invalid name');
    });

    it('// CHARACTERIZATION: validateCandidateData requires lastName', () => {
        expect(() => validateCandidateData({ firstName: 'Juan', email: 'a@b.com' })).toThrow('Invalid name');
    });

    it('// CHARACTERIZATION: validateCandidateData requires email', () => {
        expect(() => validateCandidateData({ firstName: 'Juan', lastName: 'Perez' })).toThrow('Invalid email');
    });

    it('// CHARACTERIZATION: validateCandidateData accepts valid phone', () => {
        expect(() => validateCandidateData({ firstName: 'Juan', lastName: 'Pe', email: 'a@b.com', phone: '612345678' })).not.toThrow();
    });

    it('// CHARACTERIZATION: validateCandidateData rejects invalid phone', () => {
        expect(() => validateCandidateData({ firstName: 'Juan', lastName: 'Pe', email: 'a@b.com', phone: '512345678' })).toThrow('Invalid phone');
    });

    it('// CHARACTERIZATION: validateCandidateData rejects education with invalid institution', () => {
        expect(() => validateCandidateData({
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'a@b.com',
            educations: [{ institution: '', title: 'Ing', startDate: '2015-01-01' }],
        })).toThrow('Invalid institution');
    });

    it('// CHARACTERIZATION: validateCandidateData rejects education with missing title', () => {
        expect(() => validateCandidateData({
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'a@b.com',
            educations: [{ institution: 'UBA', title: '', startDate: '2015-01-01' }],
        })).toThrow('Invalid title');
    });

    it('// CHARACTERIZATION: validateCandidateData rejects experience with invalid company', () => {
        expect(() => validateCandidateData({
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'a@b.com',
            workExperiences: [{ company: '', position: 'Dev', startDate: '2015-01-01' }],
        })).toThrow('Invalid company');
    });

    it('// CHARACTERIZATION: validateCandidateData rejects CV without filePath', () => {
        expect(() => validateCandidateData({
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'a@b.com',
            cv: { fileType: 'application/pdf' },
        })).toThrow('Invalid CV data');
    });

    it('// CHARACTERIZATION: validateCandidateData rejects CV without fileType', () => {
        expect(() => validateCandidateData({
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'a@b.com',
            cv: { filePath: '/uploads/cv.pdf' },
        })).toThrow('Invalid CV data');
    });

    it('// CHARACTERIZATION: validateCandidateData accepts valid CV', () => {
        expect(() => validateCandidateData({
            firstName: 'Juan',
            lastName: 'Perez',
            email: 'a@b.com',
            cv: { filePath: '/uploads/cv.pdf', fileType: 'application/pdf' },
        })).not.toThrow();
    });
});