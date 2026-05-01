// Feature Flag Middleware for gradual rollout

import { Request, Response, NextFunction } from 'express';

interface FeatureFlags {
  [key: string]: {
    enabled: boolean;
    rolloutPercentage: number; // 0-100
    allowedUserIds?: number[];
  };
}

const isProductionLike = ['staging', 'production'].includes(process.env.NODE_ENV ?? '');

const featureFlags: FeatureFlags = {
  CANDIDATE_STAGE_UPDATE: {
    enabled: isProductionLike,
    rolloutPercentage: isProductionLike ? 100 : 0, // staging/production: fully on; development: opt-in via FEATURE_CANDIDATE_STAGE_UPDATE
  },
  FEATURE_POSITION_CANDIDATES_ENDPOINT: {
    enabled: false,
    rolloutPercentage: 0, // OFF by default everywhere; enable via FEATURE_POSITION_CANDIDATES_ENDPOINT env var
  },
};

// Load from environment variables if provided
const flagFromEnv = process.env.FEATURE_CANDIDATE_STAGE_UPDATE;
if (flagFromEnv !== undefined) {
  const percentage = parseInt(flagFromEnv, 10);
  if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
    featureFlags.CANDIDATE_STAGE_UPDATE.rolloutPercentage = percentage;
    featureFlags.CANDIDATE_STAGE_UPDATE.enabled = percentage > 0;
  }
}

const positionCandidatesFlagFromEnv = process.env.FEATURE_POSITION_CANDIDATES_ENDPOINT;
if (positionCandidatesFlagFromEnv !== undefined) {
  const percentage = parseInt(positionCandidatesFlagFromEnv, 10);
  if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
    featureFlags.FEATURE_POSITION_CANDIDATES_ENDPOINT.rolloutPercentage = percentage;
    featureFlags.FEATURE_POSITION_CANDIDATES_ENDPOINT.enabled = percentage > 0;
  }
}

/**
 * Check if a feature is enabled for a specific user
 * @param featureName - Name of the feature flag
 * @param userId - User ID for percentage-based rollout
 * @returns true if feature is enabled for this user
 */
export const isFeatureEnabled = (featureName: string, userId?: number): boolean => {
  const flag = featureFlags[featureName];
  if (!flag || !flag.enabled) {
    return false;
  }

  // If specific user IDs are allowed, check if this user is in the list
  if (flag.allowedUserIds && flag.allowedUserIds.length > 0) {
    return flag.allowedUserIds.includes(userId || 0);
  }

  // If no specific users, use percentage-based rollout
  if (userId !== undefined) {
    const hash = userId % 100;
    return hash < flag.rolloutPercentage;
  }

  return flag.rolloutPercentage === 100;
};

/**
 * Update feature flag percentage for gradual rollout.
 * Also keeps enabled in sync: percentage > 0 → enabled; percentage === 0 → disabled.
 * @param featureName - Name of the feature flag
 * @param rolloutPercentage - New rollout percentage (0-100)
 */
export const updateFeatureRollout = (featureName: string, rolloutPercentage: number): void => {
  if (featureFlags[featureName]) {
    const clamped = Math.max(0, Math.min(100, rolloutPercentage));
    featureFlags[featureName].rolloutPercentage = clamped;
    featureFlags[featureName].enabled = clamped > 0;
  }
};

/**
 * Get current feature flag status
 */
export const getFeatureFlags = (): FeatureFlags => {
  return { ...featureFlags };
};

/**
 * Disable a feature flag — sets enabled=false and rolloutPercentage=0.
 */
export const disableFeature = (featureName: string): void => {
  if (featureFlags[featureName]) {
    featureFlags[featureName].enabled = false;
    featureFlags[featureName].rolloutPercentage = 0;
  }
};

/**
 * Enable a feature flag at 100% rollout.
 * If rolloutPercentage is already > 0, that value is preserved; otherwise it is set to 100.
 */
export const enableFeature = (featureName: string): void => {
  if (featureFlags[featureName]) {
    featureFlags[featureName].enabled = true;
    if (featureFlags[featureName].rolloutPercentage === 0) {
      featureFlags[featureName].rolloutPercentage = 100;
    }
  }
};

/**
 * Express middleware factory that gates a route on a feature flag.
 * Must be mounted after authMiddleware so req.user is populated.
 * Returns 501 when the feature is disabled or the user is outside the rollout.
 */
export const featureFlagMiddleware = (featureName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.id ? parseInt(req.user.id, 10) : undefined;
    if (!isFeatureEnabled(featureName, userId)) {
      res.status(501).json({
        error: 'Not Implemented',
        statusCode: 501,
        message: `Feature '${featureName}' is not yet available`,
      });
      return;
    }
    next();
  };
};
