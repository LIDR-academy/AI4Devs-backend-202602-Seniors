import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';

const prisma = new PrismaClient();

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData);
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData);
    try {
        const savedCandidate = await candidate.save();
        const candidateId = savedCandidate.id;

        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id);
        return candidate;
    } catch (error) {
        console.error('Error finding candidate:', error);
        throw new Error('Error retrieving candidate');
    }
};

export interface UpdateCandidateStageResult {
    message: string;
    updatedApplications: number;
}

export const updateCandidateStage = async (
    candidateId: number,
    interviewStepId: number,
    db: PrismaClient = prisma
): Promise<UpdateCandidateStageResult> => {
    const candidate = await db.candidate.findUnique({
        where: { id: candidateId }
    });

    if (!candidate) {
        throw new Error('Candidate not found');
    }

    const interviewStep = await db.interviewStep.findUnique({
        where: { id: interviewStepId }
    });

    if (!interviewStep) {
        throw new Error('Interview step not found');
    }

    const applications = await db.application.findMany({
        where: { candidateId }
    });

    if (applications.length === 0) {
        throw new Error('Candidate has no applications');
    }

    const result = await db.application.updateMany({
        where: { candidateId },
        data: { currentInterviewStep: interviewStepId }
    });

    return {
        message: 'Candidate stage updated successfully',
        updatedApplications: result.count
    };
};
