import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { Position } from '../../domain/models/Position';
import { InterviewStep } from '../../domain/models/InterviewStep';
import { Application } from '../../domain/models/Application';

export class CandidateServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'CandidateServiceError';
        this.statusCode = statusCode;
    }
}

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

export const updateCandidateInterviewStep = async (
    candidateId: number,
    positionId: number,
    interviewStepId: number,
) => {
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
        throw new CandidateServiceError('Invalid candidate ID format', 400);
    }

    if (!Number.isInteger(positionId) || positionId <= 0) {
        throw new CandidateServiceError('Invalid positionId format', 400);
    }

    if (!Number.isInteger(interviewStepId) || interviewStepId <= 0) {
        throw new CandidateServiceError('Invalid interviewStepId format', 400);
    }

    const candidate = await Candidate.findOne(candidateId);
    if (!candidate) {
        throw new CandidateServiceError('Candidate not found', 404);
    }

    const position = await Position.findOne(positionId);
    if (!position) {
        throw new CandidateServiceError('Position not found', 404);
    }

    const interviewStep = await InterviewStep.findOne(interviewStepId);
    if (!interviewStep) {
        throw new CandidateServiceError('Interview step not found', 404);
    }

    if (interviewStep.interviewFlowId !== position.interviewFlowId) {
        throw new CandidateServiceError('Interview step does not belong to the position interview flow', 409);
    }

    const application = await Application.findByCandidateAndPosition(candidateId, positionId);
    if (!application) {
        throw new CandidateServiceError('Application not found', 404);
    }

    if (application.currentInterviewStep === interviewStepId) {
        return application;
    }

    return Application.updateInterviewStep(application.id as number, interviewStepId);
};
