export interface ApplicationData {
  id: number;
  positionId: number;
  candidateId: number;
  applicationDate: Date;
  currentInterviewStep: number;
  notes: string | null;
  updatedAt?: Date;
}

export interface IApplicationRepository {
  candidateExists(candidateId: number): Promise<boolean>;
  findByIdAndCandidateId(applicationId: number, candidateId: number): Promise<ApplicationData | null>;
  updateInterviewStep(applicationId: number, newStepId: number, notes?: string): Promise<ApplicationData>;
  isValidInterviewStepForPosition(positionId: number, stepId: number): Promise<boolean>;
  getInterviewStepName(stepId: number): Promise<string | null>;
}
