export interface ValidationErrorDetail {
    field: string;
    message: string;
}

export class ValidationError extends Error {
    details: ValidationErrorDetail[];
    constructor(message: string, details: ValidationErrorDetail[]) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}

export interface StageUpdateData {
    applicationId: number;
    newInterviewStep: number;
    notes?: string;
}

export const validateStageUpdateData = (data: Record<string, unknown>): StageUpdateData => {
    const errors: ValidationErrorDetail[] = [];

    if (data.applicationId === undefined || data.applicationId === null) {
        errors.push({ field: 'applicationId', message: 'Application ID is required' });
    } else if (typeof data.applicationId !== 'number' || !Number.isInteger(data.applicationId) || data.applicationId <= 0) {
        errors.push({ field: 'applicationId', message: 'Application ID must be a positive integer' });
    }

    if (data.newInterviewStep === undefined || data.newInterviewStep === null) {
        errors.push({ field: 'newInterviewStep', message: 'Interview step ID is required' });
    } else if (typeof data.newInterviewStep !== 'number' || !Number.isInteger(data.newInterviewStep) || data.newInterviewStep <= 0) {
        errors.push({ field: 'newInterviewStep', message: 'Interview step ID must be a positive integer' });
    }

    if (data.notes !== undefined && data.notes !== null) {
        if (typeof data.notes !== 'string') {
            errors.push({ field: 'notes', message: 'Notes must be a string' });
        } else if (data.notes.length > 500) {
            errors.push({ field: 'notes', message: 'Notes must not exceed 500 characters' });
        }
    }

    if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
    }

    return {
        applicationId: data.applicationId as number,
        newInterviewStep: data.newInterviewStep as number,
        notes: data.notes as string | undefined,
    };
};

const NAME_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(6|7|9)\d{8}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

//Length validations according to the database schema

const validateName = (name: string) => {
    if (!name || name.length < 2 || name.length > 100 || !NAME_REGEX.test(name)) {
        throw new Error('Invalid name');
    }
};

const validateEmail = (email: string) => {
    if (!email || !EMAIL_REGEX.test(email)) {
        throw new Error('Invalid email');
    }
};

const validatePhone = (phone: string) => {
    if (phone && !PHONE_REGEX.test(phone)) {
        throw new Error('Invalid phone');
    }
};

const validateDate = (date: string) => {
    if (!date || !DATE_REGEX.test(date)) {
        throw new Error('Invalid date');
    }
};

const validateAddress = (address: string) => {
    if (address && address.length > 100) {
        throw new Error('Invalid address');
    }
};

const validateEducation = (education: any) => {
    if (!education.institution || education.institution.length > 100) {
        throw new Error('Invalid institution');
    }

    if (!education.title || education.title.length > 100) {
        throw new Error('Invalid title');
    }

    validateDate(education.startDate);

    if (education.endDate && !DATE_REGEX.test(education.endDate)) {
        throw new Error('Invalid end date');
    }
};

const validateExperience = (experience: any) => {
    if (!experience.company || experience.company.length > 100) {
        throw new Error('Invalid company');
    }

    if (!experience.position || experience.position.length > 100) {
        throw new Error('Invalid position');
    }

    if (experience.description && experience.description.length > 200) {
        throw new Error('Invalid description');
    }

    validateDate(experience.startDate);

    if (experience.endDate && !DATE_REGEX.test(experience.endDate)) {
        throw new Error('Invalid end date');
    }
};

const validateCV = (cv: any) => {
    if (typeof cv !== 'object' || !cv.filePath || typeof cv.filePath !== 'string' || !cv.fileType || typeof cv.fileType !== 'string') {
        throw new Error('Invalid CV data');
    }
};

export const validateCandidateData = (data: any) => {
    if (data.id) {
        // If id is provided, we are editing an existing candidate, so fields are not mandatory
        return;
    }

    validateName(data.firstName);
    validateName(data.lastName);
    validateEmail(data.email);
    validatePhone(data.phone);
    validateAddress(data.address);

    if (data.educations) {
        for (const education of data.educations) {
            validateEducation(education);
        }
    }

    if (data.workExperiences) {
        for (const experience of data.workExperiences) {
            validateExperience(experience);
        }
    }

    if (data.cv && Object.keys(data.cv).length > 0) {
        validateCV(data.cv);
    }
};