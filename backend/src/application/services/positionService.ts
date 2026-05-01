import { Position, CandidateInProcessDTO } from '../../domain/models/Position';

export const getCandidatesInProcess = async (positionId: number): Promise<CandidateInProcessDTO[]> => {
    const position = await Position.findOne(positionId);
    if (!position) {
        throw new Error('Position not found');
    }
    return Position.findCandidatesInProcess(positionId);
};
