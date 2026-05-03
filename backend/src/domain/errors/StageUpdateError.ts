export enum StageUpdateErrorCode {
  CANDIDATE_NOT_FOUND = 'CANDIDATE_NOT_FOUND',
  APPLICATION_NOT_FOUND = 'APPLICATION_NOT_FOUND',
  INVALID_STEP = 'INVALID_STEP',
}

export class StageUpdateError extends Error {
  constructor(public readonly code: StageUpdateErrorCode) {
    super(code);
    this.name = 'StageUpdateError';
  }
}
