export interface ApplicationWithCandidate {
  candidateId: number;
  firstName: string;
  lastName: string;
  currentInterviewStep: number;
  interviews: Array<{ score: number | null }>;
}

export interface IPositionRepository {
  existsById(id: number): Promise<boolean>;
  findCandidatesByPositionId(id: number): Promise<ApplicationWithCandidate[]>;
}
