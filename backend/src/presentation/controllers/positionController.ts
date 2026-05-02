import { Request, Response } from 'express';
import { PositionService, PositionNotFoundError } from '../../application/services/positionService';

export const getPositionCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate position ID is numeric
    const positionId = Number(id);
    if (!Number.isInteger(positionId) || positionId <= 0) {
      res.status(400).json({
        error: 'Invalid position ID',
        statusCode: 400,
        message: 'Position ID must be a valid integer',
      });
      return;
    }

    // Extract company context from the authenticated user (populated by authMiddleware)
    const requesterCompanyId = parseInt(req.user?.companyId ?? '0', 10);
    if (!requesterCompanyId || isNaN(requesterCompanyId)) {
      res.status(401).json({
        error: 'Unauthorized',
        statusCode: 401,
        message: 'Company context is missing from authentication token',
      });
      return;
    }

    // Create service and fetch candidates
    const positionService = new PositionService(req.prisma);
    const response = await positionService.getPositionCandidates(positionId, requesterCompanyId);

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'PositionNotFoundError') {
      res.status(404).json({
        error: 'Position not found',
        statusCode: 404,
        message: error.message,
      });
      return;
    }

    console.error('Error fetching position candidates:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      statusCode: 500,
      message: 'An error occurred while fetching position candidates',
    });
  }
};
