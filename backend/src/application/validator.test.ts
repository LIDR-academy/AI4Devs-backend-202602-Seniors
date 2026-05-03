import { validateStageUpdateData, validateCandidateData, ValidationError } from './validator';

describe('validateStageUpdateData', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('should return valid StageUpdateData when all fields are valid', () => {
    const result = validateStageUpdateData({ applicationId: 1, newInterviewStep: 2 });
    expect(result).toEqual({ applicationId: 1, newInterviewStep: 2, notes: undefined });
  });

  it('should return valid data with optional notes', () => {
    const result = validateStageUpdateData({ applicationId: 1, newInterviewStep: 2, notes: 'test' });
    expect(result.notes).toBe('test');
  });

  it('should throw ValidationError when applicationId is missing', () => {
    expect(() => validateStageUpdateData({ newInterviewStep: 2 })).toThrow('Validation failed');
    try {
      validateStageUpdateData({ newInterviewStep: 2 });
    } catch (e) {
      const err = e as ValidationError;
      expect(err.details[0].field).toBe('applicationId');
      expect(err.details[0].message).toBe('Application ID is required');
    }
  });

  it('should throw ValidationError when newInterviewStep is missing', () => {
    expect(() => validateStageUpdateData({ applicationId: 1 })).toThrow('Validation failed');
    try {
      validateStageUpdateData({ applicationId: 1 });
    } catch (e) {
      const err = e as ValidationError;
      expect(err.details[0].field).toBe('newInterviewStep');
    }
  });

  it('should throw ValidationError when applicationId is negative', () => {
    expect(() => validateStageUpdateData({ applicationId: -1, newInterviewStep: 2 })).toThrow('Validation failed');
  });

  it('should throw ValidationError when applicationId is zero', () => {
    expect(() => validateStageUpdateData({ applicationId: 0, newInterviewStep: 2 })).toThrow('Validation failed');
  });

  it('should throw ValidationError when applicationId is not an integer', () => {
    expect(() => validateStageUpdateData({ applicationId: 1.5, newInterviewStep: 2 })).toThrow('Validation failed');
  });

  it('should throw ValidationError when applicationId is not a number', () => {
    expect(() => validateStageUpdateData({ applicationId: 'abc', newInterviewStep: 2 })).toThrow('Validation failed');
  });

  it('should throw ValidationError when newInterviewStep is negative', () => {
    expect(() => validateStageUpdateData({ applicationId: 1, newInterviewStep: -5 })).toThrow('Validation failed');
  });

  it('should throw ValidationError when newInterviewStep is not a number', () => {
    expect(() => validateStageUpdateData({ applicationId: 1, newInterviewStep: 'abc' })).toThrow('Validation failed');
  });

  it('should throw ValidationError when notes exceeds 500 characters', () => {
    expect(() => validateStageUpdateData({ applicationId: 1, newInterviewStep: 2, notes: 'a'.repeat(501) })).toThrow('Validation failed');
    try {
      validateStageUpdateData({ applicationId: 1, newInterviewStep: 2, notes: 'a'.repeat(501) });
    } catch (e) {
      const err = e as ValidationError;
      expect(err.details[0].field).toBe('notes');
      expect(err.details[0].message).toBe('Notes must not exceed 500 characters');
    }
  });

  it('should throw ValidationError when notes is not a string', () => {
    expect(() => validateStageUpdateData({ applicationId: 1, newInterviewStep: 2, notes: 123 })).toThrow('Validation failed');
  });

  it('should accept null applicationId as missing', () => {
    expect(() => validateStageUpdateData({ applicationId: null, newInterviewStep: 2 })).toThrow('Validation failed');
  });

  it('should accept null newInterviewStep as missing', () => {
    expect(() => validateStageUpdateData({ applicationId: 1, newInterviewStep: null })).toThrow('Validation failed');
  });

  it('should collect multiple errors', () => {
    try {
      validateStageUpdateData({});
    } catch (e) {
      const err = e as ValidationError;
      expect(err.details.length).toBe(2);
    }
  });

  it('should accept notes exactly 500 characters', () => {
    const result = validateStageUpdateData({ applicationId: 1, newInterviewStep: 2, notes: 'a'.repeat(500) });
    expect(result.notes).toHaveLength(500);
  });

  it('should accept null notes and return null', () => {
    const result = validateStageUpdateData({ applicationId: 1, newInterviewStep: 2, notes: null });
    expect(result.notes).toBeNull();
  });
});

describe('validateCandidateData', () => {
  const validCandidate = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '612345678',
    address: '123 Main St',
  };

  it('should not throw for valid candidate data', () => {
    expect(() => validateCandidateData(validCandidate)).not.toThrow();
  });

  it('should return early when id is provided (edit mode)', () => {
    expect(() => validateCandidateData({ id: 1 })).not.toThrow();
  });

  it('should throw for invalid firstName', () => {
    expect(() => validateCandidateData({ ...validCandidate, firstName: 'A' })).toThrow('Invalid name');
  });

  it('should throw for invalid lastName', () => {
    expect(() => validateCandidateData({ ...validCandidate, lastName: '' })).toThrow('Invalid name');
  });

  it('should throw for invalid email', () => {
    expect(() => validateCandidateData({ ...validCandidate, email: 'notanemail' })).toThrow('Invalid email');
  });

  it('should throw for invalid phone', () => {
    expect(() => validateCandidateData({ ...validCandidate, phone: '123456789' })).toThrow('Invalid phone');
  });

  it('should not throw for empty phone (optional)', () => {
    expect(() => validateCandidateData({ ...validCandidate, phone: '' })).not.toThrow();
  });

  it('should throw for address exceeding 100 chars', () => {
    expect(() => validateCandidateData({ ...validCandidate, address: 'a'.repeat(101) })).toThrow('Invalid address');
  });

  it('should not throw for empty address (optional)', () => {
    expect(() => validateCandidateData({ ...validCandidate, address: '' })).not.toThrow();
  });

  it('should validate education entries', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      educations: [{ institution: '', title: 'BSc', startDate: '2020-01-01' }],
    })).toThrow('Invalid institution');
  });

  it('should throw for invalid education title', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      educations: [{ institution: 'Uni', title: '', startDate: '2020-01-01' }],
    })).toThrow('Invalid title');
  });

  it('should throw for invalid education startDate', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      educations: [{ institution: 'Uni', title: 'BSc', startDate: 'not-a-date' }],
    })).toThrow('Invalid date');
  });

  it('should throw for invalid education endDate', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      educations: [{ institution: 'Uni', title: 'BSc', startDate: '2020-01-01', endDate: 'bad' }],
    })).toThrow('Invalid end date');
  });

  it('should validate work experience entries', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      workExperiences: [{ company: '', position: 'Dev', startDate: '2020-01-01' }],
    })).toThrow('Invalid company');
  });

  it('should throw for invalid work experience position', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      workExperiences: [{ company: 'Corp', position: '', startDate: '2020-01-01' }],
    })).toThrow('Invalid position');
  });

  it('should throw for work experience description exceeding 200 chars', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      workExperiences: [{ company: 'Corp', position: 'Dev', description: 'a'.repeat(201), startDate: '2020-01-01' }],
    })).toThrow('Invalid description');
  });

  it('should throw for invalid work experience startDate', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      workExperiences: [{ company: 'Corp', position: 'Dev', startDate: 'bad' }],
    })).toThrow('Invalid date');
  });

  it('should throw for invalid work experience endDate', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      workExperiences: [{ company: 'Corp', position: 'Dev', startDate: '2020-01-01', endDate: 'bad' }],
    })).toThrow('Invalid end date');
  });

  it('should validate CV when provided', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      cv: { filePath: '', fileType: 'pdf' },
    })).toThrow('Invalid CV data');
  });

  it('should not validate CV when cv is empty object', () => {
    expect(() => validateCandidateData({ ...validCandidate, cv: {} })).not.toThrow();
  });

  it('should accept valid education with endDate', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      educations: [{ institution: 'Uni', title: 'BSc', startDate: '2020-01-01', endDate: '2024-01-01' }],
    })).not.toThrow();
  });

  it('should accept valid work experience', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      workExperiences: [{ company: 'Corp', position: 'Dev', startDate: '2020-01-01' }],
    })).not.toThrow();
  });

  it('should throw for invalid CV fileType', () => {
    expect(() => validateCandidateData({
      ...validCandidate,
      cv: { filePath: '/path/to/file', fileType: 123 },
    })).toThrow('Invalid CV data');
  });
});
