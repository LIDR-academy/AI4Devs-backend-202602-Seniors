import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email?: string;
        companyId?: string;
      };
    }
  }
}

// Mock authentication middleware - in production, this would validate JWT tokens
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // For now, check if Authorization header exists
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      statusCode: 401,
      message: 'Missing Authorization header',
    });
    return;
  }

  // Mock: extract from Bearer token (in production, validate JWT signature)
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  // Known test tokens mapped to { id, role }; unrecognised tokens are rejected.
  // In production replace this map with real JWT verification.
  const tokenMap: Record<string, { id: string; role: string }> = {
    'recruiter-token':       { id: '1', role: 'recruiter' },
    'hiring_manager-token':  { id: '2', role: 'hiring_manager' },
    'viewer-token':          { id: '3', role: 'viewer' },
  };

  const tokenData = tokenMap[token];
  if (!tokenData) {
    res.status(401).json({
      error: 'Unauthorized',
      statusCode: 401,
      message: 'Invalid or unrecognized token',
    });
    return;
  }

  req.user = {
    // In production, id comes from the decoded JWT.
    // In this mock, X-User-Id overrides the token-derived ID for cohort testing.
    id: (req.headers['x-user-id'] as string | undefined) ?? tokenData.id,
    role: tokenData.role,
    // In production, companyId comes from the decoded JWT.
    // In this mock, read from X-Company-Id header for test flexibility.
    companyId: (req.headers['x-company-id'] as string | undefined) ?? '1',
  };

  next();
};

// Authorization middleware: check if user has required role(s)
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        statusCode: 401,
        message: 'User not authenticated',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        statusCode: 403,
        message: `User role '${req.user.role}' does not have permission to access this endpoint`,
      });
      return;
    }

    next();
  };
};
