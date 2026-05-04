/**
 * Runtime validation for candidate payloads and stage-update request bodies.
 *
 * Throws `Error` with short English messages (`Invalid …`) consumed by route handlers.
 */
/** Person-name character set aligned with `Candidate` string length limits in Prisma. */
const NAME_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/;
/** RFC 5322–style subset for candidate email (matches existing `POST /candidates` checks). */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
/** Spanish-style mobile prefix `6|7|9` plus eight digits (nine digits total after first). */
const PHONE_REGEX = /^(6|7|9)\d{8}$/;
/** Strict `YYYY-MM-DD` calendar dates for education and experience ranges. */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Field length and format rules mirror `schema.prisma` column sizes where applicable. */

/** @throws Error `Invalid name` when empty, wrong length, or characters outside allowed set. */
const validateName = (name: string) => {
    if (!name || name.length < 2 || name.length > 100 || !NAME_REGEX.test(name)) {
        throw new Error('Invalid name');
    }
};

/** @throws Error `Invalid email` when missing or malformed. */
const validateEmail = (email: string) => {
    if (!email || !EMAIL_REGEX.test(email)) {
        throw new Error('Invalid email');
    }
};

/**
 * Optional field: if `phone` is present it must match Spanish mobile-style pattern (6|7|9 + 8 digits).
 * @throws Error `Invalid phone` when present but invalid.
 */
const validatePhone = (phone: string) => {
    if (phone && !PHONE_REGEX.test(phone)) {
        throw new Error('Invalid phone');
    }
};

/** @throws Error `Invalid date` when missing or not `YYYY-MM-DD`. */
const validateDate = (date: string) => {
    if (!date || !DATE_REGEX.test(date)) {
        throw new Error('Invalid date');
    }
};

/** @throws Error `Invalid address` when present and longer than schema allows. */
const validateAddress = (address: string) => {
    if (address && address.length > 100) {
        throw new Error('Invalid address');
    }
};

/**
 * Validates one education record inside a candidate payload.
 *
 * @param education - Object with `institution`, `title`, `startDate`, optional `endDate`.
 * @throws Error `Invalid institution`, `Invalid title`, `Invalid date`, or `Invalid end date`.
 */
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

/**
 * Validates one work-experience record inside a candidate payload.
 *
 * @param experience - Object with `company`, `position`, `startDate`, optional `description`/`endDate`.
 * @throws Error `Invalid company`, `Invalid position`, `Invalid description`, or date errors as for education.
 */
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

/** @throws Error `Invalid CV data` when `cv` is not `{ filePath: string, fileType: string }`. */
const validateCV = (cv: any) => {
    if (typeof cv !== 'object' || !cv.filePath || typeof cv.filePath !== 'string' || !cv.fileType || typeof cv.fileType !== 'string') {
        throw new Error('Invalid CV data');
    }
};

/**
 * Validates fields required to create a new candidate (name, email, phone, nested collections).
 *
 * When `data.id` is present, assumes an update path and skips checks (see inline comment).
 *
 * @param data - Raw POST body for `POST /candidates`.
 * @throws Error with messages such as `Invalid name`, `Invalid email`, etc.
 */
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

/**
 * Requires a finite integer ≥ 1 (used for Prisma id fields in stage updates).
 *
 * @throws Error `Invalid <fieldName>` when the value is not a positive integer.
 */
const validatePositiveInteger = (value: unknown, fieldName: string) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

/**
 * Validates the JSON body for `PUT /candidates/:id/stage`.
 *
 * @param body - Parsed request body; must be a plain object with positive integer
 *               `applicationId` and `currentInterviewStep`.
 * @returns Normalized `{ applicationId, currentInterviewStep }`.
 * @throws Error `Invalid request body`, `Invalid applicationId`, or `Invalid currentInterviewStep`.
 */
export const validateStageUpdatePayload = (
    body: any,
): { applicationId: number; currentInterviewStep: number } => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('Invalid request body');
    }

    validatePositiveInteger(body.applicationId, 'applicationId');
    validatePositiveInteger(body.currentInterviewStep, 'currentInterviewStep');

    return {
        applicationId: body.applicationId,
        currentInterviewStep: body.currentInterviewStep,
    };
};